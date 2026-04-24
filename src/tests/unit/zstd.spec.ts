import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ZstdDecompressor } from '@/utils/extractors/zstd';

describe('zstd decompression regression', () => {
  it('should decompress CentOS-7-anon.repo.zst', async () => {
    const filePath = path.resolve(process.cwd(), 'src/tests/fixtures/CentOS-7-anon.repo.zst');
    const input = new Uint8Array(readFileSync(filePath));
    const decompressor = new ZstdDecompressor();

    const output = await decompressor.decompress(input);
    const text = new TextDecoder('utf-8').decode(output);

    expect(output.length).toBeGreaterThan(0);
    expect(text).toContain('# CentOS-Base.repo');
    expect(text).toContain('[base]');
    expect(text).toContain('mirrors.huaweicloud.com');
  });
});
