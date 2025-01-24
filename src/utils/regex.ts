
/**
 * 转义所有特殊字符
 * 
 * 例如：
 * - . (点) 转义为 \.
 * - * (星号) 转义为 \*
 * - ? (问号) 转义为 \?
 * 
 * @param text 
 * @returns 
 */
export function escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 转义所有特殊字符
}