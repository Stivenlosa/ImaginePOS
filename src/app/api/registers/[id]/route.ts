import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/current-user";
import { updateRegister } from "@/lib/register-store";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.status === 401 ? "unauthorized" : "forbidden" }, { status: auth.status });
  }

  const { id: idParam } = await context.params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Invalid register id" }, { status: 400 });
  }

  const body = (await request.json()) as {
    number?: number;
    name?: string | null;
    active?: boolean;
  };

  if (body.number !== undefined && (!Number.isInteger(body.number) || body.number < 1)) {
    return NextResponse.json({ error: "Invalid register number" }, { status: 400 });
  }

  const register = await updateRegister(id, body);
  if (!register) {
    return NextResponse.json({ error: "Register not found" }, { status: 404 });
  }

  return NextResponse.json(register);
}
