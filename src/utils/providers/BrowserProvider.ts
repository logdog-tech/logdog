import type { BaseLine } from "@/modules/base";
import { DataAdapter, type BaseAdapter } from "../dataAdapter";
import type { Provider } from "./define";
import { decompress } from "../extractors";

// archiveHandler.js
import { createArchiveHandler } from './archiveHandler';

interface LogFile {
    // 原始文件，即用户从浏览器选择的文件句柄
    rawFile: File;

    // 文件路径，如果是压缩文件，这个路径是一个组合格式，"/a/b/c@/d/e/f.txt"
    path: string;

    size: number;
}


const handler = createArchiveHandler('libarchive.js/dist/worker-bundle.js');

export class BrowserProvider implements Provider {
    files: LogFile[] = [];

    async setup(input: File[] | File | string): Promise<void> {
        if (typeof input === 'string') {
            throw new Error('Not implemented');
        }
        const files = Array.isArray(input) ? input : [input];
        this.files = [];
        for (const rawFile of files) {
            if (handler.isArchiveFile(rawFile.name)) {
                const fileList = await handler.getFileList(rawFile);
                console.log("fileList=", fileList);
                for (const path of fileList) {
                    const logFile = this.convertPathToLogFile(path, rawFile);
                    this.files.push(logFile);
                }
            } else {
                if (!this.shouldIncludeFile(rawFile.name)) {
                    continue;
                }
                const logFile = this.convertPathToLogFile(rawFile.name, rawFile);
                this.files.push(logFile);
            }
        }
    }

    shouldIncludeFile(fileName: string): boolean {
        return !fileName.startsWith('__MACOSX/') &&
            !fileName.startsWith('.') &&
            !fileName.includes('/.') &&
            !fileName.includes('DS_Store')
    }

    async getLines(uri: string): Promise<BaseLine[]> {
        const logFile = this.files.find(file => file.path === uri);
        if (!logFile) {
            throw new Error(`File not found: ${uri}`);
        }

        let binaryData = null;

        if (handler.isArchiveFile(logFile.rawFile.name)) {
            try {
                binaryData = await handler.extractFile(logFile.rawFile, uri);
            } finally {
                await handler.dispose(); // 完成后清理资源，避免内存泄漏
            }
            // 如果binaryData是一个ArrayBuffer，那么需要转换成Uint8Array
            if (binaryData instanceof ArrayBuffer) { // archiveHandler这个库，对于zst格式返回的是ArrayBuffer格式
                binaryData = new Uint8Array(binaryData);
            }
        } else {
            binaryData = await new Uint8Array(await logFile.rawFile.arrayBuffer());
        }
        
        const finalFinalExt = uri.split('.').pop(); // TODO 支持更多格式，以及是否与handler的解压逻辑共用
        if (finalFinalExt === 'gz') {
            binaryData = await decompress(binaryData, 'gzip');
        } else if (finalFinalExt === 'zst') {
            binaryData = await decompress(binaryData, 'zstd');
        }

        const text = new TextDecoder('utf-8').decode(binaryData); // TODO 注意编码
        const rawLines = text.split('\n');
        const finalLines = rawLines.map((line, index) => {
            return {
                filename: logFile.path,
                line: index + 1,
                content: line,
            } as BaseLine;
        });
        return finalLines;
    }

    async getAdapter(uri: string): Promise<BaseAdapter<BaseLine>> {
        const dataAdapter = new DataAdapter<BaseLine>();
        const finalLines = await this.getLines(uri);
        dataAdapter.append(finalLines);
        return dataAdapter;
    }

    getResources(): string[] {
        return this.files.map(file => file.path);
    }

    convertPathToLogFile(path: string, rawFile: File): LogFile {
        const logFile = {} as LogFile;
        logFile.rawFile = rawFile;
        logFile.path = path;
        console.log("convertPathToLogFile", path, rawFile, logFile);
        return logFile;
    }
}