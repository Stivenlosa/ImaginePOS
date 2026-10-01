"use client";

import { useEffect, useRef, useState } from "react";
import ProductList from "@/components/product";
import CartSummary from "@/components/cartSummary";
import PaymentAnnouncer from "@/components/PaymentAnnouncer/PaymentAnnouncer";
import { TransferInboxListener } from "@/components/PaymentAnnouncer/transfer-inbox-listener";
import { SearchIcon } from "@/assets/icons";
import { UserInfo } from "@/components/header/user-info";
import { RegisterTerminalBar } from "@/components/register/register-terminal-bar";
import { useTranslation } from "@/i18n";

function isEditableTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export default function Sell() {
    const { t } = useTranslation();
    const [filterName, setFilterName] = useState("");
    const searchInputRef = useRef<HTMLInputElement>(null);
    const productAreaRef = useRef<HTMLDivElement>(null);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterName(e.target.value);
    };

    const focusFirstProduct = () => {
        const first = productAreaRef.current?.querySelector<HTMLButtonElement>(
            "button[data-product-item]",
        );
        first?.focus();
    };

    const focusSearch = () => {
        setFilterName("");
        searchInputRef.current?.focus();
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.defaultPrevented) return;

            // Escape returns to a cleared search, unless a modal is handling it.
            if (e.key === "Escape" && !document.querySelector("[aria-modal='true']")) {
                e.preventDefault();
                focusSearch();
                return;
            }

            // From search, ArrowDown moves into the product list
            if (
                e.key === "ArrowDown" &&
                document.activeElement === searchInputRef.current
            ) {
                e.preventDefault();
                focusFirstProduct();
                return;
            }

            // Letters or digits → focus search (name or barcode scanners)
            if (e.key.length !== 1 || !/[\p{L}\p{N}]/u.test(e.key)) return;
            if (isEditableTarget(e.target)) return;

            e.preventDefault();
            const input = searchInputRef.current;
            if (!input) return;

            input.focus();
            setFilterName((prev) => prev + e.key);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <main className="flex flex-1 p-6 gap-6 h-full overflow-hidden">
                <PaymentAnnouncer />
                {/* Left side with User + Search + ProductList */}
                <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
                    <TransferInboxListener />
                    <RegisterTerminalBar />
                    {/* Top bar with User and Search */}
                    <div className="flex justify-between gap-8 shrink-0">
                        {/* Search bar on the right */}
                        <div className="relative w-full">
                            <input
                                ref={searchInputRef}
                                data-sales-search
                                type="text"
                                placeholder={t("common.search")}
                                value={filterName}
                                onChange={handleSearchChange}
                                onFocus={() => setFilterName("")}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowDown") {
                                        e.preventDefault();
                                        focusFirstProduct();
                                        return;
                                    }
                                    // Barcode scanners end with Enter — add the single match
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        const items =
                                            productAreaRef.current?.querySelectorAll<HTMLButtonElement>(
                                                "button[data-product-item]",
                                            );
                                        if (items?.length === 1) {
                                            items[0].click();
                                            setFilterName("");
                                            searchInputRef.current?.focus();
                                            return;
                                        }
                                        if (items && items.length > 1) {
                                            focusFirstProduct();
                                        }
                                    }
                                }}
                                className={`flex w-full items-center gap-3.5 rounded-full border py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-green-500/40 dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary ${filterName ? "bg-primary/10 border-primary" : "bg-gray-2"}`}
                            />
                            <SearchIcon
                                className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 size-5 ${filterName ? "text-primary" : "text-gray-500"}`}
                            />
                            {filterName && (
                                <button
                                    type="button"
                                    onClick={() => setFilterName("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-dark-6 outline-none focus-visible:ring-2 focus-visible:ring-green-500 rounded"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {/* User Info on the left */}
                        <UserInfo />
                    </div>

                    {/* Product List below */}
                    <div ref={productAreaRef} className="flex-1 overflow-y-auto min-h-0">
                        <ProductList
                            filterName={filterName}
                            layout="horizontal"
                            sortByUsage
                        />
                    </div>
                </div>

                {/* Right side Cart */}
                <div className="w-96 h-full">
                    <CartSummary />
                </div>
            </main>
        </div>
    );
}
