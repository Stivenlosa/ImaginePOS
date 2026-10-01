import type { SaleUnit } from "@/types/product";
import { resolveSaleUnit } from "@/lib/sale-unit-resolve";

export type ParsedProductRow = {
    name: string;
    price: number;
    saleUnit: SaleUnit;
    code?: string;
    rowNumber: number;
};

export type ParseProductsCsvResult = {
    products: ParsedProductRow[];
    errors: string[];
};

function parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            cells.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    cells.push(current.trim());
    return cells;
}

function normalizeHeader(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

function findColumnIndex(headers: string[], aliases: string[]): number {
    const normalizedAliases = aliases.map(normalizeHeader);
    return headers.findIndex((header) =>
        normalizedAliases.includes(normalizeHeader(header)),
    );
}

/**
 * Parse a products CSV with columns: name, price, unit, code (optional).
 * EN/ES headers accepted. Image is omitted — set later in the UI.
 */
export function parseProductsCsv(csvText: string): ParseProductsCsvResult {
    const errors: string[] = [];
    const products: ParsedProductRow[] = [];

    const lines = csvText
        .replace(/^\uFEFF/, "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

    if (lines.length === 0) {
        return { products, errors: ["CSV file is empty"] };
    }

    const headers = parseCsvLine(lines[0]);
    const nameIdx = findColumnIndex(headers, ["name", "nombre", "product", "producto"]);
    const priceIdx = findColumnIndex(headers, ["price", "precio"]);
    const unitIdx = findColumnIndex(headers, [
        "unit",
        "unidad",
        "saleunit",
        "unidaddeventa",
    ]);
    const codeIdx = findColumnIndex(headers, [
        "code",
        "codigo",
        "barcode",
        "codigobarras",
        "sku",
        "id",
    ]);

    if (nameIdx < 0 || priceIdx < 0) {
        return {
            products: [],
            errors: [
                'CSV must include "name" and "price" columns (or "nombre" / "precio")',
            ],
        };
    }

    for (let i = 1; i < lines.length; i++) {
        const rowNumber = i + 1;
        const cells = parseCsvLine(lines[i]);
        const name = (cells[nameIdx] ?? "").trim();
        const priceRaw = (cells[priceIdx] ?? "").trim();
        const unitRaw = unitIdx >= 0 ? (cells[unitIdx] ?? "").trim() : "";
        const codeRaw = codeIdx >= 0 ? (cells[codeIdx] ?? "").trim() : "";

        if (!name && !priceRaw && !unitRaw && !codeRaw) {
            continue;
        }

        if (!name) {
            errors.push(`Row ${rowNumber}: name is required`);
            continue;
        }

        const price = Number(priceRaw.replace(/\$/g, "").replace(/,/g, ""));
        if (!Number.isFinite(price) || price < 0) {
            errors.push(`Row ${rowNumber}: invalid price "${priceRaw}"`);
            continue;
        }

        let saleUnit: SaleUnit = "unit";
        if (unitRaw) {
            const resolved = resolveSaleUnit(unitRaw);
            if (!resolved) {
                errors.push(
                    `Row ${rowNumber}: unknown unit "${unitRaw}" (saved as unit)`,
                );
            } else {
                saleUnit = resolved;
            }
        }

        products.push({
            name,
            price,
            saleUnit,
            ...(codeRaw ? { code: codeRaw } : {}),
            rowNumber,
        });
    }

    return { products, errors };
}
