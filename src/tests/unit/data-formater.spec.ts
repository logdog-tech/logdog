import { describe, it, expect, vi } from 'vitest';
import { formatTimestamp, init } from '@/utils/dataFormater';
import { parseDate, ensureWasmInitialized } from '@/utils/date-formatter';

// Mock the dependencies
vi.mock('@/utils/date-formatter', () => ({
  parseDate: vi.fn().mockResolvedValue(1640995200000), // A fixed timestamp
  ensureWasmInitialized: vi.fn().mockResolvedValue(undefined)
}));

describe('dataFormater', () => {
  describe('init', () => {
    it('should call ensureWasmInitialized', async () => {
      await init();
      expect(ensureWasmInitialized).toHaveBeenCalled();
    });
  });

  describe('formatTimestamp', () => {
    it('should call parseDate with correct parameters', async () => {
      const result = await formatTimestamp('2023-01-01 12:00:00', '%Y-%m-%d %H:%M:%S');
      expect(parseDate).toHaveBeenCalledWith('2023-01-01 12:00:00', '%Y-%m-%d %H:%M:%S');
      expect(result).toBe(1640995200000);
    });

    it('should return the timestamp from parseDate', async () => {
      vi.mocked(parseDate).mockResolvedValueOnce(1672560000000);
      const result = await formatTimestamp('2023-01-01 00:00:00', '%Y-%m-%d %H:%M:%S');
      expect(result).toBe(1672560000000);
    });
  });
});