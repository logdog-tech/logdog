import { type Provider, type Observer } from "./define";
import { browserProvider } from "./BrowserProvider";
import { remoteProvider } from "./RemoteProvider";
import type { BaseLine, LogFile } from "@/modules/base";
import { DisplayMode } from "@/modules/base";

export interface NamedPrivider {
    name: string,
    provider: Provider
}

class ProxyProvider implements Provider {
    private currentProvider: NamedPrivider;
    private observers: Set<Observer> = new Set();

    constructor() {
        this.currentProvider = this.availableProviders()[0];
    }

    availableProviders(): NamedPrivider[] {
        return [
            {
                name: "fileLog",
                provider: browserProvider
            },
            {
                name: "pipeLog",
                provider: remoteProvider
            }
        ];
    }

    setProvider(name: string): void {
        const provider = this.availableProviders().find(provider => provider.name === name);

        if (this.currentProvider === provider) {
            return;
        }

        // Unsubscribe all observers from old provider
        this.observers.forEach(observer => {
            this.currentProvider.provider.unsubscribe(observer);
        });

        this.currentProvider = provider!;

        // Subscribe all observers to new provider
        this.observers.forEach(observer => {
            this.currentProvider.provider.subscribe(observer);
        });
    }

    async setup(input: File[] | File | string, reset = false): Promise<void> {
        await this.currentProvider.provider.setup(input, reset);

        for (const observer of this.observers) {
            observer.onChange();
        }
    }

    getResources(): LogFile[] {
        const tmp = this.currentProvider.provider.getResources();
        return tmp;
    }

    async useResource(resource: LogFile): Promise<void> {
        await this.currentProvider.provider.useResource(resource);
        for (const observer of this.observers) {
            observer.onChange();
        }
    }

    async markLine(index: number, isMarked: boolean): Promise<void> {
        await this.currentProvider.provider.markLine(index, isMarked);
    }

    useFilter(search: string, options: { caseSensitive: boolean, displayMode: DisplayMode }): Promise<void> {
        return this.currentProvider.provider.useFilter(search, options);
    }

    getTotalLineCount(): Promise<number> {
        return this.currentProvider.provider.getTotalLineCount();
    }

    getFilteredLineCount(): Promise<number> {
        return this.currentProvider.provider.getFilteredLineCount();
    }

    async getLine(index: number): Promise<BaseLine> {
        return await this.currentProvider.provider.getLine(index);
    }

    async getFilteredLine(index: number): Promise<BaseLine> {
        return await this.currentProvider.provider.getFilteredLine(index);
    }


    async getSearchProcess(): Promise<number> {
        return await this.currentProvider.provider.getSearchProcess();
    }

    async useEncoding(encoding: string): Promise<void> {
        await this.currentProvider.provider.useEncoding(encoding);
    }

    subscribe(observer: Observer): void {
        this.observers.add(observer);
        this.currentProvider.provider.subscribe(observer);
    }

    unsubscribe(observer: Observer): void {
        this.observers.delete(observer);
        this.currentProvider.provider.unsubscribe(observer);
    }
}

export const proxyProvider = new ProxyProvider();