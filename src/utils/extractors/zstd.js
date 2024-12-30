import { ZstdCodec } from "zstd-codec";

let zstdSimple = null;

// 初始化 Zstd 解压库
new Promise((resolve) => {
  ZstdCodec.run((zstd) => {
    zstdSimple = new zstd.Simple()
    resolve()
  })
})


export class ZstdDecompressor {
  async decompress(data) {
    return zstdSimple.decompress(data);
  }

  async loadPaths(input) {
    throw new Error("Method not implemented.");
  }
}