import type { BaseLine, LogFile } from "@/modules/base";
import { SimpleLogFile } from "@/modules/base";
import { type Provider, type Observer } from "./define";
import { DisplayMode } from "@/modules/base";

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
    private reconnectTimer: NodeJS.Timeout | null = null;

    async setup(input: File[] | File | string): Promise<void> {
        if (typeof input !== 'string') {
            console.log("dbg ignore input:", input);
            return;
        }

        if (this.currentResource === input) {
            return;
        }
        this.currentResource = input;

        await this.connectWebSocket(input);
        return Promise.resolve();
    }

    private async connectWebSocket(url: string): Promise<void> {
        if (this.ws) {
            this.ws.close();
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }

        this.stopFlag = false;
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            console.log('WebSocket connection opened');
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
                this.reconnectTimer = null;
            }
            this.ws?.send(JSON.stringify({
                type: 'request',
                payload: { start: 0 }
            }));
            this.publishOnChange();
        };

        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
            this.publishOnChange();
            if (!this.stopFlag && !this.reconnectTimer) {
                console.log('Attempting to reconnect in 5 seconds...');
                this.reconnectTimer = setTimeout(() => {
                    this.connectWebSocket(url);
                }, 5000);
            }
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.publishOnChange();
            if (!this.stopFlag && !this.reconnectTimer) {
                console.log('Connection error, attempting to reconnect in 5 seconds...');
                this.reconnectTimer = setTimeout(() => {
                    this.connectWebSocket(url);
                }, 5000);
            }
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
    }

    publishOnChange(): void {
        console.log("publishOnChange", this.observers);
        this.observers.forEach(observer => observer.onChange());
    }

    getResources(): LogFile[] {
        const androidLogFile = new SimpleLogFile(new File([], ""), "ws://127.0.0.1:8005/ws", 0, "notConnected", false);
        androidLogFile.isRemoteMode = true;
        androidLogFile.name = "默认设备";
        androidLogFile.desc = "默认设备日志";

        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            androidLogFile.status = "isConnected";
        } else {
            // html片段的帮助内容，引导至/docs/index.html
            const helpContent = `未找到设备, <a href="docs/index.html" target="_blank">查看文档</a>获取帮助`;
            androidLogFile.status = "notConnected";
            androidLogFile.desc = helpContent;
        }

        return [
            androidLogFile
        ];
    }
    async useResource(resource: LogFile): Promise<number> {
        console.log("useResource", resource);
        if (resource.isRemoteMode && resource.path) {
            await this.connectWebSocket(resource.path);
        }
        return -1;
    }
    async markLine(index: number, isMarked: boolean): Promise<void> {
        await this.rpcCall('markLine', { index, isMarked });
    }
    async useFilter(search: string, options: { caseSensitive: boolean,  displayMode: DisplayMode }): Promise<void> {
        await this.rpcCall('useFilter', { search, options });
    }
    async getTotalLineCount(): Promise<number> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return 0;
        }
        return await this.rpcCall('getTotalLineCount', {});
    }
    async getFilteredLineCount(): Promise<number> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return 0;
        }
        return await this.rpcCall('getFilteredLineCount', {});
    }
    async getLine(index: number): Promise<BaseLine> {
        return await this.rpcCall('getLine', { index });
    }
    async getFilteredLine(index: number): Promise<BaseLine> {
        return await this.rpcCall('getFilteredLine', { index });
    }
    async getSearchProcess(): Promise<number> {
        return 100; // TODO 
    }
    async useEncoding(encoding: string): Promise<void> {
        await this.rpcCall('useEncoding', { encoding }); // TODO 实现useEncoding
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
