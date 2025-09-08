"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type Product = {
    id: number;
    name: string;
    price: number;
};

type CartItem = Product & { qty: number };

type CartContextType = {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (id: number) => void;
    clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>([]);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, qty: item.qty + 1 } : item
                );
            }
            return [...prev, { ...product, qty: 1 }];
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

    const clearCart = () => setCart([]);

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
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