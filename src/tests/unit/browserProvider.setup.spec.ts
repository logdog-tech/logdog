import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils/providers/archiveHandler', () => ({
  createArchiveHandler: vi.fn(() => ({
    isArchiveFile: vi.fn(() => false),
    processArchiveWithCallbacks: vi.fn(),
  })),
}));

vi.mock('@/utils/providers/sampleData', () => ({
  howToUseFile: new File([], 'sample.bin', { type: 'application/octet-stream' }),
}));

describe('BrowserProvider.setup', () => {
  let BrowserProvider: typeof import('@/utils/providers/BrowserProvider').BrowserProvider;

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ BrowserProvider } = await import('@/utils/providers/BrowserProvider'));
  });

  const createLogFile = (name: string, content: string, lastModified = 1) => {
    const file = new File([content], name, {
      type: 'text/plain',
      lastModified,
    });
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn(async () => new TextEncoder().encode(content).buffer),
    });
    return file;
  };

  it('loads a single .log file into resources and lines', async () => {
    const provider = new BrowserProvider();
    const content = [
      '12-18 03:25:54.853  3168  3307 I CHR_ChrCommonInfo: getSlotCardState = MASTER_ONLY',
      '12-18 03:25:55.001  3168  3307 W CHR_ChrCommonInfo: radio state changed',
    ].join('\n');
    const file = createLogFile('radio.log', content);

    await provider.setup(file, true);

    const resources = provider.getResources();
    expect(resources).toHaveLength(1);
    expect(resources[0]).toMatchObject({
      name: 'radio.log',
      path: 'radio.log',
      status: 'extracted',
      isLogFile: true,
      lineCount: 2,
    });

    await expect(provider.getTotalLineCount()).resolves.toBe(2);

    const firstLine = await provider.getLine(0);
    expect(firstLine).toMatchObject({
      filename: 'radio.log',
      line: 0,
      time: '12-18 03:25:54.853',
      pid: 3168,
      tid: 3307,
      level: 'I',
    });
    expect(firstLine.content).toBe(
      '12-18 03:25:54.853  3168  3307 I CHR_ChrCommonInfo: getSlotCardState = MASTER_ONLY',
    );

    const secondLine = await provider.getLine(1);
    expect(secondLine.content).toBe(
      '12-18 03:25:55.001  3168  3307 W CHR_ChrCommonInfo: radio state changed',
    );
  });

  it('does not duplicate resources or lines when the same File is set up again', async () => {
    const provider = new BrowserProvider();
    const file = createLogFile(
      'repeat.log',
      '12-18 03:25:54.853  3168  3307 I CHR_ChrCommonInfo: first load',
      123,
    );

    await provider.setup(file, true);
    await provider.setup(file);

    expect(provider.getResources()).toHaveLength(1);
    await expect(provider.getTotalLineCount()).resolves.toBe(1);
    expect((await provider.getLine(0)).content).toContain('first load');
  });

  it('sorts lines from multiple files by parsed Android log time', async () => {
    const provider = new BrowserProvider();
    const lateFile = createLogFile(
      'late.log',
      '12-18 03:25:55.001  3168  3307 W LateTag: later line',
      10,
    );
    const earlyFile = createLogFile(
      'early.log',
      '12-18 03:25:54.853  3168  3307 I EarlyTag: earlier line',
      20,
    );

    await provider.setup([lateFile, earlyFile], true);

    await expect(provider.getTotalLineCount()).resolves.toBe(2);
    expect((await provider.getLine(0)).content).toContain('earlier line');
    expect((await provider.getLine(1)).content).toContain('later line');
  });
});
