import { todayBusinessDate } from "@/lib/business-date";
import {
  buildSessionSummary,
  computeCashVariance,
  roundMoney,
  sumPaymentTotals,
} from "@/lib/register-reconciliation";
import { nowTimestamp, timestampToIso } from "@/prisma/dates";
import { db } from "@/prisma/db";

export async function listRegisters() {
  return db.orm.public.Register.orderBy((register) => register.number.asc()).all();
}

export async function createRegister(input: { number: number; name?: string | null }) {
  const updatedAt = nowTimestamp();
  return db.orm.public.Register.create({
    number: input.number,
    name: input.name?.trim() || null,
    active: true,
    updatedAt,
  });
}

export async function updateRegister(
  id: number,
  input: { number?: number; name?: string | null; active?: boolean },
) {
  const existing = await db.orm.public.Register.where({ id }).first();
  if (!existing) return null;

  const updatedAt = nowTimestamp();
  await db.orm.public.Register.where({ id }).update({
    ...(input.number !== undefined ? { number: input.number } : {}),
    ...(input.name !== undefined ? { name: input.name?.trim() || null } : {}),
    ...(input.active !== undefined ? { active: input.active } : {}),
    updatedAt,
  });

  return db.orm.public.Register.where({ id }).first();
}

export async function getOpenBusinessDay() {
  return db.orm.public.BusinessDay.where({ status: "open" })
    .include("openedBy", (user) => user.select("id", "name", "username"))
    .first();
}

export async function openBusinessDay(openedByUserId: number, businessDate?: string) {
  const date = businessDate ?? todayBusinessDate();
  const existingOpen = await getOpenBusinessDay();
  if (existingOpen) {
    throw new Error("BUSINESS_DAY_ALREADY_OPEN");
  }

  const existing = await db.orm.public.BusinessDay.where({ businessDate: date }).first();
  if (existing) {
    await db.orm.public.BusinessDay.where({ id: existing.id }).update({
      status: "open",
      closedAt: null,
      closedByUserId: null,
      purchaseCount: null,
      totalSales: null,
      totalCash: null,
      totalCard: null,
      totalTransfer: null,
      totalExpectedCash: null,
      totalCountedCash: null,
      totalCashVariance: null,
    });
    return { reopened: true as const };
  }

  await db.orm.public.BusinessDay.create({
    businessDate: date,
    status: "open",
    openedByUserId,
  });
  return { reopened: false as const };
}

export async function getRegisterSessionById(sessionId: number) {
  return db.orm.public.RegisterSession.where({ id: sessionId })
    .include("register")
    .include("businessDay")
    .include("cashier", (user) => user.select("id", "name", "username", "role"))
    .include("openedBy", (user) => user.select("id", "name", "username"))
    .first();
}

export async function getOpenRegisterSessionForRegister(registerId: number) {
  return db.orm.public.RegisterSession.where({ registerId, status: "open" }).first();
}

export async function listSessionsForBusinessDay(businessDayId: number) {
  return db.orm.public.RegisterSession.where({ businessDayId })
    .include("register")
    .include("cashier", (user) => user.select("id", "name", "username"))
    .orderBy((session) => session.openedAt.asc())
    .all();
}

async function purchasesForSession(sessionId: number) {
  return db.orm.public.Purchase.where({ registerSessionId: sessionId })
    .select("total", "paymentType", "cashAmount", "cardAmount", "transferAmount")
    .all();
}

export async function liveSessionSummary(sessionId: number) {
  const session = await db.orm.public.RegisterSession.where({ id: sessionId }).first();
  if (!session) return null;
  const purchases = await purchasesForSession(sessionId);
  return buildSessionSummary(session.openingFloat, purchases);
}

export async function openRegisterSession(input: {
  registerId: number;
  cashierUserId: number;
  openedByUserId: number;
  openingFloat: number;
}) {
  return db.transaction(async (tx) => {
    const businessDay = await tx.orm.public.BusinessDay.where({ status: "open" }).first();
    if (!businessDay) {
      throw new Error("NO_OPEN_BUSINESS_DAY");
    }

    const register = await tx.orm.public.Register.where({ id: input.registerId }).first();
    if (!register?.active) {
      throw new Error("REGISTER_NOT_AVAILABLE");
    }

    const openOnRegister = await tx.orm.public.RegisterSession.where({
      registerId: input.registerId,
      status: "open",
    }).first();
    if (openOnRegister) {
      throw new Error("REGISTER_ALREADY_OPEN");
    }

    const cashier = await tx.orm.public.User.where({ id: input.cashierUserId }).first();
    if (!cashier?.active) {
      throw new Error("CASHIER_NOT_AVAILABLE");
    }

    return tx.orm.public.RegisterSession.create({
      registerId: input.registerId,
      businessDayId: businessDay.id,
      cashierUserId: input.cashierUserId,
      openedByUserId: input.openedByUserId,
      status: "open",
      openingFloat: roundMoney(input.openingFloat),
    });
  });
}

export async function closeRegisterSession(input: {
  sessionId: number;
  closedByUserId: number;
  countedCash: number;
}) {
  return db.transaction(async (tx) => {
    const session = await tx.orm.public.RegisterSession.where({ id: input.sessionId }).first();
    if (!session) {
      throw new Error("SESSION_NOT_FOUND");
    }
    if (session.status !== "open") {
      throw new Error("SESSION_ALREADY_CLOSED");
    }

    const purchases = await tx.orm.public.Purchase.where({ registerSessionId: session.id })
      .select("total", "paymentType", "cashAmount", "cardAmount", "transferAmount")
      .all();
    const summary = buildSessionSummary(session.openingFloat, purchases);
    const countedCash = roundMoney(input.countedCash);
    const cashVariance = computeCashVariance(summary.expectedCash, countedCash);
    const closedAt = nowTimestamp();

    await tx.orm.public.RegisterSession.where({ id: session.id }).update({
      status: "closed",
      closedByUserId: input.closedByUserId,
      closedAt,
      purchaseCount: summary.purchaseCount,
      totalSales: summary.totalSales,
      cashTotal: summary.cashTotal,
      cardTotal: summary.cardTotal,
      transferTotal: summary.transferTotal,
      expectedCash: summary.expectedCash,
      countedCash,
      cashVariance,
    });

    return tx.orm.public.RegisterSession.where({ id: session.id })
      .include("register")
      .include("cashier", (user) => user.select("id", "name", "username"))
      .first();
  });
}

