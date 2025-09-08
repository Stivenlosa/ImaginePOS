"use client";
import ProductList from "@/components/product";
import { SearchIcon } from "@/assets/icons";
import { UserInfo } from "@/components/header/user-info";
import { useState, useEffect, useRef } from "react";

function ProductModal({ open, onClose, product, onSave }: { open: boolean, onClose: () => void, product: any, onSave: (product: any) => void }) {
    const [name, setName] = useState(product?.name || "");
    const [price, setPrice] = useState(product?.price || "");
    const [image, setImage] = useState(product?.image || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(product?.name || "");
        setPrice(product?.price || "");
        setImage(product?.image || null);
    }, [product]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700">✕</button>
                <h2 className="text-lg font-bold mb-4">Edit Product</h2>
                <form onSubmit={e => { e.preventDefault(); onSave({ ...product, name, price, image }); onClose(); }} className="flex flex-col gap-3">
                    <input type="text" placeholder="Product Name" value={name} onChange={e => setName(e.target.value)} className="rounded border px-3 py-2" />
                    <input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} className="rounded border px-3 py-2" />
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = ev => setImage(ev.target?.result);
                            reader.readAsDataURL(file);
                        }
                    }} />
                    {image && <img src={image} alt="Preview" className="w-24 h-24 object-cover rounded" />}
                    <button type="submit" className="bg-primary text-white rounded px-4 py-2">Save</button>
                </form>
            </div>
        </div>
    );
}

function AddProductModule({ onAdd }: { onAdd: (product: any) => void }) {
    const [name, setName] = useState("");
    const [price, setPrice] = useState("");
    const [image, setImage] = useState<any>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) return;
        onAdd({ name, price, image });
        setName("");
        setPrice("");
        setImage(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };
    return (
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4 items-center">
            <input
                type="text"
                placeholder="Product Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="rounded border px-3 py-2"
            />
            <input
                type="number"
                placeholder="Price"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="rounded border px-3 py-2"
            />
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = ev => setImage(ev.target?.result);
                        reader.readAsDataURL(file);
                    }
                }}
            />
            {image && <img src={image} alt="Preview" className="w-12 h-12 object-cover rounded" />}
            <button type="submit" className="bg-primary text-white rounded px-4 py-2">Add</button>
        </form>
    );
}

export default function ProductsManager() {
    const [products, setProducts] = useState<any[]>([]);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const handleAddProduct = (product: any) => {
        setProducts(prev => [...prev, { ...product, id: Date.now() }]);
    };
    const handleEditProduct = (product: any) => {
        setEditingProduct(product);
        setModalOpen(true);
    };
    const handleSaveProduct = (updated: any) => {
        setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
    };
    return (
        <div className="flex min-h-screen bg-gray-50">
            <main className="flex flex-1 p-6 gap-6">
                {/* Left side with User + Search + AddProduct + ProductList */}
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
                    {/* Add Product Module */}
                    <AddProductModule onAdd={handleAddProduct} />
                    {/* Product List below (custom or existing) */}
                    <ProductList products={products} onProductClick={handleEditProduct} />
                </div>
            </main>
            <ProductModal open={modalOpen} onClose={() => setModalOpen(false)} product={editingProduct} onSave={handleSaveProduct} />
        </div>
    );
}
