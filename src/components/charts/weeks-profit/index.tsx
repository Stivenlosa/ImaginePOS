import { WeeksProfitClient, type WeeksProfitData } from "./weeks-profit-client";

type PropsType = {
  className?: string;
  data: WeeksProfitData;
};

export function WeeksProfit({ className, data }: PropsType) {
  return <WeeksProfitClient data={data} className={className} />;
}
