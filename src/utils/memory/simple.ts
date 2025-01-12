class Dictionary {
    private dict: Map<string, number>;
    private reverseDict: Map<number, string>;
    private nextId: number;
    private size: number;

    constructor() {
        this.dict = new Map<string, number>();
        this.reverseDict = new Map<number, string>();
        this.nextId = 0;
        this.size = 0;
    }

    public add(str: string): number {
        if (!this.dict.has(str)) {
            this.dict.set(str, this.nextId);
            this.reverseDict.set(this.nextId, str);
            this.size += str.length * 2 + 4; // 每个字符2字节 + 4字节的ID
            this.nextId++;
        }
        return this.dict.get(str)!;
    }

    public get(id: number): string {
        const word = this.reverseDict.get(id);
        if (word === undefined) {
            throw new Error(`Dictionary ID ${id} not found`);
        }
        return word;
    }

    public getSize(): number {
        return this.size;
    }

    // 获取当前字典大小
    public getWordCount(): number {
        return this.dict.size;
    }
}

class TextCompressor {
    private dict: Dictionary;
    private totalOriginalSize: number;
    private totalCompressedArraySize: number;
    // 定义分隔符正则表达式
    private static readonly SPLIT_REGEX = /[\s,\.|\\/\-_:;\[\]\{\}\(\)\"\'`~!@#$%^&*+=<>?\n\r\t]+/;

    constructor() {
        this.dict = new Dictionary();
        this.totalOriginalSize = 0;
        this.totalCompressedArraySize = 0;
    }

    private getOriginalSize(text: string): number {
        return text.length * 2;
    }

    private addCompressedSize(compressed: number[]): number {
        const size = compressed.length * 4;
        this.totalCompressedArraySize += size;
        return size;
    }

    public compress(text: string): number[] {
        // 使用扩展的分隔符正则表达式
        const words = text.trim().split(TextCompressor.SPLIT_REGEX)
            .filter(word => word.length > 0); // 过滤掉空字符串
        const compressed = words.map(word => this.dict.add(word));

        // 更新累计原始大小
        const currentOriginalSize = this.getOriginalSize(text);
        this.totalOriginalSize += currentOriginalSize;
        this.addCompressedSize(compressed);

        // 更新压缩数组大小
        // const currentCompressedSize = this.addCompressedSize(compressed);

        // 计算并打印压缩统计信息
        // const dictSize = this.dict.getSize();
        // const totalSize = this.totalCompressedArraySize + dictSize;
        // const ratio = (totalSize / this.totalOriginalSize) * 100;

        // console.log('压缩统计信息:');
        // console.log(`当前文本大小: ${currentOriginalSize} bytes`);
        // console.log(`当前压缩大小: ${currentCompressedSize} bytes`);
        // console.log(`累计原始大小: ${this.totalOriginalSize} bytes`);
        // console.log(`累计压缩大小: ${this.totalCompressedArraySize} bytes`);
        // console.log(`字典大小: ${dictSize} bytes`);
        // console.log(`总大小: ${totalSize} bytes`);
        // console.log(`当前压缩率: ${ratio.toFixed(2)}%`);

        return compressed;
    }

    public decompress(compressed: number[]): string {
        return compressed.map(id => this.dict.get(id)).join(' ');
    }

    public printStatistics(): void {
        // 打印统计信息
        const dictSize = this.dict.getSize();
        const totalSize = this.totalCompressedArraySize + dictSize;
        const ratio = (totalSize / this.totalOriginalSize) * 100;
        console.log('统计信息:');
        console.log(`总原始大小: ${this.totalOriginalSize} bytes`);
        console.log(`总压缩大小: ${this.totalCompressedArraySize} bytes`);
        console.log(`字典大小: ${dictSize} bytes`);
        console.log(`总大小: ${totalSize} bytes`);
        console.log(`总压缩率: ${ratio.toFixed(2)}%`);
    }
}


export const logCompressor = new TextCompressor();