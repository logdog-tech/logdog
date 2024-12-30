import pako from "pako";

export class GzipDecompressor {
  async decompress(data, innerPath) {
    const decompressed = pako.inflate(data);
    return decompressed;
  }

  async loadPaths(input) {
    throw new Error("Method not implemented.");
  }
}