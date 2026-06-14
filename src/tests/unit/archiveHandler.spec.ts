import { describe, expect, it, vi } from 'vitest';

vi.mock('libarchive.js', () => ({
  Archive: {
    init: vi.fn(),
    open: vi.fn(),
  },
}));

describe('ArchiveHandlerImpl', () => {
  const workerScriptPath = 'libarchive.js/dist/worker-bundle.js';

  it('should recognize all archive formats supported by the browser provider', async () => {
    const { ArchiveHandlerImpl } = await import('@/utils/providers/archiveHandler');
    const handler = new ArchiveHandlerImpl(workerScriptPath);

    const supportedArchiveFormats = [
      'logs.zip',
      'logs.rar',
      'logs.7z',
      'logs.tar',
      'logs.tar.gz',
      'logs.tgz',
    ];

    for (const filename of supportedArchiveFormats) {
      expect(handler.isArchiveFile(filename), filename).toBe(true);
      expect(handler.isArchiveFile(filename.toUpperCase()), filename).toBe(true);
    }
  });

  it('should not treat direct compressed log files as libarchive archives', async () => {
    const { ArchiveHandlerImpl } = await import('@/utils/providers/archiveHandler');
    const handler = new ArchiveHandlerImpl(workerScriptPath);

    expect(handler.isArchiveFile('app.log.gz')).toBe(false);
    expect(handler.isArchiveFile('app.log.zst')).toBe(false);
  });

  it('should skip common system-generated archive entries', async () => {
    const { ArchiveHandlerImpl } = await import('@/utils/providers/archiveHandler');
    const handler = new ArchiveHandlerImpl(workerScriptPath) as unknown as {
      isSystemFile(path: string): boolean;
    };

    const systemEntries = [
      '__MACOSX/app.log',
      'logs/.DS_Store',
      'logs/desktop.ini',
      'logs/Thumbs.db',
      'logs/.git/config',
      'logs/node_modules/package/index.js',
    ];

    for (const entry of systemEntries) {
      expect(handler.isSystemFile(entry), entry).toBe(true);
    }

    expect(handler.isSystemFile('logs/app.log')).toBe(false);
  });
});
