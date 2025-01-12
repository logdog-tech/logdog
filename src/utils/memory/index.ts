export interface MemoryCompressor {

    compress(data: string): unknown;

    decompress(data: unknown): string;
}

class DefaultMemoryCompressor implements MemoryCompressor {
    compress(data: string): unknown {
        return data;
    }

    decompress(data: unknown): string {
        return data as string;
    }
}

export const logMemoryCompressor = new DefaultMemoryCompressor();