import { describe, it, expect, vi } from 'vitest';
import { parseDate } from '@/utils/dateFormatter';

// Mock the WASM module
vi.mock('@/../wasm/pkg', () => ({
  default: vi.fn(),
  parse_datetime: vi.fn((input: string, format: string) => {
    // Simple mock implementation
    if (input === '2023-01-01 12:00:00' && format === '%Y-%m-%d %H:%M:%S') {
      return new Date('2023-01-01T12:00:00').getTime();
    }
    return 0;
  })
}));

describe('dateFormatter', () => {
  it('should parse datetime correctly', async () => {
    const timestamp = await parseDate('2023-01-01 12:00:00', '%Y-%m-%d %H:%M:%S');
    expect(timestamp).toBe(new Date('2023-01-01T12:00:00').getTime());
  });
});