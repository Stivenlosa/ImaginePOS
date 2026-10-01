import { NextResponse } from "next/server";
import { createProductWithCode } from "@/lib/product-create";
import { resolveSaleUnitOrDefault } from "@/lib/sale-unit-resolve";
import type { SaleUnit } from "@/types/product";
import { SALE_UNITS } from "@/types/product";

type ImportProductInput = {
    name?: unknown;
    price?: unknown;
    saleUnit?: unknown;
    code?: unknown;
};

function isSaleUnit(value: string): value is SaleUnit {
    return value in SALE_UNITS;
}

// POST bulk-create products from a parsed CSV payload
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const items = Array.isArray(body?.products) ? body.products : null;

        if (!items || items.length === 0) {
            return NextResponse.json(
                { error: "No products to import" },
                { status: 400 },
            );
        }

        const created = [];
        const errors: string[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i] as ImportProductInput;
            const name = typeof item.name === "string" ? item.name.trim() : "";
            const amount =
                typeof item.price === "number"
                    ? item.price
                    : parseFloat(String(item.price ?? ""));

            if (!name || !Number.isFinite(amount) || amount < 0) {
                errors.push(`Item ${i + 1}: name and a valid price are required`);
                continue;
            }

            const rawUnit =
                typeof item.saleUnit === "string" ? item.saleUnit : "unit";
            const saleUnit = isSaleUnit(rawUnit)
                ? rawUnit
                : resolveSaleUnitOrDefault(rawUnit);

            const code =
                typeof item.code === "string" ? item.code : null;

            const result = await createProductWithCode({
                name,
                price: amount,
                image: null,
                saleUnit,
                code,
            });

            if (!result.ok) {
                errors.push(`Item ${i + 1}: ${result.error} ("${name}")`);
                continue;
            }

            created.push(result.product);
        }

        if (created.length === 0) {
            return NextResponse.json(
                {
                    error: errors[0] || "No products were imported",
                    errors,
                    created: [],
                },
                { status: 400 },
            );
        }

        return NextResponse.json(
            {
                created,
                createdCount: created.length,
                errors,
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("Error importing products:", error);
        return NextResponse.json(
            { error: "Error importing products" },
            { status: 500 },
        );
    }
}
