import { roundMoney } from "@/lib/money";

export function compactFormat(value: number) {
  const formatter = new Intl.NumberFormat("es-CO", {
    notation: "compact",
    compactDisplay: "short",
  });

  return formatter.format(value);
}

export function standardFormat(value: number) {
  return roundMoney(value).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}