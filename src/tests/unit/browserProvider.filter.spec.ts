import { describe, expect, it, vi } from 'vitest';
import { DisplayMode, type BaseLine } from '@/modules/base';
import { BrowserProvider } from '@/utils/providers/BrowserProvider';

vi.mock('@/utils/providers/sampleData', () => ({
  howToUseFile: 'sample-data.log',
}));

function line(content: string, index: number, isMarked = false): BaseLine {
  return {
    filename: 'test.log',
    line: index,
    content,
    originalIndex: index,
    isMarked,
  };
}

function createProvider() {
  const provider = new BrowserProvider();
  provider.isSetup = true;
  provider.allLines = [
    line('ERROR failed to start', 0),
    line('warn retry requested', 1, true),
    line('error recovered', 2),
    line('plain heartbeat', 3),
  ];
  return provider;
}

describe('BrowserProvider filter and marks', () => {
  it('marks lines and publishes changes', async () => {
    const provider = createProvider();
    const observer = { onChange: vi.fn() };
    provider.subscribe(observer);

    await provider.markLine(0, true);
    expect(provider.allLines[0].isMarked).toBe(true);
    expect(observer.onChange).toHaveBeenCalledTimes(1);

    await provider.markLine(0, false);
    expect(provider.allLines[0].isMarked).toBe(false);
    expect(observer.onChange).toHaveBeenCalledTimes(2);
  });

  it('filters only matching lines in ONLY_SEARCH mode', async () => {
    const provider = createProvider();

    await provider.useFilter('error', {
      caseSensitive: false,
      displayMode: DisplayMode.ONLY_SEARCH,
    });

    expect(provider.filteredLines.map(item => item.line)).toEqual([0, 2]);
    expect(provider.allLines.map(item => item.isSearched)).toEqual([true, false, true, false]);
  });

  it('filters only marked lines in ONLY_MARK mode and ignores search matches', async () => {
    const provider = createProvider();

    await provider.useFilter('error', {
      caseSensitive: false,
      displayMode: DisplayMode.ONLY_MARK,
    });

    expect(provider.filteredLines.map(item => item.line)).toEqual([1]);
    expect(provider.allLines.map(item => item.isSearched)).toEqual([false, false, false, false]);
  });

  it('includes marked and searched lines in MARK_AND_SEARCH mode', async () => {
    const provider = createProvider();

    await provider.useFilter('error', {
      caseSensitive: false,
      displayMode: DisplayMode.MARK_AND_SEARCH,
    });

    expect(provider.filteredLines.map(item => item.line)).toEqual([0, 1, 2]);
    expect(provider.filteredLines[1].isMarked).toBe(true);
    expect(provider.allLines.map(item => item.isSearched)).toEqual([true, false, true, false]);
  });

  it('honors caseSensitive false and true options', async () => {
    const provider = createProvider();

    await provider.useFilter('error', {
      caseSensitive: false,
      displayMode: DisplayMode.ONLY_SEARCH,
    });
    expect(provider.filteredLines.map(item => item.line)).toEqual([0, 2]);

    await provider.useFilter('error', {
      caseSensitive: true,
      displayMode: DisplayMode.ONLY_SEARCH,
    });
    expect(provider.filteredLines.map(item => item.line)).toEqual([2]);
    expect(provider.allLines.map(item => item.isSearched)).toEqual([false, false, true, false]);
  });

  it('does not return unmarked lines for empty searches', async () => {
    const provider = createProvider();

    await provider.useFilter('', {
      caseSensitive: false,
      displayMode: DisplayMode.ONLY_SEARCH,
    });
    expect(provider.filteredLines).toEqual([]);

    await provider.useFilter('', {
      caseSensitive: false,
      displayMode: DisplayMode.MARK_AND_SEARCH,
    });
    expect(provider.filteredLines.map(item => item.line)).toEqual([1]);
    expect(provider.filteredLines.every(item => item.isMarked)).toBe(true);
    expect(provider.allLines.map(item => item.isSearched)).toEqual([false, false, false, false]);
  });
});
