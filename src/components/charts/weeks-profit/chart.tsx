"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

type PropsType = {
  data: {
    cash: { x: string; y: number }[];
    card: { x: string; y: number }[];
    transfer: { x: string; y: number }[];
  };
  onDayClick?: (dayIndex: number) => void;
  seriesLabels: { cash: string; card: string; transfer: string };
};

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export function WeeksProfitChart({ data, onDayClick, seriesLabels }: PropsType) {
  const options: ApexOptions = {
    colors: ["#219653", "#3C50E0", "#F59E0B"],
    chart: {
      type: "bar",
      stacked: true,
      toolbar: {
        show: false,
      },
      zoom: {
        enabled: false,
      },
      events: {
        dataPointSelection: (_event, _chartContext, config) => {
          if (onDayClick && config.dataPointIndex !== undefined) {
            onDayClick(config.dataPointIndex);
          }
        },
      },
    },

    responsive: [
      {
        breakpoint: 1536,
        options: {
          plotOptions: {
            bar: {
              borderRadius: 3,
              columnWidth: "25%",
            },
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        horizontal: false,
        borderRadius: 3,
        columnWidth: "25%",
        borderRadiusApplication: "end",
        borderRadiusWhenStacked: "last",
      },
    },
    dataLabels: {
      enabled: false,
    },

    grid: {
      strokeDashArray: 5,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },

    xaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => `$${val.toFixed(0)}`,
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "left",
      fontFamily: "inherit",
      fontWeight: 500,
      fontSize: "14px",
      markers: {
        size: 9,
        shape: "circle",
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `$${val.toFixed(2)}`,
      },
    },
    fill: {
      opacity: 1,
    },
  };

  return (
    <div className="-ml-3.5 mt-3">
      <Chart
        options={options}
        series={[
          {
            name: seriesLabels.cash,
            data: data.cash,
          },
          {
            name: seriesLabels.card,
            data: data.card,
          },
          {
            name: seriesLabels.transfer,
            data: data.transfer,
          },
        ]}
        type="bar"
        height={370}
      />
    </div>
  );
}
