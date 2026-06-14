import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import JSZip from 'jszip';
import pako from 'pako';
import { decompress, loadPaths } from '@/utils/extractors';

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

describe('extractors', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should decompress gzip log files', async () => {
    const content = 'line 1\nline 2\nline 3';
    const compressed = pako.gzip(content);

    const output = await decompress(compressed, 'gzip');

    expect(textDecoder.decode(output)).toBe(content);
  });

  it('should list files inside zip archives', async () => {
    const zip = new JSZip();
    zip.file('logs/app.log', 'app line');
    zip.file('logs/error.txt', 'error line');
    zip.folder('empty-dir');
    const compressed = await zip.generateAsync({ type: 'uint8array' });

    const paths = await loadPaths(compressed, 'zip');

    expect(paths.sort()).toEqual(['logs/app.log', 'logs/error.txt']);
  });

  it('should decompress a selected file inside zip archives', async () => {
    const zip = new JSZip();
    zip.file('logs/app.log', 'app line');
    zip.file('logs/error.txt', 'error line');
    const compressed = await zip.generateAsync({ type: 'uint8array' });

    const output = await decompress(compressed, 'zip', 'logs/error.txt');

    expect(textDecoder.decode(output)).toBe('error line');
  });

  it('should reject zip decompression without an inner path', async () => {
    const zip = new JSZip();
    zip.file('logs/app.log', 'app line');
    const compressed = await zip.generateAsync({ type: 'uint8array' });

    await expect(decompress(compressed, 'zip')).rejects.toThrow('Inner path is required');
  });

  it('should reject zip decompression when the inner path is missing', async () => {
    const zip = new JSZip();
    zip.file('logs/app.log', 'app line');
    const compressed = await zip.generateAsync({ type: 'uint8array' });

    await expect(decompress(compressed, 'zip', 'logs/missing.log')).rejects.toThrow(
      'File not found in ZIP: logs/missing.log',
    );
  });

  it('should reject unsupported archive path listing types', async () => {
    await expect(loadPaths(textEncoder.encode('content'), 'tar')).rejects.toThrow(
      'Unsupported archive type: tar',
    );
  });

  it('should reject unknown decompressor types', async () => {
    await expect(decompress(textEncoder.encode('content'), 'rar' as never)).rejects.toThrow(
      'Unknown decompressor type: rar',
    );
  });
});
