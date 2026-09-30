"use client";
    import { useEffect } from "react";
    import { announcePayment } from "@/utils/speech";
    
    export function usePaymentNotifications() {
        useEffect(() => {
            const es = new EventSource("/api/nuevo-pago/stream");
    
            es.onmessage = (event) => {
                try {
                    const payment = JSON.parse(event.data);
                    console.log("🔔 payment received:", payment);
                    announcePayment(payment.nombre, payment.valor);
                } catch (e) {
                    console.error("Bad SSE payload", e);
                }
            };
    
            es.onerror = (err) => console.error("SSE error", err);
    
            return () => es.close();
        }, []);
    }