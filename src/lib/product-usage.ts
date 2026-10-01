const STORAGE_KEY = "imaginepos:product-usage";
export const PRODUCT_USAGE_EVENT = "product-usage-updated";

type UsageMap = Record<string, number>;

function readUsageMap(): UsageMap {
    if (typeof window === "undefined") return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw) as unknown;
        if (!parsed || typeof parsed !== "object") return {};
        return parsed as UsageMap;
    } catch {
        return {};
    }
}

function writeUsageMap(map: UsageMap) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
        window.dispatchEvent(new Event(PRODUCT_USAGE_EVENT));
    } catch {
        // Ignore quota / private-mode failures — sorting just falls back to default order.
    }
}

/** Increment local usage for a product. Client-only — no database writes. */
export function recordProductUse(productId: number) {
    const map = readUsageMap();
    const key = String(productId);
    map[key] = (map[key] ?? 0) + 1;
    writeUsageMap(map);
}

export function getProductUsage(productId: number): number {
    return readUsageMap()[String(productId)] ?? 0;
}

/** Sort most-used products first. Stable for equal counts. */
export function sortProductsByUsage<T extends { id: number }>(products: T[]): T[] {
    const map = readUsageMap();
    return [...products].sort((a, b) => {
        const diff = (map[String(b.id)] ?? 0) - (map[String(a.id)] ?? 0);
        if (diff !== 0) return diff;
        return a.id - b.id;
    });
}
