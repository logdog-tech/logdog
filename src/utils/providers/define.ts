import type { BaseLine, LogFile } from "@/modules/base";

export interface Observer {
    onChange(): void;
}

export interface Provider {
    setup(input: File[] | File | string, reset?: boolean): Promise<void>;

    getResources(): LogFile[];

    useResource(resource: LogFile): Promise<void>;
    useFilter(search: string, options: { caseSensitive: boolean, bookmark: boolean }): Promise<void>;

    getTotalLineCount(): Promise<number>;
    getFilteredLineCount(): Promise<number>;
    getLine(index: number): Promise<BaseLine>;
    getFilteredLine(index: number): Promise<BaseLine>;
    getSearchProcess(): Promise<number>;
    useEncoding(encoding: string): Promise<void>;
    subscribe(observer: Observer): void;
    unsubscribe(observer: Observer): void;
}
