import { type Provider, type Observer } from "./define";
import { browserProvider } from "./BrowserProvider";
import { remoteProvider } from "./RemoteProvider";
import type { BaseLine, LogFile } from "@/modules/base";

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
                name: "文件日志",
                provider: browserProvider
            },
            {
                name: "管道日志",
                provider: remoteProvider
            }
        ];
    }

    setProvider(name: string): void {
        const provider = this.availableProviders().find(provider => provider.name === name);

        if (this.currentProvider === provider) {
            return;
        }

        console.log(`dbg Switched to provider1: ${name}`, this.currentProvider, this.observers);
        // Unsubscribe all observers from old provider
        this.observers.forEach(observer => {
            this.currentProvider.provider.unsubscribe(observer);
        });

        this.currentProvider = provider!;

        // Subscribe all observers to new provider
        this.observers.forEach(observer => {
            this.currentProvider.provider.subscribe(observer);
        });

        console.log(`dbg Switched to provider2: ${name}`, this.currentProvider, this.observers);
    }

    async setup(input: File[] | File | string, reset = false): Promise<void> {
        console.log("setup input:", input);
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
        console.log("dbg eResource input:", resource, this.observers);
        await this.currentProvider.provider.useResource(resource);
        for (const observer of this.observers) {
            observer.onChange();
        }
    }

    useFilter(search: string): Promise<void> {
        return this.currentProvider.provider.useFilter(search);
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

    subscribe(observer: Observer): void {
        this.observers.add(observer);
        this.currentProvider.provider.subscribe(observer);
        console.log("dbg subscribe", this.observers);
    }

    unsubscribe(observer: Observer): void {
        this.observers.delete(observer);
        this.currentProvider.provider.unsubscribe(observer);
    }
}

export const proxyProvider = new ProxyProvider();