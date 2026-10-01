"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useCart } from "@/components/cartSummary/cart-context";
import type { Product } from "@/types/product";
import { formatMoney } from "@/lib/money";
import { getSaleUnitSuffix, isWeightBasedUnit } from "@/types/product";
import { productsApi, type ApiProduct } from "@/lib/api-client";
import { useTranslation } from "@/i18n";
import {
    PRODUCT_USAGE_EVENT,
    sortProductsByUsage,
} from "@/lib/product-usage";
import { normalizeSearchText } from "@/lib/utils";

// Convert API product to local Product type
function mapApiProductToProduct(apiProduct: ApiProduct): Product {
    return {
        id: apiProduct.id,
        code: apiProduct.code,
        name: apiProduct.name,
        price: apiProduct.price,
        image: apiProduct.image,
        saleUnit: apiProduct.saleUnit,
    };
}

// Inset so the ring isn't clipped by the scrolling / overflow-hidden list container.
const FOCUS_CARD =
    "group focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-green-800 focus-visible:bg-green-600 dark:focus-visible:bg-green-600";
function focusCheckoutButton() {
    const checkout = document.querySelector<HTMLButtonElement>("[data-checkout-button]");
    if (checkout && !checkout.disabled) {
        checkout.focus();
        return;
    }
    // Empty cart: Checkout is disabled, so land on the first usable cart control.
    document
        .querySelector<HTMLElement>("[data-cart-panel] button:not([disabled]), [data-cart-panel] input")
        ?.focus();
}

const FOCUS_TEXT = "group-focus-visible:text-white dark:group-focus-visible:text-white";

type ProductListProps = {
    products?: Product[];
    onProductClick?: (product: Product) => void;
    fetchFromApi?: boolean;
    filterName?: string;
    /** Sales-only: compact rows with content arranged horizontally */
    layout?: "grid" | "horizontal";
    /** Sales-only: rank by local add-to-cart frequency (no DB) */
    sortByUsage?: boolean;
    /** Highlight the currently selected product (e.g. barcode manager) */
    selectedId?: number | null;
};

