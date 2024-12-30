import JSZip from "jszip";
import type { Decompressor } from "./define";

export class ZipDecompressor implements Decompressor {
  async decompress(data: Uint8Array, innerPath?: string): Promise<Uint8Array> {
    const zip = new JSZip();
    const loaded = await zip.loadAsync(data);

    if (!innerPath) {
      throw new Error("Inner path is required for ZIP files");
    }

    const file = loaded.file(innerPath);
    if (!file) {
      throw new Error(`File not found in ZIP: ${innerPath}`);
    }

    const content = await file.async("uint8array");
    return content;
  }

  async loadPaths(data: Uint8Array): Promise<string[]> {
    console.log("loadPaths", data);
    const zip = new JSZip();
    const loaded = await zip.loadAsync(data);
    return Object.keys(loaded.files).filter(path => !loaded.files[path].dir);
  }
}
