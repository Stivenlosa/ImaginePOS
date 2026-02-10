"use client";

import { useState } from "react";
import ProductList from "@/components/product";
import CartSummary from "@/components/cartSummary";
import { SearchIcon } from "@/assets/icons";
import { UserInfo } from "@/components/header/user-info";
import { useTranslation } from "@/i18n";

export default function Sell() {
    const { t } = useTranslation();
    const [filterName, setFilterName] = useState("");

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterName(e.target.value);
    };
    
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <main className="flex flex-1 p-6 gap-6 h-full overflow-hidden">
                {/* Left side with User + Search + ProductList */}
                <div className="flex-1 flex flex-col gap-4 min-h-0 overflow-hidden">
                    {/* Top bar with User and Search */}
                    <div className="flex justify-between gap-8 shrink-0">
                        {/* Search bar on the right */}
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder={t("common.search")}
                                value={filterName}
                                onChange={handleSearchChange}
                                className={`flex w-full items-center gap-3.5 rounded-full border py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary ${filterName ? 'bg-primary/10 border-primary' : 'bg-gray-2'}`}
                            />
                            <SearchIcon className={`pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 size-5 ${filterName ? 'text-primary' : 'text-gray-500'}`} />
                            {filterName && (
                                <button
                                    onClick={() => setFilterName("")}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-dark-6"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {/* User Info on the left */}
                        <UserInfo />
                    </div>

                    {/* Product List below */}
                    <div className="flex-1 overflow-y-auto min-h-0">
                        <ProductList filterName={filterName} />
                    </div>
                </div>

                {/* Right side Cart */}
                <div className="w-96 h-full">
                    <CartSummary/>
                </div>
            </main>
        </div>
    );
}
