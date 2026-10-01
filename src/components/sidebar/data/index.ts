import * as Icons from "../icons";

// Navigation data using translation keys
// Labels and titles use i18n keys that will be translated in the sidebar component
export const NAV_DATA = [
  {
    labelKey: "navigation.mainMenu",
    items: [
      {
        titleKey: "navigation.sales",
        icon: Icons.CurrentCartIcon,
        items: [] as { titleKey: string; url: string }[],
        url: "/",
      },
      {
        titleKey: "navigation.products",
        icon: Icons.FourCircle,
        items: [
          { titleKey: "navigation.manageProducts", url: "/products" },
          { titleKey: "navigation.manageBarcodes", url: "/products/barcodes" },
        ],
        url: "/products",
      },
      {
        titleKey: "navigation.reports",
        icon: Icons.PieChart,
        items: [] as { titleKey: string; url: string }[],
        url: "/reports",
      },
      {
        titleKey: "navigation.registers",
        icon: Icons.Table,
        items: [] as { titleKey: string; url: string }[],
        url: "/registers",
        roles: ["administrador"],
      },
      {
        titleKey: "navigation.settings",
        icon: Icons.User,
        items: [] as { titleKey: string; url: string }[],
        url: "/settings",
        roles: ["administrador"],
      },
    ],
  },
];
