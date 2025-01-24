import type { BaseLine, LogFile } from "@/modules/base";
import { SimpleLogFile } from "@/modules/base";
import type { Observer, Provider } from "./define";
import { decompress } from "../extractors";
import { AutoParser } from "../parsers/AutoParser";

// archiveHandler.js
import { createArchiveHandler, type ArchiveCallback } from './archiveHandler';
import { isLogFile } from "../binaryCheck";
import { logMemoryCompressor } from '../memory';

interface ExtendedFile extends File {
    path?: string;
}

class CompressLine implements BaseLine {
    [key: string]: unknown;
    filename: string = "";
    line: number = 0;
    _content: string = "";
    time?: string | undefined;
    pid?: number | undefined;
    tid?: number | undefined;
    level?: string | undefined;
    body?: string | undefined;
    originalIndex: number = 0;
    contentKey: unknown | null = null;

    set content(content: string) {
        this.contentKey = logMemoryCompressor.compress(content);
    }

    get content() {
        return logMemoryCompressor.decompress(this.contentKey);
    }


}

const parser = new AutoParser();

const handler = createArchiveHandler('libarchive.js/dist/worker-bundle.js');

export class BrowserProvider implements Provider {
    files: LogFile[] = [];
    currentFile: LogFile | null = null;
    currentFilter: string = '';
    allLines: BaseLine[] = [];
    filteredLines: BaseLine[] = [];
    observers: Set<Observer> = new Set();
    encoding: string = "utf-8";


    // 用于去重
    fileIds = new Set<string>();

    status: string = "";
    searchSearchProcess: number = 100; // 检索进度
    setuped: boolean = false
    filterVersion: number = 0; // 用于记录当前活跃的过滤器的版本号号

    // 计算进度
    getSetupProgress(): string {
        if (this.setuped) {
            return "";
        }
        const totalFiles = this.files.length;
        const setupedFiles = this.files.filter(f => f.status === "extracted").length;
        return `${setupedFiles}/${totalFiles}`
    }

    async appendToLines(logFile: LogFile, rawFile: ExtendedFile, path: string, binaryData: Uint8Array) {

        const finalFinalExt = path.split('.').pop();
        if (finalFinalExt === 'gz') {
            binaryData = await decompress(binaryData, 'gzip');
        } else if (finalFinalExt === 'zst') {
            binaryData = await decompress(binaryData, 'zstd');
        }


        const text = new TextDecoder(this.encoding).decode(binaryData); // TODO 注意编码
        const rawLines = text.split(/\r?\n/);

        let lastTimeFieldValue = "";
        const finalLines = rawLines.map((line, index) => {
            const fields = parser.parseLine(line);

            const compressLine = new CompressLine();
            compressLine.line = index + 1;
            compressLine.filename = path;
            compressLine.content = line;

            for (const key in fields) {
                compressLine[key] = fields[key];
            }
            if (!compressLine.time) {
                compressLine.time = lastTimeFieldValue;
            }
            lastTimeFieldValue = compressLine.time;

            return compressLine;
        });

        const BATCH_SIZE = 10000;
        for (let i = 0; i < finalLines.length; i += BATCH_SIZE) {
            const batch = finalLines.slice(i, i + BATCH_SIZE);
            this.allLines.push(...batch);
        }

        this.status = `解压进度: ${this.getSetupProgress()}，当前文件:${path}`;

        logFile.status = "extracted";
        logFile.lineCount = finalLines.length;
        this.publishOnChange();
    }

    setupedRawFiles: ExtendedFile[] = [];

    async setup(input: ExtendedFile[] | ExtendedFile | string, reset = false): Promise<void> {
        if (typeof input === 'string') {
            console.log("dbg ignore input:", input);
            return;
        }

        if (reset) {
            this.setupedRawFiles = [];
        }
        this.setupedRawFiles.push(...Array.isArray(input) ? input : [input]);

        this.setuped = false;
        this.status = "正在解析文件"


        if (reset) {
            this.files = [];
            this.allLines = [];
            this.filteredLines = [];
            this.currentFile = null;
            this.currentFilter = '';
            this.fileIds = new Set();
        }

        let files = Array.isArray(input) ? input : [input];

        files = files.filter(f => {
            const identifier = `${f.name}_${f.size}_${f.lastModified}`;
            if (!this.fileIds.has(identifier)) {
                this.fileIds.add(identifier);
                return true;
            }
            return false;
        });

        const waitContinueExtract = [];
        for (const rawFile of files) {
            if (handler.isArchiveFile(rawFile.name)) {
                const archiveCallback: ArchiveCallback = {
                    onDiscoverFile: (path: string) => {
                        const logFile = this.convertPathToLogFile(path, rawFile as ExtendedFile);
                        this.files.push(logFile);

                        this.files.sort((a, b) => {
                            if (a.isLogFile && !b.isLogFile) return -1;
                            if (!a.isLogFile && b.isLogFile) return 1;
                            if (a.path < b.path) return -1;
                            if (a.path > b.path) return 1;
                            return 0;
                        });
                        this.publishOnChange();
                    },
                    onBeforeExtractFile: (path: string) => {
                        const logFile = this.files.find(f => f.path === path);
                        logFile!.status = "extracting";
                        this.publishOnChange();
                    },
                    onExtractFile: async (path: string, data: ArrayBuffer) => {
                        const logFile = this.files.find(f => f.path === path);

                        await this.appendToLines(logFile!, rawFile as ExtendedFile, path, new Uint8Array(data));
                    }
                };
                await handler.processArchiveWithCallbacks(rawFile, path => !isLogFile(path), archiveCallback, rawFile.path);
            } else {
                const logFile = this.convertPathToLogFile(rawFile.path || rawFile.name, rawFile as ExtendedFile);
                this.files.push(logFile);

                this.files.sort((a, b) => {
                    if (a.isLogFile && !b.isLogFile) return -1;
                    if (!a.isLogFile && b.isLogFile) return 1;
                    if (a.path < b.path) return -1;
                    if (a.path > b.path) return 1;
                    return 0;
                });
                this.publishOnChange();

                waitContinueExtract.push(logFile)
            }
        }

        for (const logFile of waitContinueExtract) {
            logFile.status = "extracting";
            const binaryData = await new Uint8Array(await logFile.rawFile.arrayBuffer());
            await this.appendToLines(logFile, logFile.rawFile as ExtendedFile, logFile.rawFile.name, binaryData);
            logFile.status = "extracted";
            this.publishOnChange();
        }

        // 为每个元素添加原始索引
        this.allLines.forEach((item, index) => {
            item.originalIndex = index;
        });

        // 排序
        this.allLines.sort((a, b) => {
            // 如果a或b没有time字段,将其放到最后
            if (!a.time) return 1;
            if (!b.time) return -1;

            // 按time字符串的字典顺序排序
            if (a.time < b.time) return -1;
            if (a.time > b.time) return 1;

            // 如果time相同，按原始索引排序（保持稳定性）
            return a.originalIndex - b.originalIndex;
        });

        this.allLines.forEach((line, index) => {
            line.line = index;
        });


        this.status = "ready"
        this.setuped = true;
    }


