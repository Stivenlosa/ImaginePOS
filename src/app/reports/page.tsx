import { WeeksProfit } from "@/components/charts/weeks-profit"
import { PaymentsOverview } from "@/components/charts/payments-overview/index"
import { InvoiceTable } from "@/components/tables/invoice-table";
import { Metadata } from "next"
import { getPaymentsOverviewData, getWeeksProfitData } from "@/services/charts.services";
import { getInvoiceTableData } from "@/components/tables/fetch";

export const metadata: Metadata = {
  title: "Basic Chart",
}

export default async function Page() {
  // Fetch all data sequentially to avoid overwhelming the DB connection pool
  const paymentsData = await getPaymentsOverviewData();
  const weeksProfitData = await getWeeksProfitData();
  const invoiceData = await getInvoiceTableData();

  return (
    <>
      <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
        
        <PaymentsOverview
          className="col-span-12 xl:col-span-7"
          data={paymentsData}
        />

        <WeeksProfit
          className="col-span-12 xl:col-span-5"
          data={weeksProfitData}
        />

        <InvoiceTable
          className="col-span-12"
          purchases={invoiceData}
        />
      </div>
    </>
  )
}
