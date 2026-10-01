import { NextResponse } from "next/server";
import { roundMoney } from "@/lib/money";
import {
    isValidProductCode,
    normalizeProductCode,
} from "@/lib/product-code";
import { nowTimestamp } from "@/prisma/dates";
import { db } from "@/prisma/db";
import type { SaleUnit } from "@/types/product";

type RouteParams = {
    params: Promise<{ id: string }>;
};

// GET a single product by ID
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const productId = parseInt(id, 10);

        if (isNaN(productId)) {
            return NextResponse.json(
                { error: "Invalid product ID" },
                { status: 400 }
            );
        }

        const product = await db.orm.public.Product.first({ id: productId });

        if (!product) {
            return NextResponse.json(
                { error: "Product not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Error fetching product" },
            { status: 500 }
        );
    }
}

// PUT update a product
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const productId = parseInt(id, 10);

        if (isNaN(productId)) {
            return NextResponse.json(
                { error: "Invalid product ID" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { name, price, image, saleUnit, code: rawCode } = body;
        const amount = price === undefined ? undefined : typeof price === "number" ? price : parseFloat(price);
        if (amount !== undefined && (!Number.isFinite(amount) || amount < 0)) {
            return NextResponse.json({ error: "Invalid price" }, { status: 400 });
        }

        const updates: {
            name?: string;
            price?: number;
            image?: string | null;
            saleUnit?: SaleUnit;
            code?: string;
            updatedAt: ReturnType<typeof nowTimestamp>;
        } = { updatedAt: nowTimestamp() };

        if (name) updates.name = name;
        if (amount !== undefined) updates.price = roundMoney(amount);
        if (image !== undefined) updates.image = image;
        if (saleUnit) updates.saleUnit = saleUnit as SaleUnit;

        if (rawCode !== undefined) {
            const normalized = normalizeProductCode(
                typeof rawCode === "string" ? rawCode : "",
            );
            if (!normalized || !isValidProductCode(normalized)) {
                return NextResponse.json(
                    { error: "Code must be alphanumeric (letters, numbers, - or _)" },
                    { status: 400 },
                );
            }

            const existing = await db.orm.public.Product.where({ code: normalized }).first();
            if (existing && existing.id !== productId) {
                return NextResponse.json(
                    { error: "Product code already exists" },
                    { status: 409 },
                );
            }
            updates.code = normalized;
        }

        const product = await db.orm.public.Product
            .where({ id: productId })
            .update(updates);

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json(
            { error: "Error updating product" },
            { status: 500 }
        );
    }
}

// DELETE a product
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const { id } = await params;
        const productId = parseInt(id, 10);

        if (isNaN(productId)) {
            return NextResponse.json(
                { error: "Invalid product ID" },
                { status: 400 }
            );
        }

        await db.orm.public.Product.where({ id: productId }).delete();

        return NextResponse.json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json(
            { error: "Error deleting product" },
            { status: 500 }
        );
    }
}
