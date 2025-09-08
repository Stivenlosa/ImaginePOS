"use client";
const productsDefault = [
    { id: 1, name: "Coffee", price: 2.5 },
    { id: 2, name: "Sandwich", price: 5.0 },
    { id: 3, name: "Juice  nlfsdjlfdngj", price: 3.0 },
    { id: 4, name: "Cake", price: 4.0 },
    { id: 5, name: "Coffee", price: 2.5 },
    { id: 6, name: "Sandwich", price: 5.0 },
    { id: 7, name: "Juice  nlfsdjlfdngj", price: 3.0 },
    { id: 8, name: "Cake", price: 4.0 },
];
import { useCart } from "@/components/cartSummary/cart-context";
export default function ProductList({ products = [], onProductClick }: { products?: any[], onProductClick?: (product: any) => void }) {
    const { addToCart } = useCart();
    products = productsDefault
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
                <div
                    key={product.id}
                    onClick={() => onProductClick ? onProductClick(product) : addToCart(product)}
                    className="p-6 bg-white rounded-2xl shadow hover:shadow-md cursor-pointer transition flex flex-col items-center"
                >
                    {product.image ? (
                        <img src={product.image} alt={product.name} className="w-16 h-16 object-cover rounded-xl mb-4" />
                    ) : (
                        <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4 text-green-600 font-bold text-xl">
                            {product.name[0]}
                        </div>
                    )}
                    <p className="font-medium text-gray-700">{product.name}</p>
                    <p className="text-sm text-gray-500">${Number(product.price).toFixed(2)}</p>
                </div>
            ))}
        </div>
    );
}
