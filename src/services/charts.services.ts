import { prisma } from "@/db";

export async function getDevicesUsedData(
  timeFrame?: "monthly" | "yearly" | (string & {}),
) {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const data = [
    {
      name: "Desktop",
      percentage: 0.65,
      amount: 1625,
    },
    {
      name: "Tablet",
      percentage: 0.1,
      amount: 250,
    },
    {
      name: "Mobile",
      percentage: 0.2,
      amount: 500,
    },
    {
      name: "Unknown",
      percentage: 0.05,
      amount: 125,
    },
  ];

  if (timeFrame === "yearly") {
    data[0].amount = 19500;
    data[1].amount = 3000;
    data[2].amount = 6000;
    data[3].amount = 1500;
  }

  return data;
}

export async function getPaymentsOverviewData() {
  const now = new Date();
  const currentYear = now.getFullYear();

  // Get all purchases for the current year
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear + 1, 0, 1);

  const purchases = await prisma.purchase.findMany({
    where: {
      createdAt: {
        gte: startOfYear,
        lt: endOfYear,
      },
    },
    select: {
      total: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Aggregate totals by month
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const monthlyTotals = new Array(12).fill(0);
  for (const purchase of purchases) {
    const month = purchase.createdAt.getMonth();
    monthlyTotals[month] += purchase.total;
  }

  const received = monthNames.map((name, index) => ({
    x: name,
    y: Math.round(monthlyTotals[index] * 100) / 100,
  }));

  return { received };
}

export async function getWeeksProfitData() {
  const now = new Date();
  // Get start of current week (Monday)
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  const purchases = await prisma.purchase.findMany({
    where: {
      createdAt: {
        gte: startOfWeek,
        lt: endOfWeek,
      },
    },
    include: {
      details: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dayDates: string[] = [];

  // Build date strings for each day of the week
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    dayDates.push(d.toISOString().split("T")[0]); // YYYY-MM-DD
  }

  // Aggregate totals by day and payment type
  const cashByDay = new Array(7).fill(0);
  const cardByDay = new Array(7).fill(0);
  const transferByDay = new Array(7).fill(0);

  // Group purchases by day for modal data
  const purchasesByDay: Record<string, typeof purchases> = {};
  for (const dayDate of dayDates) {
    purchasesByDay[dayDate] = [];
  }

  for (const purchase of purchases) {
    const purchaseDate = purchase.createdAt.toISOString().split("T")[0];
    const dayIndex = dayDates.indexOf(purchaseDate);
    if (dayIndex === -1) continue;

    if (purchase.paymentType === "cash") {
      cashByDay[dayIndex] += purchase.total;
    } else if (purchase.paymentType === "card") {
      cardByDay[dayIndex] += purchase.total;
    } else if (purchase.paymentType === "transfer") {
      transferByDay[dayIndex] += purchase.total;
    }

    if (purchasesByDay[purchaseDate]) {
      purchasesByDay[purchaseDate].push(purchase);
    }
  }

  const round = (n: number) => Math.round(n * 100) / 100;

  return {
    cash: dayNames.map((name, i) => ({ x: name, y: round(cashByDay[i]) })),
    card: dayNames.map((name, i) => ({ x: name, y: round(cardByDay[i]) })),
    transfer: dayNames.map((name, i) => ({ x: name, y: round(transferByDay[i]) })),
    dayDates,
    dayNames,
    purchasesByDay: Object.fromEntries(
      Object.entries(purchasesByDay).map(([date, pList]) => [
        date,
        pList.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
          details: p.details.map((d) => ({
            ...d,
            createdAt: d.createdAt.toISOString(),
          })),
        })),
      ])
    ),
    weekStart: startOfWeek.toISOString(),
    weekEnd: endOfWeek.toISOString(),
  };
}

export async function getCampaignVisitorsData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    total_visitors: 784_000,
    performance: -1.5,
    chart: [
      { x: "S", y: 168 },
      { x: "S", y: 385 },
      { x: "M", y: 201 },
      { x: "T", y: 298 },
      { x: "W", y: 187 },
      { x: "T", y: 195 },
      { x: "F", y: 291 },
    ],
  };
}

export async function getVisitorsAnalyticsData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    168, 385, 201, 298, 187, 195, 291, 110, 215, 390, 280, 112, 123, 212, 270,
    190, 310, 115, 90, 380, 112, 223, 292, 170, 290, 110, 115, 290, 380, 312,
  ].map((value, index) => ({ x: index + 1 + "", y: value }));
}

export async function getCostsPerInteractionData() {
  return {
    avg_cost: 560.93,
    growth: 2.5,
    chart: [
      {
        name: "Google Ads",
        data: [
          { x: "Sep", y: 15 },
          { x: "Oct", y: 12 },
          { x: "Nov", y: 61 },
          { x: "Dec", y: 118 },
          { x: "Jan", y: 78 },
          { x: "Feb", y: 125 },
          { x: "Mar", y: 165 },
          { x: "Apr", y: 61 },
          { x: "May", y: 183 },
          { x: "Jun", y: 238 },
          { x: "Jul", y: 237 },
          { x: "Aug", y: 235 },
        ],
      },
      {
        name: "Facebook Ads",
        data: [
          { x: "Sep", y: 75 },
          { x: "Oct", y: 77 },
          { x: "Nov", y: 151 },
          { x: "Dec", y: 72 },
          { x: "Jan", y: 7 },
          { x: "Feb", y: 58 },
          { x: "Mar", y: 60 },
          { x: "Apr", y: 185 },
          { x: "May", y: 239 },
          { x: "Jun", y: 135 },
          { x: "Jul", y: 119 },
          { x: "Aug", y: 124 },
        ],
      },
    ],
  };
}