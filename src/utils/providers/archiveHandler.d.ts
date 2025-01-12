export interface ArchiveCallback {
    onDiscoverFile(path: string): void;
    onBeforeExtractFile(path: string): void;
    onExtractFile(path: string, data: ArrayBuffer): void;
}

export interface ArchiveHandler {
    isArchiveFile(fileName: string): boolean;
    getFileList(rawFile: File): Promise<string[]>;
    extractFile(file: File, filePath: string): Promise<ArrayBuffer | Uint8Array>;

    processArchiveWithCallbacks(
        archive: File,
        isIgnoreFileFunction: (path: string) => boolean,
        callback: ArchiveCallback,
        prefix = ''
    ): Promise<void>;

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