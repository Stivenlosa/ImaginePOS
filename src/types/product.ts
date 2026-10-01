import { roundMoney } from "@/lib/money";

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

export const PAYMENT_TYPES = ["cash", "card", "transfer"] as const;

export type PaymentType = (typeof PAYMENT_TYPES)[number];

export type Product = {
    id: number;
    code: string;
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

export function moneyLineTotal(
    price: number,
    quantity: number,
    saleUnit: SaleUnit,
    weight?: number | null,
): number {
    const unitPrice = roundMoney(price);
    if (isWeightBasedUnit(saleUnit) && weight != null) {
        return roundMoney(unitPrice * weight);
    }
    return unitPrice * quantity;
}

// Calculate item total based on unit type
export function calculateItemTotal(item: CartItem): number {
    return moneyLineTotal(item.price, item.qty, item.saleUnit, item.weight);
}
