import { WeeksProfit } from "@/components/charts/weeks-profit"
import { PaymentsOverview } from "@/components/charts/payments-overview/index"
import { BankTransferTable } from "@/components/tables/bank-transfer-table";
import { DayCloseHistory } from "@/components/tables/day-close-history";
import { InvoiceTable } from "@/components/tables/invoice-table";
import { Metadata } from "next"
import { listBankTransfers } from "@/lib/bank-transfer-store";
import { getActiveUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import { getPaymentsOverviewData, getWeeksProfitData, listPaymentYears } from "@/services/charts.services";
import { getInvoiceTableData } from "@/components/tables/fetch";

export const metadata: Metadata = {
  title: "Basic Chart",
}

export default async function Page() {
  // Fetch all data sequentially to avoid overwhelming the DB connection pool
  const paymentsData = await getPaymentsOverviewData();
  const paymentYears = await listPaymentYears();
  const weeksProfitData = await getWeeksProfitData();
  const invoiceData = await getInvoiceTableData();
  const user = await getActiveUser();
  const bankTransfers = user?.role === "administrador" ? await listBankTransfers() : [];

  return (
    <>
      <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
        
        <PaymentsOverview
          className="col-span-12 xl:col-span-7"
          data={paymentsData}
          years={paymentYears}
        />

        <WeeksProfit
          className="col-span-12 xl:col-span-5"
          data={weeksProfitData}
        />

        <InvoiceTable
          className={cn("col-span-12", user?.role === "administrador" && "xl:col-span-7")}
          purchases={invoiceData}
        />

        {user?.role === "administrador" && (
          <BankTransferTable className="col-span-12 xl:col-span-5" transfers={bankTransfers} />
        )}

        <DayCloseHistory className="col-span-12" />
      </div>
    </>
  )
}
