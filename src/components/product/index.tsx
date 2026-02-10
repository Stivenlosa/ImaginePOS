"use client";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cartSummary/cart-context";
import type { Product } from "@/types/product";
import { getSaleUnitSuffix } from "@/types/product";
import { productsApi, type ApiProduct } from "@/lib/api-client";
import { useTranslation } from "@/i18n";

// Convert API product to local Product type
function mapApiProductToProduct(apiProduct: ApiProduct): Product {
    return {
        id: apiProduct.id,
        name: apiProduct.name,
        price: apiProduct.price,
        image: apiProduct.image,
        saleUnit: apiProduct.saleUnit,
    };
}

type ProductListProps = {
    products?: Product[];
    onProductClick?: (product: Product) => void;
    fetchFromApi?: boolean;
    filterName?: string;
};

export default function ProductList({ products = [], onProductClick, fetchFromApi = true, filterName = "" }: ProductListProps) {
    const { addToCart } = useCart();
    const { t } = useTranslation();
    const [apiProducts, setApiProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(fetchFromApi);
    const [error, setError] = useState<string | null>(null);

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

    const allProducts = products.length > 0 ? products : apiProducts;
    
    // Filter products by name (case-insensitive)
    const displayProducts = filterName
        ? allProducts.filter(product => 
            product.name.toLowerCase().includes(filterName.toLowerCase())
        )
        : allProducts;

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="p-6 bg-white dark:bg-gray-dark rounded-2xl shadow animate-pulse flex flex-col items-center"
                    >
                        <div className="w-16 h-16 bg-gray-200 dark:bg-dark-3 rounded-xl mb-4" />
                        <div className="w-20 h-4 bg-gray-200 dark:bg-dark-3 rounded mb-2" />
                        <div className="w-12 h-3 bg-gray-200 dark:bg-dark-3 rounded" />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                <p>{t("common.error")}: {error}</p>
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
                <div
                    key={product.id}
                    onClick={() => onProductClick ? onProductClick(product) : addToCart(product)}
                    className="p-6 bg-white dark:bg-gray-dark rounded-2xl shadow hover:shadow-md cursor-pointer transition flex flex-col items-center"
                >
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-xl mb-4" />
                    ) : (
                        <div className="w-16 h-16 bg-purple-100 dark:bg-dark-3 rounded-xl flex items-center justify-center mb-4 text-green-600 font-bold text-xl">
                            {product.name[0]}
                        </div>
                    )}
                    <p className="font-medium text-gray-700 dark:text-dark-6 text-center">{product.name}</p>
                    <p className="text-sm text-gray-500 dark:text-dark-5">
                        ${Number(product.price).toFixed(2)}{getSaleUnitSuffix(product.saleUnit)}
                    </p>
                </div>
            ))}
        </div>
    );
}
