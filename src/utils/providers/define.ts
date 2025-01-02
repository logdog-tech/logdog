import type { BaseLine } from "@/modules/base";

export interface Observer {
    onChange(): void;
}

export interface Provider {
    setup(input: File[] | File | string): Promise<void>;

    getResources(): string[];

    useResource(resource: string): Promise<void>;
    useFilter(search: string): Promise<void>;

    getTotalLineCount(): Promise<number>;
    getFilteredLineCount(): Promise<number>;
    getLine(index: number): Promise<BaseLine>;
    getFilteredLine(index: number): Promise<BaseLine>;

    subscribe(observer: Observer): void;
    unsubscribe(observer: Observer): void;
}
