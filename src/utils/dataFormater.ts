import { parseDate, ensureWasmInitialized } from './date-formatter';

export async function init() {
    await ensureWasmInitialized();
}

export async function formatTimestamp(str: string, format: string): Promise<number> {
    const timestamp = await parseDate(str, format);

    return timestamp
}