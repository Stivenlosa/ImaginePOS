"use client";

import {Logo} from "@/components/logo";
import {cn} from "@/lib/utils";
import Link from "next/link";
import {usePathname} from "next/navigation";
import {useEffect, useState} from "react";
import {NAV_DATA} from "./data";
import {ArrowLeftIcon, ChevronUp, HamburgerMenu} from "./icons";
import {MenuItem} from "./menu-item";
import {useSidebarContext} from "./sidebar-context";
import {useTranslation} from "@/i18n";

export function Sidebar() {
    const pathname = usePathname();
    const {setIsOpen, isOpen, isMobile, toggleSidebar} = useSidebarContext();
    const [expandedItems, setExpandedItems] = useState<string[]>([]);
    const {t} = useTranslation();

    const toggleExpanded = (titleKey: string) => {
        setExpandedItems((prev) => (prev.includes(titleKey) ? [] : [titleKey]));

        // Uncomment the following line to enable multiple expanded items
        // setExpandedItems((prev) =>
        //   prev.includes(titleKey) ? prev.filter((t) => t !== titleKey) : [...prev, titleKey],
        // );
    };

    useEffect(() => {
        // Keep collapsible open, when it's subpage is active
        NAV_DATA.some((section) => {
            return section.items.some((item) => {
                return item.items.some((subItem) => {
                    if (subItem.url === pathname) {
                        if (!expandedItems.includes(item.titleKey)) {
                            toggleExpanded(item.titleKey);
                        }

                        // Break the loop
                        return true;
                    }
                });
            });
        });
    }, [pathname]);

    return (
        <>
            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}


                        {/* Toggle Button (always visible) */}

                <button
                    onClick={toggleSidebar}
                    className={cn(
                        "fixed top-4 left-4 z-50 rounded-full bg-white p-2 shadow-lg border border-gray-300" +
                        " dark:bg-gray-800 dark:border-gray-700 flex items-center justify-center transition-opacity duration-800",
                        isOpen ? "opacity-0" : "opacity-100",
                    )}
                >
                    <span className="sr-only">
                       {t("navigation.openMenu")}
                    </span>
                    <HamburgerMenu className="size-5"/>
                </button>

            <aside
                className={cn(
                    "max-w-[290px] overflow-hidden border-r border-gray-200 bg-white transition-[width] duration-200 ease-linear dark:border-gray-800 dark:bg-gray-dark",
                    isMobile ? "fixed bottom-0 top-0 z-50" : "sticky top-0 h-screen",
                    isOpen ? "w-full" : "w-0",
                )}
                aria-label="Main navigation"
                aria-hidden={!isOpen}
                inert={!isOpen}
            >
                <div className="flex h-full flex-col py-10 pl-[25px] pr-[7px]">
                    <div className="relative pr-4.5">
                        <Link
                            href={"/"}
                            onClick={() => isMobile && toggleSidebar()}
                            className="px-0 py-2.5 min-[850px]:py-0"
                        >
                            <Logo/>
                        </Link>


                        {(
                            <button
                                onClick={toggleSidebar}
                                className="absolute left-3/4 right-4.5 top-1/2 -translate-y-1/2 text-right"
                            >
                                <span className="sr-only">{t("navigation.closeMenu")}</span>

                                <ArrowLeftIcon className="ml-auto size-7"/>
                            </button>
                        )}

                    </div>

                    {/* Navigation */}
                    <div className="custom-scrollbar mt-6 flex-1 overflow-y-auto pr-3 min-[850px]:mt-10">
                        {NAV_DATA.map((section) => (
                            <div key={section.labelKey} className="mb-6">
                                <h2 className="mb-5 text-sm font-medium text-dark-4 dark:text-dark-6">
                                    {t(section.labelKey)}
                                </h2>

                                <nav role="navigation" aria-label={t(section.labelKey)}>
                                    <ul className="space-y-2">
                                        {section.items.map((item) => (
                                            <li key={item.titleKey}>
                                                {item.items.length ? (
                                                    <div>
                                                        <MenuItem
                                                            isActive={item.items.some(
                                                                ({url}) => url === pathname,
                                                            )}
                                                            onClick={() => toggleExpanded(item.titleKey)}
                                                        >
                                                            <item.icon
                                                                className="size-6 shrink-0"
                                                                aria-hidden="true"
                                                            />

                                                            <span>{t(item.titleKey)}</span>

                                                            <ChevronUp
                                                                className={cn(
                                                                    "ml-auto rotate-180 transition-transform duration-200",
                                                                    expandedItems.includes(item.titleKey) &&
                                                                    "rotate-0",
                                                                )}
                                                                aria-hidden="true"
                                                            />
                                                        </MenuItem>

                                                        {expandedItems.includes(item.titleKey) && (
                                                            <ul
                                                                className="ml-9 mr-0 space-y-1.5 pb-[15px] pr-0 pt-2"
                                                                role="menu"
                                                            >
                                                                {item.items.map((subItem) => (
                                                                    <li key={subItem.titleKey} role="none">
                                                                        <MenuItem
                                                                            as="link"
                                                                            href={subItem.url}
                                                                            isActive={pathname === subItem.url}
                                                                        >
                                                                            <span>{t(subItem.titleKey)}</span>
                                                                        </MenuItem>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ) : (
                                                    (() => {
                                                        const href =
                                                            "url" in item
                                                                ? item.url + ""
                                                                : "/" +
                                                                t(item.titleKey).toLowerCase().split(" ").join("-");

                                                        return (
                                                            <MenuItem
                                                                className="flex items-center gap-3 py-3"
                                                                as="link"
                                                                href={href}
                                                                isActive={pathname === href}
                                                            >
                                                                <item.icon
                                                                    className="size-6 shrink-0"
                                                                    aria-hidden="true"
                                                                />

                                                                <span>{t(item.titleKey)}</span>
                                                            </MenuItem>
                                                        );
                                                    })()
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                            </div>
                        ))}
                    </div>
                </div>
            </aside>
        </>
    );
}
