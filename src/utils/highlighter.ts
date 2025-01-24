interface StyleObject {
    [key: string]: string | number;
}

/**
 * 高亮显示文本内容中的多个匹配模式，支持样式叠加且避免HTML标签错误处理。
 * 
 * 需求：
 * - 支持多个正则表达式匹配和样式应用
 * - 处理重叠区域的样式叠加
 * - 避免HTML标签被错误替换
 * - 保证输出内容的安全性
 * 
 * 功能：
 * - 将内容中的<br>标签替换为空格
 * - 根据正则表达式查找所有匹配
 * - 对重叠区域应用多个样式
 * - 生成安全的HTML输出
 * 
 * 实现步骤：
 * 1. 预处理 - 替换<br>标签
 * 2. 匹配收集 - 获取所有正则表达式的匹配位置和样式信息
 * 3. 事件排序 - 将所有开始/结束位置排序，结束事件优先
 * 4. 样式管理 - 使用栈结构追踪每个位置的活动样式
 * 5. 文本处理 - 为每段文本应用当前活动的样式组合
 * 6. 安全转换 - HTML字符转义确保输出安全
 * 
 * 优势：
 * - 避免了span标签被二次处理的问题
 * - 准确处理样式叠加
 * - 保证HTML结构完整性
 * 
 * @param {string} content - 需要处理的原始文本内容
 * @returns {string} - 添加了高亮样式的HTML字符串
 */

/**
 * 高亮显示文本内容中的多个匹配模式，支持样式叠加且避免HTML标签错误处理。
 * 
 * 需求：
 * - 支持多个正则表达式匹配和样式应用
 * - 处理重叠区域的样式叠加
 * - 避免HTML标签被错误替换
 * - 保证输出内容的安全性
 * 
 * 功能：
 * - 将内容中的<br>标签替换为空格
 * - 根据正则表达式查找所有匹配
 * - 对重叠区域应用多个样式
 * - 生成安全的HTML输出
 * 
 * 实现步骤：
 * 1. 预处理 - 替换<br>标签
 * 2. 匹配收集 - 获取所有正则表达式的匹配位置和样式信息
 * 3. 事件排序 - 将所有开始/结束位置排序，结束事件优先
 * 4. 样式管理 - 使用栈结构追踪每个位置的活动样式
 * 5. 文本处理 - 为每段文本应用当前活动的样式组合
 * 6. 安全转换 - HTML字符转义确保输出安全
 * 
 * 优势：
 * - 避免了span标签被二次处理的问题
 * - 准确处理样式叠加
 * - 保证HTML结构完整性
 * 
 * @param {string} content - 需要处理的原始文本内容
 * @returns {string} - 添加了高亮样式的HTML字符串
 */
export function highlightIt(content: string, useColors: { pattern: string | RegExp; style: StyleObject }[] = []): string {
    // 将 <br> 标签替换为空格
    const formatted = content.replace(/<br>/g, " ");

    type Event = {
        position: number;
        type: 'start' | 'end';
        style: StyleObject;
    };

    const events: Event[] = [];

    // 收集所有匹配事件（开始和结束位置）及其关联的样式
    useColors.forEach((c) => {
        // 确保 pattern 不为 undefined
        if (!c.pattern) return;

        try {
            new RegExp(c.pattern);
        } catch (error) {
            console.warn('无效的正则表达式：', c.pattern);
            return;
        }
        const regex = new RegExp(c.pattern, 'gi');
        let match;
        while ((match = regex.exec(formatted)) !== null) {
            const start = match.index;
            const end = regex.lastIndex;
            events.push({ position: start, type: 'start', style: c.style });
            events.push({ position: end, type: 'end', style: c.style });

            // 避免零长度匹配导致的无限循环
            if (regex.lastIndex === match.index) {
                regex.lastIndex++;
            }
        }
    });

    // 按位置排序事件；对于相同位置，结束事件排在开始事件之前
    events.sort((a, b) => {
        if (a.position !== b.position) {
            return a.position - b.position;
        } else if (a.type === b.type) {
            return 0;
        } else if (a.type === 'end') {
            return -1;
        } else {
            return 1;
        }
    });

    let position = 0;
    const activeStyles: StyleObject[] = [];
    let output = '';

    // 辅助函数
    const escapeHtml = (text: string): string => {
        return text.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    };

    const styleString = (styles: StyleObject[]): string => {
        const combinedStyle = {};
        styles.forEach((s) => {
            Object.assign(combinedStyle, s);
        });
        return Object.entries(combinedStyle)
            .map(([key, value]) => `${key}: ${value};`)
            .join(' ');
    };

    // 处理事件以构建最终的格式化字符串
    events.forEach((event) => {
        if (position < event.position) {
            const textSegment = formatted.slice(position, event.position);
            const escapedText = escapeHtml(textSegment);

            if (activeStyles.length > 0) {
                const styleStr = styleString(activeStyles);
                output += `<span style="${styleStr}">${escapedText}</span>`;
            } else {
                output += escapedText;
            }
            position = event.position;
        }

        if (event.type === 'start') {
            activeStyles.push(event.style);
        } else if (event.type === 'end') {
            const index = activeStyles.indexOf(event.style);
            if (index > -1) {
                activeStyles.splice(index, 1);
            }
        }
    });

    // 添加剩余的文本
    if (position < formatted.length) {
        const textSegment = formatted.slice(position);
        const escapedText = escapeHtml(textSegment);

        if (activeStyles.length > 0) {
            const styleStr = styleString(activeStyles);
            output += `<span style="${styleStr}">${escapedText}</span>`;
        } else {
            output += escapedText;
        }
    }

    return output;
}