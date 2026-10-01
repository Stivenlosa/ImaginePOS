"use client";

import { useEffect, useRef, useState } from "react";
import ProductList from "@/components/product";
import { BarcodePanel } from "@/components/barcodes/barcode-panel";
import { SearchIcon } from "@/assets/icons";
import { UserInfo } from "@/components/header/user-info";
import { useTranslation } from "@/i18n";
import type { Product } from "@/types/product";

function isEditableTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export default function BarcodesPage() {
    const { t } = useTranslation();
    const [filterName, setFilterName] = useState("");
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
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

            if (e.key === "Escape" && !document.querySelector("[aria-modal='true']")) {
                e.preventDefault();
                focusSearch();
                return;
            }

            if (
                e.key === "ArrowDown" &&
                document.activeElement === searchInputRef.current
            ) {
                e.preventDefault();
                focusFirstProduct();
                return;
            }

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
        <div className="flex h-screen bg-gray-50 overflow-hidden dark:bg-gray-dark">
            <main className="flex flex-1 gap-6 overflow-hidden p-6 h-full">
                <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
                    <div className="flex shrink-0 items-start justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-semibold text-gray-800 dark:text-dark-6">
                                {t("barcodes.title")}
                            </h1>
                            <p className="mt-1 text-sm text-gray-500 dark:text-dark-5">
                                {t("barcodes.subtitle")}
                            </p>
                        </div>
                        <UserInfo />
                    </div>

                    <div className="relative w-full shrink-0">
                        <input
                            ref={searchInputRef}
                            data-product-search
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
                            className={`pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 ${filterName ? "text-primary" : "text-gray-500"}`}
                        />
                        {filterName && (
                            <button
                                type="button"
                                onClick={() => setFilterName("")}
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded text-gray-500 outline-none hover:text-gray-700 focus-visible:ring-2 focus-visible:ring-green-500 dark:hover:text-dark-6"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    <div ref={productAreaRef} className="min-h-0 flex-1 overflow-y-auto">
                        <ProductList
                            filterName={filterName}
                            layout="horizontal"
                            selectedId={selectedProduct?.id ?? null}
                            onProductClick={setSelectedProduct}
                        />
                    </div>
                </div>

                <div className="w-full max-w-md shrink-0 h-full min-h-0">
                    <BarcodePanel product={selectedProduct} />
                </div>
            </main>
        </div>
    );
}
