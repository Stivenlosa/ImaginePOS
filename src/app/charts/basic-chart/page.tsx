import { WeeksProfit } from "@/components/charts/weeks-profit"
import { PaymentsOverview } from "@/components/charts/payments-overview/index"
import { createTimeFrameExtractor } from "@/utils/timeframe-extractor"
import { InvoiceTable } from "@/components/tables/invoice-table";
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Basic Chart",
}

type PropsType = {
  searchParams: Promise<{
    selected_time_frame?: string
  }>
}

export default async function Page(props: PropsType) {
  const { selected_time_frame } = await props.searchParams
  const extractTimeFrame = createTimeFrameExtractor(selected_time_frame)

  return (
    <>
      <div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
        
        <PaymentsOverview
          className="col-span-12 xl:col-span-7"
          key={extractTimeFrame("payments_overview")}
          timeFrame={extractTimeFrame("payments_overview")?.split(":")[1]}
        />

        <WeeksProfit
          key={extractTimeFrame("weeks_profit")}
          timeFrame={extractTimeFrame("weeks_profit")?.split(":")[1]}
          className="col-span-12 xl:col-span-5"
        />

        <InvoiceTable className="col-span-12" />
      </div>
    </>
  )
}
