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
        titleKey: "navigation.tables",
        url: "/tables",
        icon: Icons.Table,
        items: [
          {
            titleKey: "navigation.tables",
            url: "/tables",
          },
        ],
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
        titleKey: "navigation.charts",
        icon: Icons.PieChart,
        items: [
          {
            titleKey: "navigation.basicChart",
            url: "/charts/basic-chart",
          },
        ],
      },
      {
        titleKey: "navigation.uiElements",
        icon: Icons.FourCircle,
        items: [
          {
            titleKey: "navigation.alerts",
            url: "/ui-elements/alerts",
          },
          {
            titleKey: "navigation.buttons",
            url: "/ui-elements/buttons",
          },
        ],
      },
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
