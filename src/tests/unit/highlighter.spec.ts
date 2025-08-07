import { describe, it, expect } from 'vitest';
import { highlightIt } from '@/utils/highlighter';

describe('highlighter', () => {
  describe('highlightIt', () => {
    it('should return the original content when no patterns are provided', () => {
      const content = 'This is a test string';
      const result = highlightIt(content);
      expect(result).toBe('This is a test string');
    });

    it('should escape HTML characters in the content', () => {
      const content = 'This is <script>alert("test")</script> string';
      const result = highlightIt(content);
      expect(result).toBe('This is &lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt; string');
    });

    it('should replace <br> tags with spaces', () => {
      const content = 'Line 1<br>Line 2<br>Line 3';
      const result = highlightIt(content);
      expect(result).toBe('Line 1 Line 2 Line 3');
    });

    it('should apply styles to matching patterns', () => {
      const content = 'This is an error message';
      const patterns = [
        { pattern: 'error', style: { color: 'red' } }
      ];
      const result = highlightIt(content, patterns);
      expect(result).toBe('This is an <span style="color: red;">error</span> message');
    });

    it('should handle multiple patterns', () => {
      const content = 'Error: Warning in the system';
      const patterns = [
        { pattern: 'Error', style: { color: 'red' } },
        { pattern: 'Warning', style: { color: 'orange' } }
      ];
      const result = highlightIt(content, patterns);
      expect(result).toBe('<span style="color: red;">Error</span>: <span style="color: orange;">Warning</span> in the system');
    });

    it('should handle overlapping patterns', () => {
      const content = 'This is an error message';
      const patterns: { pattern: string; style: { [key: string]: string | number } }[] = [
        { pattern: 'error', style: { color: 'red', fontWeight: 'bold' } },
        { pattern: 'message', style: { color: 'blue' } }
      ];
      const result = highlightIt(content, patterns);
      expect(result).toBe('This is an <span style="color: red; fontWeight: bold;">error</span> <span style="color: blue;">message</span>');
    });

    it('should handle regex patterns', () => {
      const content = 'The price is $100 and the tax is $10';
      const patterns = [
        { pattern: /\$\d+/, style: { color: 'green' } }
      ];
      const result = highlightIt(content, patterns);
      expect(result).toBe('The price is <span style="color: green;">$100</span> and the tax is <span style="color: green;">$10</span>');
    });

    it('should handle invalid regex patterns gracefully', () => {
      const content = 'This is a test';
      const patterns = [
        { pattern: '[', style: { color: 'red' } }, // Invalid regex
        { pattern: 'test', style: { color: 'blue' } }
      ];
      const result = highlightIt(content, patterns);
      expect(result).toBe('This is a <span style="color: blue;">test</span>');
    });
  });
});