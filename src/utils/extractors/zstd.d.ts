import type { Decompressor } from "./define";

export declare class ZstdDecompressor implements Decompressor {
  async decompress(data: Uint8Array, innerPath?: string): Promise<Uint8Array>;

  async loadPaths(input: Uint8Array): Promise<string[]> {
    throw new Error("Method not implemented.");
  }
}