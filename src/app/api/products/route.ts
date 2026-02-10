import { NextResponse } from "next/server";
import { prisma } from "@/db";
import type { SaleUnit } from "@/generated/prisma";

// GET all products
export async function GET() {
    try {
        const products = await prisma.product.findMany({
            orderBy: { createdAt: "desc" },
        });

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

        const product = await prisma.product.create({
            data: {
                name,
                price: parseFloat(price),
                image: image || null,
                saleUnit: (saleUnit as SaleUnit) || "unit",
            },
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
