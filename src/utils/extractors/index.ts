import type { Decompressor } from "./define";
import { ZstdDecompressor } from "./zstd";
import { GzipDecompressor } from "./gzip";
import { ZipDecompressor } from "./zip";


const decompressors = new Map<string, Decompressor>();

decompressors.set("zstd", new ZstdDecompressor());
decompressors.set("gzip", new GzipDecompressor());
decompressors.set("zip", new ZipDecompressor());

async function getUint8Array(input: Uint8Array | File): Promise<Uint8Array> {
  if (input instanceof File) {
    const reader = new FileReader();
    reader.readAsArrayBuffer(input);
    return new Promise<Uint8Array>((resolve, reject) => {
      reader.onload = () => {
        resolve(new Uint8Array(reader.result as ArrayBuffer));
      };
      reader.onerror = reject;
    });
  }
  return input;
}

export async function decompress(input: Uint8Array | File, type: "zip" | "gzip" | "zstd", innerPath?: string): Promise<Uint8Array> {
  const data = await getUint8Array(input);

  const decompressor = decompressors.get(type);
  if (!decompressor) {
    throw new Error(`Unknown decompressor type: ${type}`);
  }
  return decompressor.decompress(data, innerPath);
}

export async function loadPaths(input: Uint8Array, type: "zip" | "tar.gz" | "tar.zstd" | string): Promise<string[]> {
  if (type !== "zip") {
    throw new Error(`Unsupported archive type: ${type}`);
  }
  const decompressor = decompressors.get("zip");
  if (!decompressor) {
    throw new Error("Zip decompressor not found");
  }
  return await decompressor.loadPaths(input);
}