export async function closeBusinessDay(closedByUserId: number) {
  return db.transaction(async (tx) => {
    const businessDay = await tx.orm.public.BusinessDay.where({ status: "open" }).first();
    if (!businessDay) {
      throw new Error("NO_OPEN_BUSINESS_DAY");
    }

    const sessions = await tx.orm.public.RegisterSession.where({ businessDayId: businessDay.id }).all();
    const openSession = sessions.find((session) => session.status === "open");
    if (openSession) {
      throw new Error("REGISTER_SESSIONS_STILL_OPEN");
    }

    const closedSessions = sessions.filter((session) => session.status === "closed");
    const sessionTotals = closedSessions.map((session) => ({
      purchaseCount: session.purchaseCount ?? 0,
      totalSales: session.totalSales ?? 0,
      cashTotal: session.cashTotal ?? 0,
      cardTotal: session.cardTotal ?? 0,
      transferTotal: session.transferTotal ?? 0,
    }));

    const dayTotals = sumPaymentTotals(sessionTotals);
    const totalExpectedCash = roundMoney(
      closedSessions.reduce((sum, session) => sum + (session.expectedCash ?? 0), 0),
    );
    const totalCountedCash = roundMoney(
      closedSessions.reduce((sum, session) => sum + (session.countedCash ?? 0), 0),
    );
    const totalCashVariance = roundMoney(totalCountedCash - totalExpectedCash);
    const closedAt = nowTimestamp();

    await tx.orm.public.BusinessDay.where({ id: businessDay.id }).update({
      status: "closed",
      closedByUserId,
      closedAt,
      purchaseCount: dayTotals.purchaseCount,
      totalSales: dayTotals.totalSales,
      totalCash: dayTotals.cashTotal,
      totalCard: dayTotals.cardTotal,
      totalTransfer: dayTotals.transferTotal,
      totalExpectedCash,
      totalCountedCash,
      totalCashVariance,
    });

    return tx.orm.public.BusinessDay.where({ id: businessDay.id })
      .include("openedBy", (user) => user.select("id", "name", "username"))
      .include("closedBy", (user) => user.select("id", "name", "username"))
      .first();
  });
}

export async function listClosedBusinessDays(limit = 30) {
  const rows = await db.orm.public.BusinessDay.where({ status: "closed" })
    .include("openedBy", (user) => user.select("id", "name", "username"))
    .include("closedBy", (user) => user.select("id", "name", "username"))
    .orderBy((day) => day.closedAt.desc())
    .all();
  return rows.slice(0, limit);
}

type BusinessDayRow = {
  id: number;
  businessDate: string;
  status: "open" | "closed";
  openedAt: Parameters<typeof timestampToIso>[0];
  closedAt: Parameters<typeof timestampToIso>[0] | null;
  purchaseCount: number | null;
  totalSales: number | null;
  totalCash: number | null;
  totalCard: number | null;
  totalTransfer: number | null;
  totalExpectedCash: number | null;
  totalCountedCash: number | null;
  totalCashVariance: number | null;
  openedBy?: { id: number; name: string; username: string } | null;
  closedBy?: { id: number; name: string; username: string } | null;
};

export function serializeBusinessDay(day: BusinessDayRow | null | undefined) {
  if (!day) return null;
  return {
    id: day.id,
    businessDate: day.businessDate,
    status: day.status,
    openedAt: timestampToIso(day.openedAt),
    openedBy: day.openedBy ?? null,
    closedBy: day.closedBy ?? null,
    closedAt: day.closedAt ? timestampToIso(day.closedAt) : null,
    purchaseCount: day.purchaseCount,
    totalSales: day.totalSales,
    totalCash: day.totalCash,
    totalCard: day.totalCard,
    totalTransfer: day.totalTransfer,
    totalExpectedCash: day.totalExpectedCash,
    totalCountedCash: day.totalCountedCash,
    totalCashVariance: day.totalCashVariance,
  };
}

export function serializeRegisterSession(
  session: NonNullable<Awaited<ReturnType<typeof getRegisterSessionById>>>,
  summary?: Awaited<ReturnType<typeof liveSessionSummary>>,
) {
  return {
    id: session.id,
    status: session.status,
    openingFloat: session.openingFloat,
    openedAt: timestampToIso(session.openedAt),
    closedAt: session.closedAt ? timestampToIso(session.closedAt) : null,
    register: session.register,
    businessDay: {
      id: session.businessDay.id,
      businessDate: session.businessDay.businessDate,
      status: session.businessDay.status,
    },
    cashier: session.cashier,
    openedBy: session.openedBy,
    closeSnapshot:
      session.status === "closed"
        ? {
            purchaseCount: session.purchaseCount,
            totalSales: session.totalSales,
            cashTotal: session.cashTotal,
            cardTotal: session.cardTotal,
            transferTotal: session.transferTotal,
            expectedCash: session.expectedCash,
            countedCash: session.countedCash,
            cashVariance: session.cashVariance,
          }
        : summary ?? null,
  };
}
