import ProductList from "@/components/product";
import CartSummary from "@/components/cartSummary";
import { SearchIcon } from "@/assets/icons";
import { UserInfo } from "@/components/header/user-info";

export default function Sell() {
    return (
        <div className="flex min-h-screen bg-gray-50">
            <main className="flex flex-1 p-6 gap-6">
                {/* Left side with User + Search + ProductList */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Top bar with User and Search */}
                    <div className="flex justify-between gap-8">
                        {/* Search bar on the right */}
                        <div className="relative w-full">
                            <input
                                type="search"
                                placeholder="Search"
                                className="flex w-full items-center gap-3.5 rounded-full border bg-gray-2 py-3 pl-[53px] pr-5 outline-none transition-colors focus-visible:border-primary dark:border-dark-3 dark:bg-dark-2 dark:hover:border-dark-4 dark:hover:bg-dark-3 dark:hover:text-dark-6 dark:focus-visible:border-primary"
                            />
                            <SearchIcon className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 size-5 text-gray-500" />
                        </div>
                        {/* User Info on the left */}
                        <UserInfo />
                    </div>

                    {/* Product List below */}
                    <ProductList/>
                </div>

                {/* Right side Cart */}
                <div className="w-96">
                    <CartSummary/>
                </div>
            </main>
        </div>
    );
}
