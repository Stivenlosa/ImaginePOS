import { NextResponse } from "next/server";
import { getPaymentsOverviewData } from "@/services/charts.services";

export async function GET(request: Request) {
  const year = Number(new URL(request.url).searchParams.get("year"));
  const currentYear = new Date().getFullYear();

  if (!Number.isInteger(year) || year < 2000 || year > currentYear) {
    return NextResponse.json({ error: "invalid_year" }, { status: 400 });
  }

  const data = await getPaymentsOverviewData(year);
  return NextResponse.json(data);
}
