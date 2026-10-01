import { formatMoney } from "@/lib/money";
import { listClosedBusinessDays } from "@/lib/register-store";

type Props = {
  className?: string;
};

export async function DayCloseHistory({ className }: Props) {
  const days = await listClosedBusinessDays(15);

  return (
    <div className={className}>
      <div className="rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card">
        <h3 className="mb-5 text-xl font-bold text-dark dark:text-white">Day close history</h3>
        {days.length === 0 ? (
          <p className="text-sm text-gray-500">No closed business days yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-stroke dark:border-dark-3">
                  <th className="px-3 py-2 text-left">Date</th>
                  <th className="px-3 py-2 text-right">Sales</th>
                  <th className="px-3 py-2 text-right">Cash</th>
                  <th className="px-3 py-2 text-right">Card</th>
                  <th className="px-3 py-2 text-right">Transfer</th>
                  <th className="px-3 py-2 text-right">Expected cash</th>
                  <th className="px-3 py-2 text-right">Counted cash</th>
                  <th className="px-3 py-2 text-right">Variance</th>
                </tr>
              </thead>
              <tbody>
                {days.map((day: (typeof days)[number]) => (
                  <tr key={day.id} className="border-b border-stroke dark:border-dark-3">
                    <td className="px-3 py-2">{day.businessDate}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(day.totalSales ?? 0)}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(day.totalCash ?? 0)}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(day.totalCard ?? 0)}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(day.totalTransfer ?? 0)}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(day.totalExpectedCash ?? 0)}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(day.totalCountedCash ?? 0)}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(day.totalCashVariance ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
