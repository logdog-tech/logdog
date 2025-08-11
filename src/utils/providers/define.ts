import type { BaseLine, LogFile } from "@/modules/base";
import { DisplayMode } from "@/modules/base";

export interface Observer {
    onChange(): void;
    onLoaded?(): void;
}

export interface Provider {
    setup(input: File[] | File | string, reset?: boolean): Promise<void>;

    getResources(): LogFile[];

    useResource(resource: LogFile): Promise<number>;
    useFilter(search: string, options: { caseSensitive: boolean, displayMode: DisplayMode }): Promise<void>;

    getTotalLineCount(): Promise<number>;
    getFilteredLineCount(): Promise<number>;
    getLine(index: number): Promise<BaseLine>;
    getFilteredLine(index: number): Promise<BaseLine>;
    getSearchProcess(): Promise<number>;
    markLine(index: number, isMarked: boolean): Promise<void>;
    useEncoding(encoding: string): Promise<void>;
    subscribe(observer: Observer): void;
    unsubscribe(observer: Observer): void;
}
