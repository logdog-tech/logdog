import init, { parse_datetime } from '../../wasm/pkg';

let wasmInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureWasmInitialized() {
    console.log('1. 进入初始化函数');

    if (wasmInitialized) {
        console.log('已经初始化过了');
        return;
    }

    if (!initPromise) {
        console.log('2. 开始创建初始化Promise');
        initPromise = (async () => {
            try {
                console.log('3. 准备调用init()');
                // 查看init函数内容
                console.log('init function:', init.toString());

                // 尝试直接获取wasm文件
                const wasmResponse = await fetch('/src/wasm/pkg/date_parser_bg.wasm');
                console.log('WASM文件响应:', wasmResponse.status, wasmResponse.statusText);

                console.log('3.1 开始调用init()');
                const result = await init();
                console.log('3.2 init()返回结果:', result);

                console.log('4. init()调用成功');
                wasmInitialized = true;
            } catch (e) {
                console.log('初始化错误:', e);
                initPromise = null;
                throw e;
            }
        })();
    }

    console.log('5. 等待初始化完成');
    await initPromise;
    console.log('6. 初始化完成');
}

export async function parseDate(input: string, format: string): Promise<number> {
    // console.log(`[DateParser] Parsing date - Input: "${input}", Format: "${format}"`);
    return parse_datetime(input, format);
}
