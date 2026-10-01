import "@/css/satoshi.css";
import "@/css/style.css";

import { AppFrame } from "@/components/app-frame";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type {Metadata, Viewport} from "next";
import NextTopLoader from "nextjs-toploader";
import type {PropsWithChildren} from "react";
import {Providers} from "./providers";


export const metadata: Metadata = {
    title: {
        template: "%s | ImaginePOS",
        default: "ImaginePOS",
    },
    description: "Point of sale for Imagine — sales, inventory, and store operations.",
    applicationName: "ImaginePOS",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "ImaginePOS",
    },
    formatDetection: {
        telephone: false,
    },
    icons: {
        icon: [
            { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
            { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
        apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    other: {
        "mobile-web-app-capable": "yes",
    },
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#5750F1" },
        { media: "(prefers-color-scheme: dark)", color: "#5750F1" },
    ],
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export default function RootLayout({children}: PropsWithChildren) {
    return (
        <html lang="en" suppressHydrationWarning>
        <body suppressHydrationWarning>
        <Providers>
            <NextTopLoader color="#5750F1" showSpinner={false}/>
            <AppFrame>{children}</AppFrame>
        </Providers>
        </body>
        </html>
    );
}
