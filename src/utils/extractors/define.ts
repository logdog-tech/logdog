export interface Decompressor {
  decompress(data: Uint8Array, innerPath?: string): Promise<Uint8Array>;

  loadPaths(input: Uint8Array): Promise<string[]>;
}
