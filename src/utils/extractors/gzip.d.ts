import type { Decompressor } from "./define";

export declare class GzipDecompressor implements Decompressor {
  async decompress(data: Uint8Array, innerPath?: string): Promise<Uint8Array>;

  async loadPaths(input: Uint8Array): Promise<string[]>;
}