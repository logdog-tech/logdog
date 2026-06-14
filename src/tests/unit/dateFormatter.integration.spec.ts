import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ensureWasmInitialized, parseDate } from '@/utils/dateFormatter';

describe('dateFormatter WASM integration', () => {
  beforeEach(() => {
    const wasmPath = path.resolve(process.cwd(), 'wasm/pkg/date_parser_bg.wasm');
    const wasmBytes = readFileSync(wasmPath);

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: string | URL | Request) => {
      const url = input instanceof Request ? input.url : input.toString();
      if (url.endsWith('date_parser_bg.wasm')) {
        return new Response(wasmBytes, {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/wasm' },
        });
      }
      throw new Error(`Unexpected fetch in test: ${url}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes the real WASM parser and parses a date', async () => {
    await ensureWasmInitialized();

    const timestamp = await parseDate('2023-01-01 12:00:00', '%Y-%m-%d %H:%M:%S');

    expect(timestamp).toBe(Date.UTC(2023, 0, 1, 12, 0, 0));
  });
});
