import * as fzstd from 'fzstd';
import { ZstdCodec } from "zstd-codec";

let zstdSimple = null;
let zstdInitPromise = null;

function ensureZstdInitialized() {
  if (zstdSimple) {
    return Promise.resolve(zstdSimple);
  }

  if (!zstdInitPromise) {
    zstdInitPromise = new Promise((resolve, reject) => {
      try {
        ZstdCodec.run((zstd) => {
          zstdSimple = new zstd.Simple();
          resolve(zstdSimple);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  return zstdInitPromise;
}

export class ZstdDecompressor {
  async decompress(data) {
    try {
      const output = fzstd.decompress(data);
      if (output && output.length > 0) {
        return output;
      }
    } catch (error) {
      console.warn('[ZstdDecompressor] fzstd failed, fallback to zstd-codec', error);
    }

    const codec = await ensureZstdInitialized();
    const output = codec.decompress(data);
    if (!output || output.length === 0) {
      throw new Error('Zstd decompression returned empty output');
    }
    return output;
  }

  async loadPaths(input) {
    throw new Error("Method not implemented.");
  }
}
