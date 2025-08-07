import { describe, it, expect } from 'vitest';
import { generateColorSchemes, hashColor } from '@/utils/colors';

describe('colors', () => {
  it('should generate color schemes with sufficient contrast', () => {
    const schemes = generateColorSchemes();
    
    expect(schemes).toHaveLength(8);
    
    for (const scheme of schemes) {
      expect(scheme.fg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(scheme.bg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(scheme.contrast).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('should generate consistent hash colors for the same string', () => {
    const color1 = hashColor('test');
    const color2 = hashColor('test');
    
    expect(color1).toBe(color2);
  });

  it('should generate different hash colors for different strings', () => {
    const color1 = hashColor('test1');
    const color2 = hashColor('test2');
    
    expect(color1).not.toBe(color2);
  });

  it('should generate HSL colors with correct format', () => {
    const color = hashColor('test');
    
    expect(color).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });
});