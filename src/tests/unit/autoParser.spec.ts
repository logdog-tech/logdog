import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutoParser } from '@/utils/parsers/AutoParser';

// Mock the dataFormatter module
vi.mock('@/utils/dataFormatter', () => ({
  formatTimestamp: vi.fn().mockResolvedValue(1640995200000), // A fixed timestamp
  init: vi.fn()
}));

describe('AutoParser', () => {
  let parser: AutoParser;

  beforeEach(() => {
    parser = new AutoParser();
  });

  describe('parseLine', () => {
    it('should parse Android log lines correctly', () => {
      const line = "12-18 03:25:54.853  3168  3307 I CHR_ChrCommonInfo: getSlotCardState = MASTER_ONLY";
      const result = parser.parseLine(line);
      
      expect(result).not.toBeNull();
      expect(result).toEqual({
        time: "12-18 03:25:54.853",
        pid: 3168,
        tid: 3307,
        level: "I"
      });
    });

    it('should parse Android log lines with UID correctly', () => {
      const line = "02-26 19:34:47.283  1000  4739  4739 E AndroidRuntime: \tat android.app.ActivityThread.main(ActivityThread.java:9570)";
      const result = parser.parseLine(line);
      
      expect(result).not.toBeNull();
      expect(result).toEqual({
        time: "02-26 19:34:47.283",
        uid: 1000,
        pid: 4739,
        tid: 4739,
        level: "E"
      });
    });

    it('should return null for lines that do not match any pattern', () => {
      const line = "This is not a valid log line";
      const result = parser.parseLine(line);
      
      expect(result).toBeNull();
    });

    it('should return null for lines that are too short', () => {
      const line = "Short line";
      const result = parser.parseLine(line);
      
      expect(result).toBeNull();
    });
  });

  describe('parseLines', () => {
    it('should parse multiple lines correctly', () => {
      const lines = [
        "12-17 20:52:03.168  3218  3218 I QImsService: ImsServiceSub : handleSsac voice = 255",
        "12-17 20:52:03.168  3218  3218 I SendBroadcastPermission: action:org.codeaurora.VOIP_VOPS_SSAC_STATUS, mPermissionType:0",
        "This is not a valid log line"
      ];
      
      const results = parser.parseLines(lines);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        time: "12-17 20:52:03.168",
        pid: 3218,
        tid: 3218,
        level: "I"
      });
      expect(results[1]).toEqual({
        time: "12-17 20:52:03.168",
        pid: 3218,
        tid: 3218,
        level: "I"
      });
    });
  });

  describe('parseLinesOptimized', () => {
    it('should parse lines with locked regex correctly', () => {
      const lines = [
        "12-17 20:52:03.168  3218  3218 I QImsService: ImsServiceSub : handleSsac voice = 255",
        "12-17 20:52:03.168  3218  3218 I SendBroadcastPermission: action:org.codeaurora.VOIP_VOPS_SSAC_STATUS, mPermissionType:0"
      ];
      
      const { results, errorLineCount } = parser.parseLinesOptimized(lines);
      
      expect(errorLineCount).toBe(0);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        time: "12-17 20:52:03.168",
        pid: 3218,
        tid: 3218,
        level: "I"
      });
    });

    it('should return error count when no lines match', () => {
      const lines = [
        "Invalid line 1",
        "Invalid line 2"
      ];
      
      const { results, errorLineCount } = parser.parseLinesOptimized(lines);
      
      expect(errorLineCount).toBe(2);
      expect(results).toHaveLength(0);
    });
  });
})