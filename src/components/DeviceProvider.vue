<template>
  <div>
    <button @click="test">Test</button>
  </div>
</template>
<script lang="ts">

const data_api_address = 'http://127.0.0.1:8005/'
import type { BaseLine } from '@/modules/base'
import { dataAdapter } from '@/utils/dataAdapter'
import { get } from 'http'
import { defineComponent } from 'vue'

interface WebSocketMessage {
    type: string;
    data: any;
}

const defaultConfig = {
    credentials: 'include',
    headers: {
        'Content-Type': 'application/text'
    } as Record<string, string>
}
const dataApi = {
    async getLineCount(): Promise<string> {
        const response = await fetch(`${data_api_address}/count`, {
            ...defaultConfig,
            method: 'GET'
        } as RequestInit)
        if (!response.ok) throw new Error('Failed to get user info')
        return response.text()
    },
    async getLines(start: number, end: number): Promise<string> {
        const response = await fetch(`${data_api_address}/lines?start=${start}&end=${end}`, {
            ...defaultConfig,
            method: 'GET'
        } as RequestInit)
        if (!response.ok) throw new Error('Failed to get user info')
        return response.text()
    },
}
export default defineComponent({
    name: 'DataProvider',
    props: {
        isSelectedFileMode: Boolean,
    },
    emits: {
        'fileLoaded': (content: string, name: string) => true,
        'switchToListMode': () => true,
    },
    components: {
    },
    data() {
        return {
            ws: null as WebSocket | null,
            hasRequestFirstChunk: false,
        }
    },
    async mounted() {
        this.ws = new WebSocket('ws://127.0.0.1:8005/ws');  // 修改 WebSocket 连接地址
        this.ws.onmessage = async (event) => {
            const msg = JSON.parse(event.data);
            if (msg.type === 'lines') {
            } else if (msg.type === 'newLineCount') {
                const startend = msg.payload.split(',');
                const start = parseInt(startend[0]);
                const end = parseInt(startend[1]);
                const currentStart = this.hasRequestFirstChunk ? start : 0;
                this.hasRequestFirstChunk = true;
                const lines = await this.getLines(currentStart, end);
                const tmp = lines.map((content: string, index: number) => {
                    return { filename: '[stream log]', line: start + index + 1, content: content } as BaseLine;
                })
                dataAdapter.append(tmp);
            }
        };
        this.ws.onopen = () => {
            console.log('WebSocket connection opened');
            this.ws?.send(JSON.stringify({ type: 'request', payload: { start: 0 } }));
        };
        this.ws.onclose = () => {
            console.log('WebSocket connection closed');
        };
        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    },
    methods: {
        async getLines(start: number, end: number): Promise<string[]> {
            return new Promise<string[]>((resolve, reject) => {
                const requestId = crypto.randomUUID(); // Generate unique request ID

                // Create a one-time message handler for this specific request
                const messageHandler = (event: MessageEvent) => {
                    const msg = JSON.parse(event.data);
                    if (msg.type === 'lines' && msg.requestId === requestId) {
                        this.ws?.removeEventListener('message', messageHandler);
                        resolve(msg.payload);
                    }
                };

                // Add temporary message listener
                this.ws?.addEventListener('message', messageHandler);

                // Send request with unique ID
                this.ws?.send(JSON.stringify({
                    type: 'requestLines',
                    requestId: requestId,
                    payload: { start, end }
                }));

                // Optional: Add timeout to prevent hanging
                setTimeout(() => {
                    this.ws?.removeEventListener('message', messageHandler);
                    reject(new Error('Request timeout'));
                }, 5000); // 5 second timeout
            });
        },
        test() {
            // 实现 test 方法或移除未使用的方法
        },
        setupWebSocket() {
            const wsUrl = 'ws://127.0.0.1:8005/ws';
            this.ws = new WebSocket(wsUrl);

            this.ws.onmessage = async (event: MessageEvent) => {
                // ...
            };

            this.ws.onerror = (error: Event) => {
                // ...
            };
        }
    }
})

</script>