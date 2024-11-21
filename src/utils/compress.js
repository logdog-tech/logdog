import { ZstdCodec } from "zstd-codec";
import pako from "pako";

let zstdSimple = null;

// 初始化 Zstd 解压库
new Promise((resolve) => {
    ZstdCodec.run((zstd) => {
      zstdSimple = new zstd.Simple()
      resolve()
    })
  })


function decompress_gzip(data) {
  const decompressed = pako.inflate(data);
  return decompressed;
}

function decompress_zstd(data) {
    return zstdSimple.decompress(data);
}

export function logdog_decompress(data, type) {
  if (type === "gzip") {
    return decompress_gzip(data);
  } else if (type === "zstd") {
    return decompress_zstd(data);
  }
}
