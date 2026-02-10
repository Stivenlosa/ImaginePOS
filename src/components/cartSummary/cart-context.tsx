"use client";
import { createContext, useContext, useState, ReactNode } from "react";
import type { Product, CartItem } from "@/types/product";
import { isWeightBasedUnit } from "@/types/product";

type CartContextType = {
    cart: CartItem[];
    addToCart: (product: Product, weight?: number) => void;
    removeFromCart: (id: number) => void;
    updateItemWeight: (id: number, weight: number) => void;
    clearCart: () => void;
    pendingWeightProduct: Product | null;
    setPendingWeightProduct: (product: Product | null) => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);
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

    return (
        <CartContext.Provider value={{ 
            cart, 
            addToCart, 
            removeFromCart, 
            updateItemWeight,
            clearCart,
            pendingWeightProduct,
            setPendingWeightProduct
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