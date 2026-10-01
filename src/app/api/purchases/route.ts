import { NextResponse } from "next/server";
import { getActiveUser } from "@/lib/current-user";
import { moneyEquals, roundMoney } from "@/lib/money";
import { columnsForPayments, type TenderLine } from "@/lib/payment-split";
import { getActiveRegisterSessionFromCookie } from "@/lib/register-session";
import { validatePendingTransfers } from "@/lib/validate-transfers";
import { nowTimestamp } from "@/prisma/dates";
import { db } from "@/prisma/db";
import { moneyLineTotal, type PaymentType, type SaleUnit } from "@/types/product";

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
    paymentType?: PaymentType;
    payments?: TenderLine[];
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
        const user = await getActiveUser();
        if (!user) {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        const registerContext = await getActiveRegisterSessionFromCookie();
        if (!registerContext) {
            return NextResponse.json(
                { error: "No open register session on this terminal" },
                { status: 409 },
            );
        }

        const body: CreatePurchaseInput = await request.json();
        const { orderNumber, subtotal, tax, total, paymentType, payments, details } = body;

        if (!orderNumber || subtotal === undefined || total === undefined || !details?.length) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const pricedDetails = details.map((detail) => ({
            ...detail,
            price: roundMoney(detail.price),
            lineTotal: moneyLineTotal(detail.price, detail.quantity, detail.saleUnit, detail.weight),
        }));
        const computedSubtotal = roundMoney(
            pricedDetails.reduce((sum, line) => sum + line.lineTotal, 0),
        );
        const computedTax = roundMoney(tax);
        const computedTotal = roundMoney(computedSubtotal + computedTax);
        if (!moneyEquals(computedSubtotal, subtotal) || !moneyEquals(computedTotal, total)) {
            return NextResponse.json({ error: "Purchase totals do not match line items" }, { status: 400 });
        }

        const tender = Array.isArray(payments) && payments.length > 0
            ? payments
            : paymentType
                ? [{ type: paymentType, amount: computedTotal }]
                : null;
        const settled = tender ? columnsForPayments(computedTotal, tender) : null;
        if (!settled) {
            return NextResponse.json(
                { error: "Payment amounts do not match the total" },
                { status: 400 },
            );
        }

        const purchase = await db.transaction(async (tx) => {
            const session = await tx.orm.public.RegisterSession.where({
                id: registerContext.session.id,
            }).first();
            if (!session || session.status !== "open") {
                throw new Error("REGISTER_SESSION_CLOSED");
            }

            const created = await tx.orm.public.Purchase.create({
                orderNumber,
                subtotal: computedSubtotal,
                tax: computedTax,
                total: computedTotal,
                paymentType: settled.paymentType,
                cashAmount: settled.cashAmount,
                cardAmount: settled.cardAmount,
                transferAmount: settled.transferAmount,
                transferStatus: settled.transferAmount > 0 ? "pending" : null,
                registerSessionId: session.id,
                cashierUserId: registerContext.session.cashierUserId,
                updatedAt: nowTimestamp(),
            });

            await tx.orm.public.PurchaseDetail.createAll(
                pricedDetails.map((detail) => ({
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

        if (settled.transferAmount > 0) {
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
        if (error instanceof Error && error.message === "REGISTER_SESSION_CLOSED") {
            return NextResponse.json({ error: "Register session is closed" }, { status: 409 });
        }
        console.error("Error creating purchase:", error);
        return NextResponse.json(
            { error: "Error creating purchase" },
            { status: 500 }
        );
    }
}