export default function ProductList({
    products = [],
    onProductClick,
    fetchFromApi = true,
    filterName = "",
    layout = "grid",
    sortByUsage = false,
    selectedId = null,
}: ProductListProps) {
    const { addToCart } = useCart();
    const { t } = useTranslation();
    const [apiProducts, setApiProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(fetchFromApi);
    const [error, setError] = useState<string | null>(null);
    const [usageTick, setUsageTick] = useState(0);
    const cardRefs = useRef<Array<HTMLButtonElement | null>>([]);

    useEffect(() => {
        if (!fetchFromApi || products.length > 0) {
            setLoading(false);
            return;
        }

        async function fetchProducts() {
            setLoading(true);
            setError(null);

            const response = await productsApi.getAll();

            if (response.error) {
                setError(response.error);
                setLoading(false);
                return;
            }

            if (response.data) {
                setApiProducts(response.data.map(mapApiProductToProduct));
            }
            setLoading(false);
        }

        fetchProducts();
    }, [fetchFromApi, products.length]);

    useEffect(() => {
        if (!sortByUsage) return;
        const onUsage = () => setUsageTick((n) => n + 1);
        window.addEventListener(PRODUCT_USAGE_EVENT, onUsage);
        return () => window.removeEventListener(PRODUCT_USAGE_EVENT, onUsage);
    }, [sortByUsage]);

    const allProducts = products.length > 0 ? products : apiProducts;

    const normalizedFilter = normalizeSearchText(filterName);
    let displayProducts = normalizedFilter
        ? allProducts.filter((product) => {
              const nameMatch = normalizeSearchText(product.name).includes(
                  normalizedFilter,
              );
              const codeMatch = normalizeSearchText(product.code).includes(
                  normalizedFilter,
              );
              return nameMatch || codeMatch;
          })
        : allProducts;

    if (sortByUsage) {
        // usageTick keeps sort in sync after local usage updates
        void usageTick;
        displayProducts = sortProductsByUsage(displayProducts);
    }

    const handleSelect = (product: Product, fromKeyboard: boolean) => {
        if (onProductClick) {
            onProductClick(product);
            return;
        }
        addToCart(product);
        // Weight products hand focus to the scale panel (see CartSummary).
        if (fromKeyboard && !isWeightBasedUnit(product.saleUnit)) {
            requestAnimationFrame(() => focusCheckoutButton());
        }
    };

    const focusCard = (index: number) => {
        const next = Math.max(0, Math.min(index, displayProducts.length - 1));
        const el = cardRefs.current[next];
        el?.focus();
        el?.scrollIntoView({ block: "nearest", inline: "nearest" });
    };

    const handleCardKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            focusCard(index + 1);
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            focusCard(index - 1);
            return;
        }
        if (e.key === "ArrowRight") {
            e.preventDefault();
            if (onProductClick) {
                document
                    .querySelector<HTMLElement>(
                        "[data-barcode-panel] button:not([disabled]), [data-barcode-panel] select, [data-barcode-panel] input",
                    )
                    ?.focus();
            } else {
                focusCheckoutButton();
            }
            return;
        }
        if (e.key === "ArrowLeft") {
            e.preventDefault();
            document
                .querySelector<HTMLInputElement>(
                    "[data-product-search], [data-sales-search]",
                )
                ?.focus();
            return;
        }
        if (e.key === "Home") {
            e.preventDefault();
            focusCard(0);
            return;
        }
        if (e.key === "End") {
            e.preventDefault();
            focusCard(displayProducts.length - 1);
        }
        // Enter / Space activate natively on <button>
    };

    const isHorizontal = layout === "horizontal";
    const listClass = isHorizontal
        ? "overflow-hidden rounded-xl border border-stroke bg-white [&>li:last-child>button]:border-b-0 dark:border-dark-3 dark:bg-gray-dark"
        : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6";
    const cardClass = isHorizontal
        ? `flex w-full items-center gap-4 border-b border-stroke px-4 py-3 text-left transition-colors hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2 ${FOCUS_CARD}`
        : `p-6 bg-white dark:bg-gray-dark rounded-2xl shadow hover:shadow-md cursor-pointer transition flex flex-col items-center ${FOCUS_CARD}`;
    const selectedCardClass = isHorizontal
        ? "bg-primary/10 border-l-4 border-l-primary dark:bg-primary/20"
        : "ring-2 ring-primary";
    const imageClass = isHorizontal
        ? "h-11 w-11 shrink-0 rounded-lg object-cover"
        : "w-16 h-16 object-cover rounded-xl mb-4";
    const avatarClass = isHorizontal
        ? "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-lg font-bold text-green-600 dark:bg-dark-3 group-focus-visible:bg-white/20 group-focus-visible:text-white"
        : "w-16 h-16 bg-purple-100 dark:bg-dark-3 rounded-xl flex items-center justify-center mb-4 text-green-600 font-bold text-xl";

    if (loading) {
        return (
            <div className={listClass}>
                {[...Array(isHorizontal ? 6 : 8)].map((_, i) => (
                    <div
                        key={i}
                        className={
                            isHorizontal
                                ? "flex w-full animate-pulse items-center gap-4 border-b border-stroke px-4 py-3 last:border-b-0 dark:border-dark-3"
                                : "p-6 bg-white dark:bg-gray-dark rounded-2xl shadow animate-pulse flex flex-col items-center"
                        }
                    >
                        <div
                            className={
                                isHorizontal
                                    ? "h-11 w-11 shrink-0 rounded-lg bg-gray-200 dark:bg-dark-3"
                                    : "w-16 h-16 bg-gray-200 dark:bg-dark-3 rounded-xl mb-4"
                            }
                        />
                        <div className={isHorizontal ? "flex-1" : ""}>
                            <div className="mb-2 h-3 w-24 rounded bg-gray-200 dark:bg-dark-3" />
                            <div className="h-2.5 w-16 rounded bg-gray-200 dark:bg-dark-3" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                <p>
                    {t("common.error")}: {error}
                </p>
            </div>
        );
    }

    if (displayProducts.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 dark:text-dark-5">
                <p>{t("products.noProducts")}</p>
            </div>
        );
    }

    return (
        <ul className={listClass}>
            {displayProducts.map((product, index) => (
                <li key={product.id}>
                    <button
                        type="button"
                        data-product-item
                        ref={(el) => {
                            cardRefs.current[index] = el;
                        }}
                        // detail === 0 means the click came from Enter/Space, not the mouse
                        onClick={(e) => handleSelect(product, e.detail === 0)}
                        onKeyDown={(e) => handleCardKeyDown(e, index)}
                        className={`${cardClass} ${isHorizontal ? "" : "h-full w-full"} ${
                            selectedId === product.id ? selectedCardClass : ""
                        }`}
                        aria-pressed={selectedId === product.id}
                        aria-label={`${product.name}, ${product.code}, ${formatMoney(Number(product.price))}${getSaleUnitSuffix(product.saleUnit)}`}
                    >
                        {product.image ? (
                            <img
                                src={product.image}
                                alt=""
                                className={imageClass}
                            />
                        ) : (
                            <div className={avatarClass}>{product.name[0]}</div>
                        )}
                        <span className={isHorizontal ? "min-w-0 flex-1" : ""}>
                            <span
                                className={`block font-medium text-gray-700 dark:text-dark-6 ${FOCUS_TEXT} ${
                                    isHorizontal ? "truncate text-sm" : "line-clamp-2 text-center"
                                }`}
                            >
                                {product.name}
                            </span>
                            <span
                                className={`block text-xs text-gray-400 dark:text-dark-5 ${FOCUS_TEXT} ${
                                    isHorizontal ? "" : "text-center"
                                }`}
                            >
                                {product.code}
                            </span>
                            <span
                                className={`block text-gray-500 dark:text-dark-5 ${FOCUS_TEXT} ${
                                    isHorizontal ? "text-sm" : "text-center text-sm"
                                }`}
                            >
                                {formatMoney(Number(product.price))}
                                {getSaleUnitSuffix(product.saleUnit)}
                            </span>
                        </span>
                        {isHorizontal && !onProductClick && (
                            <span aria-hidden className={`text-lg text-green-600 ${FOCUS_TEXT}`}>
                                ＋
                            </span>
                        )}
                    </button>
                </li>
            ))}
        </ul>
    );
}
