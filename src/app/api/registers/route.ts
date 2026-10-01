import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/current-user";
import { createRegister, listRegisters } from "@/lib/register-store";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const registers = await listRegisters();
  return NextResponse.json(registers);
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const body = (await request.json()) as { number?: number; name?: string };
  if (typeof body.number !== "number" || !Number.isInteger(body.number) || body.number < 1) {
    return NextResponse.json({ error: "Invalid register number" }, { status: 400 });
  }

  try {
    const register = await createRegister({ number: body.number, name: body.name });
    return NextResponse.json(register, { status: 201 });
  } catch (error) {
    console.error("Create register failed:", error);
    return NextResponse.json({ error: "Could not create register" }, { status: 500 });
  }
}
