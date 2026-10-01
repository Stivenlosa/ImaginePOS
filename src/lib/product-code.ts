/**
 * Product barcode / business code helpers.
 * Internal DB `id` stays numeric for FKs; `code` is the alphanumeric barcode.
 */

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9\-_]*$/;

export function normalizeProductCode(raw: string | null | undefined): string {
    if (raw == null) return "";
    return String(raw)
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
}

export function isValidProductCode(code: string): boolean {
    return code.length > 0 && code.length <= 64 && CODE_PATTERN.test(code);
}

/** Temporary unique code used only until we assign String(id). */
export function createTemporaryProductCode(): string {
    const rand = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}${Math.random()}`;
    return `TMP${rand.replace(/-/g, "").slice(0, 16).toUpperCase()}`;
}

/** Stable auto code from internal id; falls back if that string is already taken. */
export function autoProductCodeFromId(id: number, taken: boolean): string {
    const primary = String(id);
    if (!taken) return primary;
    return `P${id}`;
}
