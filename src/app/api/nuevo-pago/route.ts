import { NextResponse } from "next/server";
import { paymentBus } from "./bus";

export const runtime = "nodejs";

export async function POST(request: Request) {
    const payment = await request.json();
    if (!payment?.nombre || payment?.valor === undefined) {
        return NextResponse.json({ error: "Missing nombre or valor" }, { status: 400 });
    }
    paymentBus.emit("nuevo-pago", payment);
    console.log("💸 nuevo-pago broadcast:", payment);
    return NextResponse.json({ ok: true });
}