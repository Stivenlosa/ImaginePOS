import { NextResponse } from "next/server";
import { nowTimestamp } from "@/prisma/dates";
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
        const { name, price, image, saleUnit } = body;

        if (!name || price === undefined) {
            return NextResponse.json(
                { error: "Name and price are required" },
                { status: 400 }
            );
        }

        const product = await db.orm.public.Product.create({
            name,
            price: parseFloat(price),
            image: image || null,
            saleUnit: (saleUnit as SaleUnit) || "unit",
            updatedAt: nowTimestamp(),
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Error creating product" },
            { status: 500 }
        );
    }
}
