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
        items: [],
        url: "/",
      },
      {
        titleKey: "navigation.products",
        icon: Icons.FourCircle,
        items: [],
        url: "/products",
      },
      {
        titleKey: "navigation.reports",
        icon: Icons.PieChart,
        items: [],
        url: "/reports",
      },
      {
        titleKey: "navigation.pages",
        icon: Icons.Alphabet,
        items: [
          {
            titleKey: "navigation.settings",
            url: "/pages/settings",
          },
        ],
      },
    ],
  },
  {
    labelKey: "navigation.others",
    items: [
      {
        titleKey: "navigation.authentication",
        icon: Icons.Authentication,
        items: [
          {
            titleKey: "navigation.signIn",
            url: "/auth/sign-in",
          },
        ],
      },
    ],
  },
];
