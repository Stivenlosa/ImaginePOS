import { EventEmitter } from "events";

const g = globalThis as unknown as { paymentBus?: EventEmitter };
export const paymentBus = g.paymentBus ?? new EventEmitter();
paymentBus.setMaxListeners(0);
if (process.env.NODE_ENV !== "production") g.paymentBus = paymentBus;