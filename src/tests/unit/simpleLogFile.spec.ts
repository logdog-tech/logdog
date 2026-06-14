import { describe, expect, it } from 'vitest';
import { SimpleLogFile, type FileStatus } from '@/modules/base';

describe('SimpleLogFile', () => {
  const createLogFile = ({
    status,
    isLogFile = true,
    lineCount,
    isRemoteMode = false,
  }: {
    status: FileStatus;
    isLogFile?: boolean;
    lineCount?: number;
    isRemoteMode?: boolean;
  }) => new SimpleLogFile(new File([''], 'test.log'), '/logs/test.log', 0, status, isLogFile, lineCount, isRemoteMode);

  describe('getDisplayStatus', () => {
    it('should display remote connection statuses', () => {
      expect(createLogFile({ status: 'notConnected', isRemoteMode: true }).getDisplayStatus()).toBe('未连接');
      expect(createLogFile({ status: 'connecting', isRemoteMode: true }).getDisplayStatus()).toBe('连接中');
      expect(createLogFile({ status: 'isConnected', isRemoteMode: true }).getDisplayStatus()).toBe('已连接');
    });

    it('should display normal log processing statuses', () => {
      expect(createLogFile({ status: 'pending' }).getDisplayStatus()).toBe('等待处理');
      expect(createLogFile({ status: 'extracting' }).getDisplayStatus()).toBe('正在处理');
    });

    it('should display extracted log line count when present', () => {
      expect(createLogFile({ status: 'extracted', lineCount: 128 }).getDisplayStatus()).toBe('128 行');
      expect(createLogFile({ status: 'extracted', lineCount: 0 }).getDisplayStatus()).toBe('0 行');
    });

    it('should display loading for extracted logs without line count', () => {
      expect(createLogFile({ status: 'extracted' }).getDisplayStatus()).toBe('加载中');
    });

    it('should display non-log files before normal processing statuses', () => {
      expect(createLogFile({ status: 'pending', isLogFile: false }).getDisplayStatus()).toBe('非日志文件');
      expect(createLogFile({ status: 'extracted', isLogFile: false, lineCount: 128 }).getDisplayStatus()).toBe('非日志文件');
    });
  });
});
