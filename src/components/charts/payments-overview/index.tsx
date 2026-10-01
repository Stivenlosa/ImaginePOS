"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { PaymentsOverviewChart } from "./chart";

type Point = { x: string; y: number };

type PropsType = {
  className?: string;
  years: number[];
  data: {
    received: Point[];
    year: number;
  };
};

export function PaymentsOverview({ className, data, years }: PropsType) {
  const { t } = useTranslation();
  const [year, setYear] = useState(data.year);
  const [received, setReceived] = useState(data.received);
  const [loading, setLoading] = useState(false);
  const canChangeYear = years.length > 1;

  async function changeYear(nextYear: number) {
    if (!years.includes(nextYear) || nextYear === year) return;
    setLoading(true);
    const response = await fetch(`/api/reports/payments-overview?year=${nextYear}`);
    const payload = (await response.json().catch(() => null)) as { received?: Point[] } | null;
    setLoading(false);
    if (!response.ok || !payload?.received) return;
    setYear(nextYear);
    setReceived(payload.received);
  }

  return (
    <div
      className={cn(
        "grid gap-2 rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          {t("paymentsOverview.title")}
        </h2>

        {canChangeYear ? (
          <label className="inline-flex items-center text-sm font-medium text-gray-500 dark:text-dark-6">
            <span className="sr-only">{t("paymentsOverview.year")}</span>
            <select
              value={year}
              onChange={(event) => void changeYear(Number(event.target.value))}
              disabled={loading}
              className="cursor-pointer appearance-none bg-transparent text-sm font-medium text-gray-500 outline-none disabled:cursor-wait dark:text-dark-6"
            >
              {years.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M2.5 4.5 6 8l3.5-3.5" />
            </svg>
          </label>
        ) : (
          <span className="text-sm font-medium text-gray-500 dark:text-dark-6">{year}</span>
        )}
      </div>

      <div className={cn(loading && "opacity-60")}>
        <PaymentsOverviewChart key={year} data={{ received }} seriesName={t("paymentsOverview.series")} />
      </div>

      <dl className="text-center">
        <div className="flex flex-col-reverse gap-1">
          <dt className="text-xl font-bold text-dark dark:text-white">
            {formatMoney(received.reduce((acc, { y }) => acc + y, 0))}
          </dt>
          <dd className="font-medium dark:text-dark-6">{t("paymentsOverview.received")}</dd>
        </div>
      </dl>
    </div>
  );
}
