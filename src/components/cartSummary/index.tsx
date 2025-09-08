"use client";
import {useCart} from "./cart-context";
export default function CartSummary() {
    const { cart, removeFromCart, clearCart } = useCart();
    const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);


    return (
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col h-full">
            <h2 className="text-lg font-semibold mb-4 text-green-600">Cart</h2>
            <div className="flex-1 overflow-y-auto">
                {cart.map((item) => (
                    <div
                        key={item.id}
                        className="flex justify-between items-center mb-3 p-3 bg-purple-50 rounded-xl"
                    >
                        <div>
                            <p className="font-medium text-green-600">{item.name}</p>
                            <p className="text-sm text-gray-500">
                                {item.qty} × ${item.price.toFixed(2)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold text-green-600">
                                ${(item.qty * item.price).toFixed(2)}
                            </p>
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-400"
                            >
                                −
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t pt-4 mt-4">
                <div className="flex justify-between text-gray-700 font-medium">
                    <span>Total</span>
                    <span className="text-green-600 font-bold">${total.toFixed(2)}</span>
                </div>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={clearCart}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition"
                    >
                        Clear
                    </button>
                    <button className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition shadow-md">
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
}
