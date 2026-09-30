import { NextResponse } from "next/server";
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
        const { name, price, image, saleUnit } = body;

        const product = await db.orm.public.Product
            .where({ id: productId })
            .update({
                ...(name && { name }),
                ...(price !== undefined && { price: parseFloat(price) }),
                ...(image !== undefined && { image }),
                ...(saleUnit && { saleUnit: saleUnit as SaleUnit }),
                updatedAt: nowTimestamp(),
            });

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
