// Sale unit types for products
export const SALE_UNITS = {
    unit: { label: "Unit", suffix: "ea", isWeightBased: false },
    kg: { label: "Kilogram", suffix: "/kg", isWeightBased: true },
    lb: { label: "Pound", suffix: "/lb", isWeightBased: true },
    oz: { label: "Ounce", suffix: "/oz", isWeightBased: true },
    g: { label: "Gram", suffix: "/g", isWeightBased: true },
    liter: { label: "Liter", suffix: "/L", isWeightBased: true },
    ml: { label: "Milliliter", suffix: "/ml", isWeightBased: true },
} as const;

export type SaleUnit = keyof typeof SALE_UNITS;

export type Product = {
    id: number;
    name: string;
    price: number;
    image?: string | null;
    saleUnit: SaleUnit;
};

export type CartItem = Product & { 
    qty: number;
    weight?: number; // For weight-based products (kg, lb, etc.)
};

// Helper to get display label for a sale unit
export function getSaleUnitLabel(unit: SaleUnit): string {
    return SALE_UNITS[unit].label;
}

// Helper to get price suffix for a sale unit
export function getSaleUnitSuffix(unit: SaleUnit): string {
    return SALE_UNITS[unit].suffix;
}

// Helper to check if a sale unit is weight-based
export function isWeightBasedUnit(unit: SaleUnit): boolean {
    return SALE_UNITS[unit].isWeightBased;
}

// Calculate item total based on unit type
export function calculateItemTotal(item: CartItem): number {
    if (isWeightBasedUnit(item.saleUnit) && item.weight !== undefined) {
        return item.price * item.weight;
    }
    return item.price * item.qty;
}
