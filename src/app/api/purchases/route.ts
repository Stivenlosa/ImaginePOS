import { NextResponse } from "next/server";
import { prisma } from "@/db";
import type { PaymentType, SaleUnit } from "@/generated/prisma";

type PurchaseDetailInput = {
    productId: number;
    productName: string;
    price: number;
    quantity: number;
    weight?: number;
    saleUnit: SaleUnit;
    lineTotal: number;
};

type CreatePurchaseInput = {
    orderNumber: string;
    subtotal: number;
    tax: number;
    total: number;
    paymentType: PaymentType;
    details: PurchaseDetailInput[];
};

// GET all purchases
export async function GET() {
    try {
        const purchases = await prisma.purchase.findMany({
            include: {
                details: {
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(purchases);
    } catch (error) {
        console.error("Error fetching purchases:", error);
        return NextResponse.json(
            { error: "Error fetching purchases" },
            { status: 500 }
        );
    }
}

// POST create a new purchase
export async function POST(request: Request) {
    try {
        const body: CreatePurchaseInput = await request.json();
        const { orderNumber, subtotal, tax, total, paymentType, details } = body;

        // Validate required fields
        if (!orderNumber || subtotal === undefined || total === undefined || !paymentType || !details?.length) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Validate payment type
        const validPaymentTypes: PaymentType[] = ["cash", "card", "transfer"];
        if (!validPaymentTypes.includes(paymentType)) {
            return NextResponse.json(
                { error: "Invalid payment type" },
                { status: 400 }
            );
        }

        // Create purchase with details in a transaction
        const purchase = await prisma.purchase.create({
            data: {
                orderNumber,
                subtotal,
                tax,
                total,
                paymentType,
                details: {
                    create: details.map((detail) => ({
                        productId: detail.productId,
                        productName: detail.productName,
                        price: detail.price,
                        quantity: detail.quantity,
                        weight: detail.weight || null,
                        saleUnit: detail.saleUnit,
                        lineTotal: detail.lineTotal,
                    })),
                },
            },
            include: {
                details: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        return NextResponse.json(purchase, { status: 201 });
    } catch (error) {
        console.error("Error creating purchase:", error);
        return NextResponse.json(
            { error: "Error creating purchase" },
            { status: 500 }
        );
    }
}
