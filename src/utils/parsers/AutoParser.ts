import { formatTimestamp, init } from "@/utils/dataFormatter";

interface FormatConfig {
    title: string;
    description: string;
    url: string;
    regex: {
        [name: string]: {
            pattern: string;
            timestamp_format: string;
            samples?: string[];
        };
    };
    level_field: string;
    level: {
        [name: string]: string;
    };
    value: {
        [name: string]: {
            kind: "number" | "string" | "boolean" | "timestamp";
            identifier: boolean;
        };
    };
}

const formatConfig: FormatConfig = {
    title: "Example Log Format",
    description: "Log format used in the documentation example.",
    url: "http://example.com/log-format.html",
    regex: {
        android2: {
            pattern: "^(?<time>[\\d- ]+\\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d\\d\\d\\d)\\s+(?<pid>\\d+)\\s+(?<tid>\\d+)\\s+(?<level>\\w)\\s+",
            timestamp_format: "%m-%d %H:%M:%S.%f",
        },
        android1: {
            pattern: "^(?<time>[\\d- ]+\\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d)\\s+(?<pid>\\d+)\\s+(?<tid>\\d+)\\s+(?<level>\\w)\\s+",
            timestamp_format: "m-%d %H:%M:%S.%f",
            samples: [ 
                "12-17 20:52:03.168  3218  3218 I QImsService: ImsServiceSub : handleSsac voice = 255",
                "12-17 20:52:03.168  3218  3218 I SendBroadcastPermission: action:org.codeaurora.VOIP_VOPS_SSAC_STATUS, mPermissionType:0",
            ],
        },
        android3: { // 带有android uid的日志
            pattern: "^(?<time>[\\d- ]+\\d\\d:\\d\\d:\\d\\d\\.\\d\\d\\d)\\s+(?<uid>\\d+)\\s+(?<pid>\\d+)\\s+(?<tid>\\d+)\\s+(?<level>\\w)\\s+",
            timestamp_format: "m-%d %H:%M:%S.%f",
            samples: [
                "02-26 19:34:47.283  1000  4739  4739 E AndroidRuntime: 	at android.app.ActivityThread.main(ActivityThread.java:9570) ",
                "02-26 19:34:47.283  1000  4739  4739 E AndroidRuntime: 	at com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run(RuntimeInit.java:604) "
            ],
        },
    },
    level_field: "level",
    level: {
        error: "ERROR",
        warning: "WARNING",
    },
    value: {
        time: {
            kind: "string",
            identifier: false,
        },
        uid: {
            kind: "number",
            identifier: false,
        },
        pid: {
            kind: "number",
            identifier: false,
        },
        tid: {
            kind: "number",
            identifier: false,
        },
        level: {
            kind: "string",
            identifier: false,
        },
        data: {
            kind: "string",
            identifier: false,
        },
    },
};

export class AutoParser {
    private config: FormatConfig;
    private compiledRegex: RegExp[];
    private fieldHandlers: Map<string, (value: string) => any>;
    private timestampCache: Map<string, number>;

    constructor() {
        this.config = formatConfig;
        this.compiledRegex = Object.values(this.config.regex).map(regex => new RegExp(regex.pattern));
        this.fieldHandlers = new Map();
        this.timestampCache = new Map();

        // 初始化字段处理逻辑
        for (const [name, config] of Object.entries(this.config.value)) {
            if (config.kind === "number") {
                this.fieldHandlers.set(name, (value: string) => Number(value));
            } else if (config.kind === "boolean") {
                this.fieldHandlers.set(name, (value: string) => value === "true");
            } else if (config.kind === "timestamp") {
                this.fieldHandlers.set(name, async (value: string) =>
                    await this.getCachedTimestamp(value, this.getTimestampFormat(name))
                );
            } else {
                this.fieldHandlers.set(name, (value: string) => value);
            }
        }
    }

    private getTimestampFormat(fieldName: string): string {
        for (const regex of Object.values(this.config.regex)) {
            if (regex.pattern.includes(`(?<${fieldName}>`)) {
                return regex.timestamp_format;
            }
        }
        return "";
    }

    private async getCachedTimestamp(value: string, format: string): Promise<number> {
        const cacheKey = `${value}|${format}`;
        if (this.timestampCache.has(cacheKey)) {
            return this.timestampCache.get(cacheKey)!;
        }
        const timestamp = await formatTimestamp(value, format);
        this.timestampCache.set(cacheKey, timestamp);
        return timestamp;
    }

    parseLine(line: string): { [name: string]: string | number | boolean | Date } | null {
        // 快速失败：如果日志行过短或不符合基本格式，直接返回 null
        if (line.length < 20 || !/\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(line)) {
            return null;
        }

        const row: { [name: string]: string | number | boolean | Date } = {};

        for (const regex of this.compiledRegex) {
            const match = regex.exec(line);
            if (match?.groups) {
                for (const [name, value] of Object.entries(match.groups)) {
                    if (this.fieldHandlers.has(name)) {
                        row[name] = this.fieldHandlers.get(name)!(value);
                    } else {
                        row[name] = value;
                    }
                }
                return row;
            }
        }
        return null;
    }

    parseLines(lines: string[]): { [name: string]: string | number | boolean | Date }[] {
        const results: { [name: string]: string | number | boolean | Date }[] = [];
        for (const line of lines) {
            const result = this.parseLine(line);
            if (result) {
                results.push(result);
            }
        }
        return results;
    }

    /**
     * 批量处理函数，锁定首次匹配成功的正则表达式
     * @param lines 日志行数组
     * @param sampleSize 在前多少行中尝试匹配正则表达式（默认 1000）
     * @returns 解析结果数组和错误行数
     */
    parseLinesOptimized(
        lines: string[],
        sampleSize: number = 1000
    ): { results: { [name: string]: string | number | boolean | Date }[]; errorLineCount: number } {
        const results: { [name: string]: string | number | boolean | Date }[] = [];

        // 1. 在前 sampleSize 行中尝试匹配正则表达式
        let lockedRegex: RegExp | null = null;
        for (let i = 0; i < Math.min(sampleSize, lines.length); i++) {
            const line = lines[i];
            for (const regex of this.compiledRegex) {
                const match = regex.exec(line);
                if (match?.groups) {
                    lockedRegex = regex; // 锁定匹配成功的正则表达式
                    break;
                }
            }
            if (lockedRegex) {
                break; // 找到匹配的正则表达式后立即退出
            }
        }

        // 2. 如果没有找到匹配的正则表达式，记录错误行数并跳过本批次
        if (!lockedRegex) {
            return {
                results: [],
                errorLineCount: lines.length, // 记录整个批次的错误行数
            };
        }

        // 3. 使用锁定的正则表达式解析所有日志行
        for (const line of lines) {
            const match = lockedRegex.exec(line);
            if (match?.groups) {
                const row: { [name: string]: string | number | boolean | Date } = {};
                for (const [name, value] of Object.entries(match.groups)) {
                    if (this.fieldHandlers.has(name)) {
                        row[name] = this.fieldHandlers.get(name)!(value);
                    } else {
                        row[name] = value;
                    }
                }
                results.push(row);
            }
        }

        return {
            results,
            errorLineCount: 0, // 没有错误行
        };
    }
}