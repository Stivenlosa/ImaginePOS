import type { SaleUnit } from "@/types/product";
import { SALE_UNITS } from "@/types/product";

/** Aliases (EN/ES + shortcuts). Longer entries win for contains matching. */
const SALE_UNIT_ALIASES: Record<SaleUnit, string[]> = {
    unit: [
        "unidad",
        "unidades",
        "unit",
        "units",
        "pieza",
        "piezas",
        "each",
        "und",
        "ea",
    ],
    kg: [
        "kilogramos",
        "kilogramo",
        "kilograms",
        "kilogram",
        "kilos",
        "kilo",
        "kg",
    ],
    lb: ["libras", "libra", "pounds", "pound", "lbs", "lb"],
    oz: ["ounces", "ounce", "onzas", "onza", "oz"],
    g: ["gramos", "gramo", "grams", "gram", "gr", "g"],
    liter: [
        "litros",
        "litro",
        "liters",
        "liter",
        "litres",
        "litre",
        "lt",
        "l",
    ],
    ml: [
        "mililitros",
        "mililitro",
        "milliliters",
        "milliliter",
        "millilitres",
        "millilitre",
        "ml",
    ],
};

function normalizeUnitText(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

type AliasCandidate = { unit: SaleUnit; alias: string };

const ALIAS_CANDIDATES: AliasCandidate[] = (
    Object.entries(SALE_UNIT_ALIASES) as [SaleUnit, string[]][]
)
    .flatMap(([unit, aliases]) =>
        aliases.map((alias) => ({ unit, alias: normalizeUnitText(alias) })),
    )
    .sort((a, b) => b.alias.length - a.alias.length);

/**
 * Resolve a free-text unit (EN/ES, shortcuts, or partial/contains) to a SaleUnit.
 * Returns null when nothing matches.
 */
export function resolveSaleUnit(raw: string | null | undefined): SaleUnit | null {
    if (raw == null) return null;

    const normalized = normalizeUnitText(String(raw));
    if (!normalized) return null;

    // Exact DB key
    if (normalized in SALE_UNITS) {
        return normalized as SaleUnit;
    }

    // Exact alias
    const exact = ALIAS_CANDIDATES.find((c) => c.alias === normalized);
    if (exact) return exact.unit;

    // Contains either way (e.g. "kilo", "por kilogramo", "1 kg")
    const contains = ALIAS_CANDIDATES.find(
        (c) =>
            c.alias.length >= 2 &&
            (normalized.includes(c.alias) || c.alias.includes(normalized)),
    );
    if (contains) return contains.unit;

    // Allow single-letter exact aliases already covered; no short contains for "g"/"l"
    return null;
}

export function resolveSaleUnitOrDefault(
    raw: string | null | undefined,
    fallback: SaleUnit = "unit",
): SaleUnit {
    return resolveSaleUnit(raw) ?? fallback;
}
