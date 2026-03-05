import { standardFormat } from "@/lib/format-number";
import { cn } from "@/lib/utils";
import { PaymentsOverviewChart } from "./chart";

type PropsType = {
  className?: string;
  data: {
    received: { x: string; y: number }[];
  };
};

export function PaymentsOverview({ className, data }: PropsType) {
  return (
    <div
      className={cn(
        "grid gap-2 rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          Payments Overview
        </h2>

        <span className="text-sm font-medium text-gray-500 dark:text-dark-6">
          {new Date().getFullYear()}
        </span>
      </div>

      <PaymentsOverviewChart data={data} />

      <dl className="text-center">
        <div className="flex flex-col-reverse gap-1">
          <dt className="text-xl font-bold text-dark dark:text-white">
            ${standardFormat(data.received.reduce((acc, { y }) => acc + y, 0))}
          </dt>
          <dd className="font-medium dark:text-dark-6">Received Amount</dd>
        </div>
      </dl>
    </div>
  );
}
