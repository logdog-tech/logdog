import { describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/providers/archiveHandler', () => ({
  createArchiveHandler: () => ({
    isArchiveFile: vi.fn(() => false),
    processArchiveWithCallbacks: vi.fn(),
  }),
}));

vi.mock('@/utils/providers/sampleData', () => ({
  howToUseFile: 'sample.log',
}));

const encode = (content: string) => new TextEncoder().encode(content);

describe('BrowserProvider.splitLinesFromBinarySupportLargeFile', () => {
  it('returns an empty array for empty binary data', async () => {
    const { BrowserProvider } = await import('@/utils/providers/BrowserProvider');
    const provider = new BrowserProvider();

    expect(provider.splitLinesFromBinarySupportLargeFile(new Uint8Array())).toEqual([]);
  });

  it('splits LF line endings', async () => {
    const { BrowserProvider } = await import('@/utils/providers/BrowserProvider');
    const provider = new BrowserProvider();

    expect(provider.splitLinesFromBinarySupportLargeFile(encode('first\nsecond\nthird'))).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('splits CRLF line endings', async () => {
    const { BrowserProvider } = await import('@/utils/providers/BrowserProvider');
    const provider = new BrowserProvider();

    expect(provider.splitLinesFromBinarySupportLargeFile(encode('first\r\nsecond\r\nthird'))).toEqual([
      'first',
      'second',
      'third',
    ]);
  });

  it('keeps the last line when the content has no trailing newline', async () => {
    const { BrowserProvider } = await import('@/utils/providers/BrowserProvider');
    const provider = new BrowserProvider();

    expect(provider.splitLinesFromBinarySupportLargeFile(encode('first\nsecond'))).toEqual([
      'first',
      'second',
    ]);
  });

  it('keeps a trailing empty line when the content ends with a newline', async () => {
    const { BrowserProvider } = await import('@/utils/providers/BrowserProvider');
    const provider = new BrowserProvider();

    expect(provider.splitLinesFromBinarySupportLargeFile(encode('first\nsecond\n'))).toEqual([
      'first',
      'second',
      '',
    ]);
  });

  it('decodes multibyte UTF-8 characters', async () => {
    const { BrowserProvider } = await import('@/utils/providers/BrowserProvider');
    const provider = new BrowserProvider();

    expect(provider.splitLinesFromBinarySupportLargeFile(encode('你好\n🙂 café\n終わり'))).toEqual([
      '你好',
      '🙂 café',
      '終わり',
    ]);
  });
});
