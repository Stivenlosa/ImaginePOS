"use client";
import ProductList from "@/components/product";
import { SearchIcon } from "@/assets/icons";
import { UserInfo } from "@/components/header/user-info";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Product, SaleUnit } from "@/types/product";
import { SALE_UNITS } from "@/types/product";
import { useTranslation } from "@/i18n";
import { productsApi, type ApiProduct } from "@/lib/api-client";
import { parseProductsCsv } from "@/lib/parse-products-csv";

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

function ProductModal({ 
    open, 
    onClose, 
    product, 
    onSave,
    saving,
    t 
}: { 
    open: boolean; 
    onClose: () => void; 
    product: Product | null; 
    onSave: (product: Product) => Promise<void>;
    saving: boolean;
    t: (key: string) => string;
}) {
    const [name, setName] = useState(product?.name || "");
    const [code, setCode] = useState(product?.code || "");
    const [price, setPrice] = useState(product?.price?.toString() || "");
    const [image, setImage] = useState<string | null>(product?.image || null);
    const [saleUnit, setSaleUnit] = useState<SaleUnit>(product?.saleUnit || "unit");
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(product?.name || "");
        setCode(product?.code || "");
        setPrice(product?.price?.toString() || "");
        setImage(product?.image || null);
        setSaleUnit(product?.saleUnit || "unit");
    }, [product]);

    if (!open) return null;
    
    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white dark:bg-gray-dark rounded-lg p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-dark-6">✕</button>
                <h2 className="text-lg font-bold mb-4 text-gray-700 dark:text-dark-6">{t("products.editProduct")}</h2>
                <form onSubmit={async e => { 
                    e.preventDefault(); 
                    if (product) {
                        await onSave({ ...product, name, code: code.trim(), price: parseFloat(price), image, saleUnit }); 
                    }
                }} className="flex flex-col gap-3">
                    <input 
                        type="text" 
                        placeholder={t("products.productName")} 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="rounded border px-3 py-2 dark:bg-dark-2 dark:border-dark-3 dark:text-dark-6" 
                        disabled={saving}
                    />
                    <input
                        type="text"
                        placeholder={t("products.code")}
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        className="rounded border px-3 py-2 dark:bg-dark-2 dark:border-dark-3 dark:text-dark-6"
                        disabled={saving}
                    />
                    <input 
                        type="number" 
                        min={0}
                        step="1"
                        placeholder={t("products.price")} 
                        value={price} 
                        onChange={e => setPrice(e.target.value)} 
                        className="rounded border px-3 py-2 dark:bg-dark-2 dark:border-dark-3 dark:text-dark-6" 
                        disabled={saving}
                    />
                    <div className="flex flex-col gap-1">
                        <label className="text-sm text-gray-600 dark:text-dark-5">{t("products.saleUnit")}</label>
                        <select 
                            value={saleUnit} 
                            onChange={e => setSaleUnit(e.target.value as SaleUnit)}
                            className="rounded border px-3 py-2 dark:bg-dark-2 dark:border-dark-3 dark:text-dark-6"
                            disabled={saving}
                        >
                            {Object.entries(SALE_UNITS).map(([key]) => (
                                <option key={key} value={key}>{t(`saleUnits.${key}`)}</option>
                            ))}
                        </select>
                    </div>
                    <input 
                        type="file" 
                        accept="image/*" 
                        ref={fileInputRef} 
                        onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onload = ev => setImage(ev.target?.result as string);
                                reader.readAsDataURL(file);
                            }
                        }} 
                        className="dark:text-dark-6" 
                        disabled={saving}
                    />
                    {image && <img src={image} alt={t("common.preview")} className="w-24 h-24 object-cover rounded" />}
                    <button 
                        type="submit" 
                        className="bg-primary text-white rounded px-4 py-2 hover:bg-primary/90 transition disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? t("common.saving") : t("common.save")}
                    </button>
                </form>
            </div>
        </div>
    );
}

function AddProductModule({ 
    onAdd,
    adding, 
    t 
}: { 
    onAdd: (product: Omit<Product, "id">) => Promise<void>;
    adding: boolean;
    t: (key: string) => string;
}) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [price, setPrice] = useState("");
    const [image, setImage] = useState<string | null>(null);
    const [saleUnit, setSaleUnit] = useState<SaleUnit>("unit");
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) return;
        await onAdd({ name, code: code.trim(), price: parseFloat(price), image, saleUnit });
        setName("");
        setCode("");
        setPrice("");
        setImage(null);
        setSaleUnit("unit");
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    
    return (
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 mb-4 items-center bg-white dark:bg-gray-dark p-4 rounded-lg shadow">
            <input
                type="text"
                placeholder={t("products.productName")}
                value={name}
                onChange={e => setName(e.target.value)}
                className="rounded border px-3 py-2 dark:bg-dark-2 dark:border-dark-3 dark:text-dark-6"
                disabled={adding}
            />
            <input
                type="text"
                placeholder={t("products.codeOptional")}
                value={code}
                onChange={e => setCode(e.target.value)}
                className="rounded border px-3 py-2 w-36 dark:bg-dark-2 dark:border-dark-3 dark:text-dark-6"
                disabled={adding}
            />
            <input
                type="number"
                min={0}
                step="1"
                placeholder={t("products.price")}
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="rounded border px-3 py-2 w-32 dark:bg-dark-2 dark:border-dark-3 dark:text-dark-6"
                disabled={adding}
            />
            <select 
                value={saleUnit} 
                onChange={e => setSaleUnit(e.target.value as SaleUnit)}
                className="rounded border px-3 py-2 dark:bg-dark-2 dark:border-dark-3 dark:text-dark-6"
                disabled={adding}
            >
                {Object.entries(SALE_UNITS).map(([key]) => (
                    <option key={key} value={key}>{t(`saleUnits.${key}`)}</option>
                ))}
            </select>
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => setImage(ev.target?.result as string);
                        reader.readAsDataURL(file);
                    }
                }}
                className="dark:text-dark-6"
                disabled={adding}
            />
            {image && <img src={image} alt={t("common.preview")} className="w-12 h-12 object-cover rounded" />}
            <button 
                type="submit" 
                className="bg-primary text-white rounded px-4 py-2 hover:bg-primary/90 transition disabled:opacity-50"
                disabled={adding}
            >
                {adding ? t("common.adding") : t("common.add")}
            </button>
        </form>
    );
}

