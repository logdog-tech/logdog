// 计算相对亮度
function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
  
  // 计算对比度
  function getContrastRatio(l1: number, l2: number): number {
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }
  
  // 生成随机颜色
  function getRandomColor(): string {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  }
  
export interface ColorScheme {
    fg: string;
    bg: string;
    contrast: number;
  }
  
  // 生成配色方案
  export function generateColorSchemes(): ColorScheme[] {
    const schemes: ColorScheme[] = [];
    while (schemes.length < 8) {
      const bg = getRandomColor();
      const fg = getRandomColor();
      
      // 解析颜色
      const bgRGB: [number, number, number] = [
        parseInt(bg.slice(1,3), 16),
        parseInt(bg.slice(3,5), 16),
        parseInt(bg.slice(5,7), 16)
      ];
      const fgRGB: [number, number, number] = [
        parseInt(fg.slice(1,3), 16),
        parseInt(fg.slice(3,5), 16),
        parseInt(fg.slice(5,7), 16)
      ];
      
      // 计算对比度
      const bgLum = getLuminance(...bgRGB);
      const fgLum = getLuminance(...fgRGB);
      const contrast = getContrastRatio(bgLum, fgLum);
      
      // 只有对比度大于4.5的配色才被接受
      if (contrast >= 4.5) {
        schemes.push({
          fg,
          bg,
          contrast
        });
      }
    }
    return schemes;
  }
  

/**
 * 计算一个字符串的hash颜色
 * @param str 
 * @returns 
 */
export function hashColor(str: string): string {
    // 使用一个简单的hash算法
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }

    // 生成HSL颜色，使用hash来确定色相
    // 使用固定的饱和度和亮度以确保颜色鲜艳且易于辨识
    const hue = Math.abs(hash % 360);  // 0-360的色相角度
    const saturation = 70;  // 固定70%的饱和度
    const lightness = 80;   // 固定80%的亮度

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}