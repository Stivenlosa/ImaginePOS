"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import type { Product, CartItem } from "@/types/product";
import { isWeightBasedUnit, calculateItemTotal } from "@/types/product";

export type SavedCart = {
    id: string;
    savedAt: number;
    items: CartItem[];
    total: number;
};

type CartContextType = {
    cart: CartItem[];
    addToCart: (product: Product, weight?: number) => void;
    removeFromCart: (id: number) => void;
    updateItemWeight: (id: number, weight: number) => void;
    clearCart: () => void;
    pendingWeightProduct: Product | null;
    setPendingWeightProduct: (product: Product | null) => void;
    savedCarts: SavedCart[];
    saveCart: () => void;
    restoreCart: (id: string) => void;
    deleteSavedCart: (id: string) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

function createSavedCart(items: CartItem[]): SavedCart {
    return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        savedAt: Date.now(),
        items: items.map((item) => ({ ...item })),
        total: items.reduce((sum, item) => sum + calculateItemTotal(item), 0),
    };
}

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [savedCarts, setSavedCarts] = useState<SavedCart[]>([]);
    const [pendingWeightProduct, setPendingWeightProduct] = useState<Product | null>(null);

    const addToCart = (product: Product, weight?: number) => {
        // For weight-based products, set as pending if no weight provided
        if (isWeightBasedUnit(product.saleUnit) && weight === undefined) {
            setPendingWeightProduct(product);
            return;
        }

        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                if (isWeightBasedUnit(product.saleUnit) && weight !== undefined) {
                    // For weight-based items, add the weight
                    return prev.map((item) =>
                        item.id === product.id 
                            ? { ...item, weight: (item.weight || 0) + weight, qty: item.qty + 1 } 
                            : item
                    );
                }
                return prev.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { ...product, qty: 1, weight }];
        });
    };

    const removeFromCart = (id: number) => {
        setCart((prev) =>
            prev
                .map((item) =>
                    item.id === id ? { ...item, qty: item.qty - 1 } : item
                )
                .filter((item) => item.qty > 0)
        );
    };

    const updateItemWeight = (id: number, weight: number) => {
        setCart((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, weight } : item
            )
        );
    };

    const clearCart = () => setCart([]);

    const saveCart = () => {
        if (cart.length === 0) return;
        setSavedCarts((prev) => [createSavedCart(cart), ...prev]);
        setCart([]);
        setPendingWeightProduct(null);
    };

    const restoreCart = (id: string) => {
        const saved = savedCarts.find((entry) => entry.id === id);
        if (!saved) return;

        setSavedCarts((prev) => {
            const withoutRestored = prev.filter((entry) => entry.id !== id);
            if (cart.length > 0) {
                return [createSavedCart(cart), ...withoutRestored];
            }
            return withoutRestored;
        });
        setCart(saved.items.map((item) => ({ ...item })));
        setPendingWeightProduct(null);
    };

    const deleteSavedCart = (id: string) => {
        setSavedCarts((prev) => prev.filter((entry) => entry.id !== id));
    };

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            removeFromCart, 
            updateItemWeight,
            clearCart,
            pendingWeightProduct,
            setPendingWeightProduct,
            savedCarts,
            saveCart,
            restoreCart,
            deleteSavedCart,
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}
