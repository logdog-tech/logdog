import { describe, it, expect } from 'vitest';
import { escapeRegExp } from '@/utils/regex';

describe('regex', () => {
  it('should escape special regex characters', () => {
    expect(escapeRegExp('hello.world')).toBe('hello\\.world');
    expect(escapeRegExp('hello*world')).toBe('hello\\*world');
    expect(escapeRegExp('hello?world')).toBe('hello\\?world');
    expect(escapeRegExp('hello+world')).toBe('hello\\+world');
    expect(escapeRegExp('hello^world')).toBe('hello\\^world');
    expect(escapeRegExp('hello$world')).toBe('hello\\$world');
    expect(escapeRegExp('hello{world')).toBe('hello\\{world');
    expect(escapeRegExp('hello}world')).toBe('hello\\}world');
    expect(escapeRegExp('hello[world')).toBe('hello\\[world');
    expect(escapeRegExp('hello]world')).toBe('hello\\]world');
    expect(escapeRegExp('hello(world')).toBe('hello\\(world');
    expect(escapeRegExp('hello)world')).toBe('hello\\)world');
    expect(escapeRegExp('hello|world')).toBe('hello\\|world');
    expect(escapeRegExp('hello\\world')).toBe('hello\\\\world');
  });

  it('should not modify strings without special characters', () => {
    expect(escapeRegExp('hello world')).toBe('hello world');
    expect(escapeRegExp('helloworld')).toBe('helloworld');
    expect(escapeRegExp('12345')).toBe('12345');
  });

  it('should handle empty string', () => {
    expect(escapeRegExp('')).toBe('');
  });

  it('should escape all special characters in a complex string', () => {
    const input = 'hello.*+?^${}()|[\\]';
    const expected = 'hello\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\\\\\]';
    expect(escapeRegExp(input)).toBe(expected);
  });
});