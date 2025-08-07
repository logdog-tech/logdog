import { describe, it, expect } from 'vitest';
import { isBinaryFile, isLogFile } from '@/utils/binaryCheck';

describe('binaryCheck', () => {
  describe('isBinaryFile', () => {
    it('should return true for binary file extensions', () => {
      expect(isBinaryFile('file.exe')).toBe(true);
      expect(isBinaryFile('file.dll')).toBe(true);
      expect(isBinaryFile('file.so')).toBe(true);
      expect(isBinaryFile('file.jpg')).toBe(true);
      expect(isBinaryFile('file.png')).toBe(true);
      expect(isBinaryFile('file.mp3')).toBe(true);
      expect(isBinaryFile('file.mp4')).toBe(true);
      // These extensions are not in the list, using ones that are:
      expect(isBinaryFile('file.xls')).toBe(true);
      expect(isBinaryFile('file.xlsx')).toBe(true);
      expect(isBinaryFile('file.woff')).toBe(true);
    });

    it('should return false for non-binary file extensions', () => {
      expect(isBinaryFile('file.txt')).toBe(false);
      expect(isBinaryFile('file.log')).toBe(false);
      expect(isBinaryFile('file.json')).toBe(false);
      expect(isBinaryFile('file.xml')).toBe(false);
      expect(isBinaryFile('file.csv')).toBe(false);
      expect(isBinaryFile('file.md')).toBe(false);
      expect(isBinaryFile('file.conf')).toBe(false);
    });

    it('should handle case insensitive extensions', () => {
      expect(isBinaryFile('file.JPG')).toBe(true);
      expect(isBinaryFile('file.Png')).toBe(true);
      expect(isBinaryFile('file.MP3')).toBe(true);
    });

    it('should handle files without extensions', () => {
      expect(isBinaryFile('README')).toBe(false);
      expect(isBinaryFile('LICENSE')).toBe(false);
      expect(isBinaryFile('Makefile')).toBe(false);
    });
  });

  describe('isLogFile', () => {
    it('should return false for binary files', () => {
      expect(isLogFile('file.exe')).toBe(false);
      expect(isLogFile('file.jpg')).toBe(false);
      expect(isLogFile('file.mp3')).toBe(false);
    });

    it('should return false for hidden files', () => {
      expect(isLogFile('.gitignore')).toBe(false);
      expect(isLogFile('.env')).toBe(false);
      expect(isLogFile('.DS_Store')).toBe(false);
    });

    it('should return true for log files', () => {
      expect(isLogFile('app.log')).toBe(true);
      expect(isLogFile('error.txt')).toBe(true);
      expect(isLogFile('debug.log')).toBe(true);
      expect(isLogFile('access.log')).toBe(true);
      expect(isLogFile('/path/to/app.log')).toBe(true);
      expect(isLogFile('/path/to/error.txt')).toBe(true);
    });

    it('should handle files without extensions as log files', () => {
      expect(isLogFile('README')).toBe(true);
      expect(isLogFile('LICENSE')).toBe(true);
      expect(isLogFile('Makefile')).toBe(true);
    });
  });
});