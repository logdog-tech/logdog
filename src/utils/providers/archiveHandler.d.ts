export interface ArchiveHandler {
    isArchiveFile(fileName: string): boolean;
    getFileList(rawFile: File): Promise<string[]>;
    extractFile(file: File, filePath: string): Promise<ArrayBuffer | Uint8Array>;
    dispose(): Promise<void>;
}

export declare class ArchiveHandlerImpl implements ArchiveHandler {
    constructor(workerScriptPath: string);
    isArchiveFile(fileName: string): boolean;
    getFileList(rawFile: File): Promise<string[]>;
    extractFile(file: File, filePath: string): Promise<ArrayBuffer | Uint8Array>;
    dispose(): Promise<void>;
}

export function createArchiveHandler(workerScriptPath: string): ArchiveHandler;