function ImportCsvButton({
    onImported,
    importing,
    setImporting,
    onError,
    onMessage,
    t,
}: {
    onImported: (products: Product[]) => void;
    importing: boolean;
    setImporting: (value: boolean) => void;
    onError: (message: string | null) => void;
    onMessage: (message: string | null) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = async (file: File | undefined) => {
        if (!file) return;

        setImporting(true);
        onError(null);
        onMessage(null);

        try {
            const text = await file.text();
            const { products, errors } = parseProductsCsv(text);

            if (products.length === 0) {
                onError(errors[0] || t("products.importEmpty"));
                return;
            }

            const response = await productsApi.importMany(
                products.map(({ name, price, saleUnit, code }) => ({
                    name,
                    price,
                    saleUnit,
                    code: code || null,
                    image: null,
                })),
            );

            if (response.error) {
                onError(response.error);
                return;
            }

            if (response.data?.created?.length) {
                onImported(response.data.created.map(mapApiProductToProduct));
            }

            const createdCount = response.data?.createdCount ?? 0;
            const importErrors = [
                ...errors,
                ...(response.data?.errors ?? []),
            ];

            if (importErrors.length > 0) {
                onMessage(
                    t("products.importPartial", { count: createdCount }),
                );
                onError(importErrors.slice(0, 5).join(" · "));
            } else {
                onMessage(t("products.importSuccess", { count: createdCount }));
            }
        } catch (error) {
            onError(
                error instanceof Error
                    ? error.message
                    : t("products.importEmpty"),
            );
        } finally {
            setImporting(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
            />
            <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="rounded border border-primary px-4 py-2 text-primary hover:bg-primary/10 transition disabled:opacity-50"
            >
                {importing ? t("products.importing") : t("products.importCsv")}
            </button>
            <span className="text-sm text-gray-500 dark:text-dark-5">
                {t("products.importHint")}
            </span>
        </div>
    );
}

export default function ProductsManager() {
    const [products, setProducts] = useState<Product[]>([]);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    const [importing, setImporting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [filterName, setFilterName] = useState("");
    const { t } = useTranslation();

    // Fetch products from API on mount
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        const response = await productsApi.getAll();
        
        if (response.error) {
            setError(response.error);
            setLoading(false);
            return;
        }

        if (response.data) {
            setProducts(response.data.map(mapApiProductToProduct));
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);
    
    const handleAddProduct = async (product: Omit<Product, "id">) => {
        setAdding(true);
        setError(null);

        const response = await productsApi.create({
            name: product.name,
            price: product.price,
            image: product.image,
            saleUnit: product.saleUnit,
            code: product.code || null,
        });

        if (response.error) {
            setError(response.error);
            setAdding(false);
            return;
        }

        if (response.data) {
            setProducts(prev => [mapApiProductToProduct(response.data!), ...prev]);
        }
        setAdding(false);
    };
    
    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setModalOpen(true);
    };
    
    const handleSaveProduct = async (updated: Product) => {
        setSaving(true);
        setError(null);

        const response = await productsApi.update(updated.id, {
            name: updated.name,
            price: updated.price,
            image: updated.image,
            saleUnit: updated.saleUnit,
            code: updated.code,
        });

        if (response.error) {
            setError(response.error);
            setSaving(false);
            return;
        }

        if (response.data) {
            setProducts(prev => prev.map(p => p.id === updated.id ? mapApiProductToProduct(response.data!) : p));
        }
        setSaving(false);
        setModalOpen(false);
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-dark-2">
            <main className="flex flex-1 p-6 gap-6">
                {/* Left side with User + Search + AddProduct + ProductList */}
                <div className="flex-1 flex flex-col gap-4">
                    {/* Top bar with User and Search */}
                    <div className="flex justify-between gap-8">
                        {/* Search bar on the right */}
                        <div className="relative w-full">
                            <input
                                type="text"
                                placeholder={t("common.search")}
                                value={filterName}
                                onChange={(e) => setFilterName(e.target.value)}
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
                    
                    {/* Error / success messages */}
                    {error && (
                        <div className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 p-3 rounded-lg">
                            {successMessage}
                        </div>
                    )}
                    
                    {/* Add Product Module */}
                    <AddProductModule onAdd={handleAddProduct} adding={adding} t={t} />
                    <ImportCsvButton
                        importing={importing}
                        setImporting={setImporting}
                        onError={setError}
                        onMessage={setSuccessMessage}
                        onImported={(imported) =>
                            setProducts((prev) => [...imported, ...prev])
                        }
                        t={t}
                    />
                    
                    {/* Product List - pass products directly so it doesn't fetch again */}
                    {loading ? (
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
                    ) : (
                        <ProductList 
                            products={products} 
                            onProductClick={handleEditProduct} 
                            fetchFromApi={false}
                            filterName={filterName}
                        />
                    )}
                </div>
            </main>
            <ProductModal 
                open={modalOpen} 
                onClose={() => setModalOpen(false)} 
                product={editingProduct} 
                onSave={handleSaveProduct}
                saving={saving}
                t={t} 
            />
        </div>
    );
}
