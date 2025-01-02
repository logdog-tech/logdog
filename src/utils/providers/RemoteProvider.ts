import type { BaseLine } from "@/modules/base";
import { type Provider, type Observer } from "./define";

export class RemoteProvider implements Provider {
    observers: Set<Observer> = new Set();
    ws: WebSocket | null = null;
    stopFlag = false;
    private requestId = 0;
    private pendingRequests: Map<string, {
        resolve: (value: any) => void;
        reject: (reason?: any) => void;
        timeout: NodeJS.Timeout;
    }> = new Map();
    currentResource: string | null = null;

    async setup(input: File[] | File | string): Promise<void> {
        if (typeof input !== 'string') {
            console.log("dbg ignore input:", input);
            return;
        }

        if (this.currentResource === input) {
            return;
        }
        this.currentResource = input;

        this.stopFlag = false;
        this.ws = new WebSocket(input);

        this.ws.onopen = () => {
            console.log('WebSocket connection opened');
            this.ws?.send(JSON.stringify({
                type: 'request',
                payload: { start: 0 }
            }));
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };


        this.ws.onmessage = async (event) => {
            if (this.stopFlag) return;
            const msg = JSON.parse(event.data);

            if (msg.type === 'newLineCount') {
                console.log('newLineCount:', msg.payload);
                this.publishOnChange();
            } else if (msg.type === 'response') {
                const requestId = msg.requestId;
                const pendingRequest = this.pendingRequests.get(requestId);
                if (pendingRequest) {
                    clearTimeout(pendingRequest.timeout);
                    this.pendingRequests.delete(requestId);
                    pendingRequest.resolve(msg.payload);
                }
            }
        };

        return Promise.resolve();
    }

    publishOnChange(): void {
        console.log("publishOnChange", this.observers);
        this.observers.forEach(observer => observer.onChange());
    }

    getResources(): string[] {
        return [
            'ws://127.0.0.1:8005/ws'
        ];
    }
    async useResource(resource: string): Promise<void> {
        console.log("useResource", resource);
        await this.setup(resource);
        this.publishOnChange();
    }
    async useFilter(search: string): Promise<void> {
        await this.rpcCall('useFilter', { search });
    }
    async getTotalLineCount(): Promise<number> {
        return await this.rpcCall('getTotalLineCount', {});
    }
    async getFilteredLineCount(): Promise<number> {
        return await this.rpcCall('getFilteredLineCount', {});
    }
    async getLine(index: number): Promise<BaseLine> {
        return await this.rpcCall('getLine', { index });
    }
    async getFilteredLine(index: number): Promise<BaseLine> {
        return await this.rpcCall('getFilteredLine', { index });
    }
    subscribe(observer: Observer): void {
        this.observers.add(observer);
    }
    unsubscribe(observer: Observer): void {
        this.observers.delete(observer);
    }

    private getNextRequestId(): string {
        return (++this.requestId).toString();
    }

    private async rpcCall<T>(method: string, params: any, timeoutMs: number = 5000): Promise<T> {
        return new Promise((resolve, reject) => {
            const requestId = this.getNextRequestId();

            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('WebSocket is not connected'));
                return;
            }

            const timeout = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error(`Timeout: Request ${method} not received within ${timeoutMs}ms`));
            }, timeoutMs);

            this.pendingRequests.set(requestId, {
                resolve,
                reject,
                timeout
            });

            this.ws.send(JSON.stringify({
                type: 'request',
                method,
                params,
                requestId
            }));
        });
    }
}

export const remoteProvider = new RemoteProvider();
