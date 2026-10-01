import { NextResponse } from "next/server";
import { createProductWithCode } from "@/lib/product-create";
import { db } from "@/prisma/db";
import type { SaleUnit } from "@/types/product";

// GET all products
export async function GET() {
    try {
        const products = await db.orm.public.Product
            .orderBy((product) => product.createdAt.desc())
            .all();

        return NextResponse.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Error fetching products" },
            { status: 500 }
        );
    }
}

// POST create a new product
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, price, image, saleUnit, code } = body;

        const amount = typeof price === "number" ? price : parseFloat(price);
        if (!name || price === undefined || !Number.isFinite(amount) || amount < 0) {
            return NextResponse.json(
                { error: "Name and price are required" },
                { status: 400 }
            );
        }

        const result = await createProductWithCode({
            name,
            price: amount,
            image: image || null,
            saleUnit: (saleUnit as SaleUnit) || "unit",
            code,
        });

        if (!result.ok) {
            return NextResponse.json(
                { error: result.error },
                { status: result.status },
            );
        }

        return NextResponse.json(result.product, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Error creating product" },
            { status: 500 }
        );
    }
}
