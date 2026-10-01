import { NextResponse } from "next/server";
import { validatePendingTransfers } from "@/lib/validate-transfers";
import { nowTimestamp } from "@/prisma/dates";
import { db } from "@/prisma/db";
import type { PaymentType, SaleUnit } from "@/types/product";

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
        const purchases = await db.orm.public.Purchase
            .include("details", (details) => details.include("product"))
            .orderBy((purchase) => purchase.createdAt.desc())
            .all();

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

        const purchase = await db.transaction(async (tx) => {
            const created = await tx.orm.public.Purchase.create({
                orderNumber,
                subtotal,
                tax,
                total,
                paymentType,
                transferStatus: paymentType === "transfer" ? "pending" : null,
                updatedAt: nowTimestamp(),
            });

            await tx.orm.public.PurchaseDetail.createAll(
                details.map((detail) => ({
                    purchaseId: created.id,
                    productId: detail.productId,
                    productName: detail.productName,
                    price: detail.price,
                    quantity: detail.quantity,
                    weight: detail.weight || null,
                    saleUnit: detail.saleUnit,
                    lineTotal: detail.lineTotal,
                })),
            );

            const full = await tx.orm.public.Purchase
                .where({ id: created.id })
                .include("details", (line) => line.include("product"))
                .first();

            if (!full) {
                throw new Error("Purchase not found after create");
            }

            return full;
        });

        if (paymentType === "transfer") {
            try {
                await validatePendingTransfers();
            } catch (error) {
                console.error("Transfer email check failed:", error);
            }

            const refreshed = await db.orm.public.Purchase
                .where({ id: purchase.id })
                .include("details", (line) => line.include("product"))
                .first();

            if (refreshed) {
                return NextResponse.json(refreshed, { status: 201 });
            }
        }

        return NextResponse.json(purchase, { status: 201 });
    } catch (error) {
        console.error("Error creating purchase:", error);
        return NextResponse.json(
            { error: "Error creating purchase" },
            { status: 500 }
        );
    }
}