    getResources(): LogFile[] {
        return this.files;
    }

    async useResource(uri: LogFile): Promise<void> {
        for (const observer of this.observers) {
            observer.onChange();
        }
    }

    publishOnChange(): void {
        for (const observer of this.observers) {
            observer.onChange();
        }
    }

    async useFilter(search: string): Promise<void> {
        const currentFilterVersion = ++this.filterVersion;
        this.currentFilter = search

        let tmpPatterns = search.split('|');
        // 为了提高，确保性能确保所有以.*，.+ 开头的模式都在最前面加上^
        tmpPatterns = tmpPatterns.map(pattern => {
            if (pattern.startsWith('.*') || pattern.startsWith('.+')) {
                return `^${pattern}`;
            }
            return pattern;
        });
        const finalSearch = tmpPatterns.join('|');

        const regex = new RegExp(finalSearch, 'g'); // TODO 
        this.filteredLines = [];
        let lastDelayTime = Date.now();
        for (let i = 0; i < this.allLines.length; i++) {
            const currentLine = this.allLines[i];
            // !!! 重要A
            // 由于本函数增加[重要B]的逻辑，可能导致useFilter函数存在并行调用问题，因此增加版本号判断，确保只处理最新的任务
            if (this.filterVersion !== currentFilterVersion) {
                console.log(`当前过滤任务已过期，提前中断。filterVersion: ${this.filterVersion}, currentFilterVersion: ${currentFilterVersion}`);
                return;
            }
            regex.lastIndex = 0;
            const match = regex.test(this.allLines[i].content);
            if (match || currentLine.isMarked) { // TODO 支持选项选择是否包含标记
                this.filteredLines.push(this.allLines[i])
            }
            this.allLines[i].isSearched = match;

            // !!! 重要B
            // 为了避免allLines过大+复杂的过滤规则时ANR，这里增加2个逻辑
            // 1. 每隔1000次，则把主线程让出一次，
            // 2. 但又为了避免让出的过于频繁，设置让出的最短间隔为50ms，即保证20的帧率
            if (i % 1000 === 0) {
                this.searchSearchProcess = Math.floor(i / this.allLines.length * 100);
                const now = Date.now();
                if (now - lastDelayTime >= 50) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                    lastDelayTime = now;
                    this.publishOnChange();
                }
            }
        }

        this.searchSearchProcess = 100;
        this.publishOnChange();
    }

    async getTotalLineCount(): Promise<number> {
        if (!this.setuped) {
            return 1;
        }
        return this.allLines.length;
    }
    async getFilteredLineCount(): Promise<number> {
        return this.filteredLines.length;
    }

    async getLine(index: number): Promise<BaseLine> {
        if (!this.setuped) {
            const line = new CompressLine();
            line.line = index;
            line.filename = '';
            line.content = this.status;
            return line;
        }
        return this.allLines[index];
    }

    async getFilteredLine(index: number): Promise<BaseLine> {
        return this.filteredLines[index];
    }

    async getSearchProcess(): Promise<number> {
        return this.searchSearchProcess;
    }

    async useEncoding(encoding: string): Promise<void> {
        this.encoding = encoding;
        return await this.setup(this.setupedRawFiles, true);
    }

    subscribe(observer: Observer): void {
        this.observers.add(observer);
    }
    unsubscribe(observer: Observer): void {
        this.observers.delete(observer);
    }

    shouldIncludeFile(fileName: string): boolean {
        return !fileName.startsWith('__MACOSX/') &&
            !fileName.startsWith('.') &&
            !fileName.includes('/.') &&
            !fileName.includes('DS_Store')
    }

    convertPathToLogFile(path: string, rawFile: ExtendedFile): LogFile {
        return new SimpleLogFile(
            rawFile,
            path,
            rawFile.size,
            isLogFile(path) ? "pending" : "extracted",
            isLogFile(path)
        );
    }
}

export const browserProvider = new BrowserProvider();
