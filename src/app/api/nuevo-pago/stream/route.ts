import { paymentBus } from "../bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        start(controller) {
            const send = (payment: unknown) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(payment)}\n\n`));
            };

            controller.enqueue(encoder.encode(": connected\n\n"));
            paymentBus.on("nuevo-pago", send);

            const heartbeat = setInterval(() => {
                controller.enqueue(encoder.encode(": ping\n\n"));
            }, 25000);

            request.signal.addEventListener("abort", () => {
                clearInterval(heartbeat);
                paymentBus.off("nuevo-pago", send);
                try { controller.close(); } catch {}
            });
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",   // ← add this
        },
    });
}