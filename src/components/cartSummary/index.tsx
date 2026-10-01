"use client";
import { useState, useRef, useEffect } from "react";
import { useCart, type SavedCart } from "./cart-context";
import { getSaleUnitSuffix, isWeightBasedUnit, calculateItemTotal, CartItem } from "@/types/product";
import { useTranslation } from "@/i18n";

type PaymentType = "cash" | "card" | "transfer";

function formatSavedAgo(savedAt: number): string {
    const seconds = Math.max(0, Math.floor((Date.now() - savedAt) / 1000));
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
}

// Simulated scale API - in production this would connect to a real scale
function useScaleWeight() {
    const [weight, setWeight] = useState<number>(0);
    const [isConnected, setIsConnected] = useState<boolean>(true);
    
    // Simulate scale reading - replace with actual API call
    const simulateScaleReading = () => {
        // Simulates a random weight between 0.1 and 2.5
        const simulatedWeight = Math.round((Math.random() * 2.4 + 0.1) * 100) / 100;
        setWeight(simulatedWeight);
    };

    return { weight, setWeight, isConnected, simulateScaleReading };
}

function ScaleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
            <circle cx="12" cy="12" r="4" />
            <path d="M12 8v4l2 2" />
        </svg>
    );
}

function PrinterIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9V2h12v7" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

function CashIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="3" />
            <path d="M6 12h.01M18 12h.01" />
        </svg>
    );
}

function CardIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="5" width="20" height="14" rx="2" />
            <path d="M2 10h20" />
            <path d="M6 15h4" />
        </svg>
    );
}

function TransferIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 1l4 4-4 4" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <path d="M7 23l-4-4 4-4" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
    );
}

function BookmarkIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
    );
}

function FolderIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
    );
}

// Saved carts modal (session-only)
interface SavedCartsModalProps {
    isOpen: boolean;
    onClose: () => void;
    savedCarts: SavedCart[];
    onRestore: (id: string) => void;
    onDelete: (id: string) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

function SavedCartsModal({ isOpen, onClose, savedCarts, onRestore, onDelete, t }: SavedCartsModalProps) {
    const [, setTick] = useState(0);

    useEffect(() => {
        if (!isOpen) return;
        const interval = setInterval(() => setTick((n) => n + 1), 30_000);
        return () => clearInterval(interval);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="bg-green-600 text-white p-6 text-center">
                    <h2 className="text-xl font-bold">{t("cart.savedCartsTitle")}</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {savedCarts.length === 0 ? (
                        <p className="text-center text-gray-400 dark:text-dark-5 py-8">
                            {t("cart.noSavedCarts")}
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {savedCarts.map((saved) => (
                                <div
                                    key={saved.id}
                                    className="p-4 bg-purple-50 dark:bg-dark-3 rounded-xl"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-medium text-gray-800 dark:text-white">
                                                {t("cart.savedAgo", { time: formatSavedAgo(saved.savedAt) })}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-dark-5">
                                                {t("cart.itemsCount", { count: saved.items.length })}
                                            </p>
                                        </div>
                                        <p className="font-bold text-green-600 text-lg">
                                            ${saved.total.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => {
                                                onRestore(saved.id);
                                                onClose();
                                            }}
                                            className="flex-1 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-500 transition"
                                        >
                                            {t("cart.useCart")}
                                        </button>
                                        <button
                                            onClick={() => onDelete(saved.id)}
                                            className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-400 transition"
                                        >
                                            {t("common.delete")}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t dark:border-dark-4 bg-gray-50 dark:bg-dark-2">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-gray-200 dark:bg-dark-3 text-gray-700 dark:text-dark-6 rounded-xl hover:bg-gray-300 dark:hover:bg-dark-4 transition"
                    >
                        {t("common.close")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Payment Type Selection Modal
interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (paymentType: PaymentType) => void;
    total: number;
    isProcessing: boolean;
    t: (key: string, params?: Record<string, string | number>) => string;
}

function PaymentModal({ isOpen, onClose, onConfirm, total, isProcessing, t }: PaymentModalProps) {
    const [selectedPayment, setSelectedPayment] = useState<PaymentType>("cash");

    if (!isOpen) return null;

    const paymentOptions: { type: PaymentType; icon: React.ReactNode; labelKey: string }[] = [
        { type: "cash", icon: <CashIcon className="w-8 h-8" />, labelKey: "paymentTypes.cash" },
        { type: "card", icon: <CardIcon className="w-8 h-8" />, labelKey: "paymentTypes.card" },
        { type: "transfer", icon: <TransferIcon className="w-8 h-8" />, labelKey: "paymentTypes.transfer" },
    ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
                {/* Header */}
                <div className="bg-green-600 text-white p-6 text-center">
                    <h2 className="text-xl font-bold">{t("checkout.selectPaymentType")}</h2>
                    <p className="text-3xl font-bold mt-2">${total.toFixed(2)}</p>
                </div>

                {/* Payment Options */}
                <div className="p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        {paymentOptions.map((option) => (
                            <button
                                key={option.type}
                                onClick={() => setSelectedPayment(option.type)}
                                disabled={isProcessing}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                                    selectedPayment === option.type
                                        ? "border-green-600 bg-green-50 dark:bg-green-900/20 text-green-600"
                                        : "border-gray-200 dark:border-dark-4 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-dark-3"
                                } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                {option.icon}
                                <span className="mt-2 text-sm font-medium">{t(option.labelKey)}</span>
                            </button>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isProcessing}
                            className="flex-1 py-3 bg-gray-200 dark:bg-dark-3 text-gray-700 dark:text-dark-6 rounded-xl hover:bg-gray-300 dark:hover:bg-dark-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            onClick={() => onConfirm(selectedPayment)}
                            disabled={isProcessing}
                            className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    {t("checkout.processing")}
                                </>
                            ) : (
                                t("checkout.confirmPayment")
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Receipt Modal Component
interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNewSale: () => void;
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    orderNumber: string;
    paymentType: PaymentType;
    t: (key: string, params?: Record<string, string | number>) => string;
}

function ReceiptModal({ isOpen, onClose, onNewSale, items, subtotal, tax, total, orderNumber, paymentType, t }: ReceiptModalProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        const printContent = receiptRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const styles = `
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Courier New', monospace; 
                    padding: 20px;
                    max-width: 300px;
                    margin: 0 auto;
                }
                .receipt-header { text-align: center; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-bottom: 15px; }
                .receipt-header h1 { font-size: 24px; margin-bottom: 5px; }
                .receipt-header p { font-size: 12px; color: #666; }
                .order-info { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #000; }
                .order-info p { font-size: 12px; margin: 3px 0; }
                .items-section { margin-bottom: 15px; }
                .items-header { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
                .item { display: flex; justify-content: space-between; margin: 8px 0; font-size: 12px; }
                .item-details { flex: 1; }
                .item-name { font-weight: bold; }
                .item-qty { color: #666; font-size: 11px; }
                .item-price { text-align: right; min-width: 60px; }
                .totals { border-top: 2px dashed #000; padding-top: 15px; }
                .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
                .total-row.final { font-size: 18px; font-weight: bold; margin-top: 10px; border-top: 1px solid #000; padding-top: 10px; }
                .thank-you { text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #000; font-size: 14px; }
                @media print { body { padding: 0; } }
            </style>
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${orderNumber}</title>
                ${styles}
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();
        printWindow.focus();
        
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    if (!isOpen) return null;

    const currentDate = new Date().toLocaleString();

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Success Header */}
                <div className="bg-green-600 text-white p-6 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckIcon className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-bold">{t("checkout.orderComplete")}</h2>
                </div>

                {/* Receipt Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div ref={receiptRef} className="receipt-content">
                        {/* Store Header */}
                        <div className="receipt-header text-center border-b-2 border-dashed border-gray-300 dark:border-dark-4 pb-4 mb-4">
                            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">ImaginePOS</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t("checkout.receipt")}</p>
                        </div>

                        {/* Order Info */}
                        <div className="order-info border-b border-dashed border-gray-300 dark:border-dark-4 pb-3 mb-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">{t("checkout.orderNumber", { number: orderNumber })}</span>
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">{t("checkout.date")}:</span> {currentDate}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">{t("checkout.paymentMethod")}:</span> {t(`paymentTypes.${paymentType}`)}
                            </p>
                        </div>

                        {/* Items */}
                        <div className="items-section mb-4">
                            <h3 className="font-semibold text-gray-800 dark:text-white mb-3">{t("checkout.items")}</h3>
                            {items.map((item) => (
                                <div key={item.id} className="item flex justify-between py-2 border-b border-gray-100 dark:border-dark-4">
                                    <div className="item-details flex-1">
                                        <p className="item-name font-medium text-gray-800 dark:text-white">{item.name}</p>
                                        <p className="item-qty text-xs text-gray-500 dark:text-gray-400">
                                            {isWeightBasedUnit(item.saleUnit) && item.weight !== undefined
                                                ? `${item.weight.toFixed(2)} ${item.saleUnit} × $${item.price.toFixed(2)}${getSaleUnitSuffix(item.saleUnit)}`
                                                : `${item.qty} × $${item.price.toFixed(2)}${getSaleUnitSuffix(item.saleUnit)}`
                                            }
                                        </p>
                                    </div>
                                    <p className="item-price font-semibold text-gray-800 dark:text-white">
                                        ${calculateItemTotal(item).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="totals border-t-2 border-dashed border-gray-300 dark:border-dark-4 pt-4">
                            <div className="total-row flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <span>{t("checkout.subtotal")}</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="total-row flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                                <span>{t("checkout.tax")} (0%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="total-row final flex justify-between text-lg font-bold text-gray-800 dark:text-white border-t border-gray-300 dark:border-dark-4 pt-3 mt-2">
                                <span>{t("checkout.total")}</span>
                                <span className="text-green-600">${total.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Thank You */}
                        <div className="thank-you text-center mt-6 pt-4 border-t-2 border-dashed border-gray-300 dark:border-dark-4">
                            <p className="text-gray-600 dark:text-gray-400">{t("checkout.thankYou")}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-6 border-t dark:border-dark-4 bg-gray-50 dark:bg-dark-2 flex gap-3">
                    <button
                        onClick={handlePrint}
                        className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition flex items-center justify-center gap-2"
                    >
                        <PrinterIcon className="w-5 h-5" />
                        {t("checkout.print")}
                    </button>
                    <button
                        onClick={onNewSale}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl hover:bg-green-500 transition"
                    >
                        {t("checkout.newSale")}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Generate a random order number
function generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${timestamp}-${random}`;
}

export default function CartSummary() {
    const { 
        cart, 
        removeFromCart, 
        clearCart, 
        pendingWeightProduct, 
        setPendingWeightProduct,
        addToCart,
        savedCarts,
        saveCart,
        restoreCart,
        deleteSavedCart,
    } = useCart();
    
    const { weight, setWeight, isConnected, simulateScaleReading } = useScaleWeight();
    const [manualWeight, setManualWeight] = useState<string>("");
    const { t } = useTranslation();
    
    // Checkout state
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showSavedCarts, setShowSavedCarts] = useState(false);
    const [showReceipt, setShowReceipt] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [completedOrder, setCompletedOrder] = useState<{
        items: CartItem[];
        subtotal: number;
        tax: number;
        total: number;
        orderNumber: string;
        paymentType: PaymentType;
    } | null>(null);

    // Use manual input or scale weight
    const currentWeight = manualWeight ? parseFloat(manualWeight) : weight;

    const subtotal = cart.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    const taxRate = 0; // 0% tax - can be configured
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const handleConfirmWeight = () => {
        if (pendingWeightProduct && currentWeight > 0) {
            addToCart(pendingWeightProduct, currentWeight);
            setPendingWeightProduct(null);
            setManualWeight("");
            setWeight(0);
        }
    };

    const handleCancelWeight = () => {
        setPendingWeightProduct(null);
        setManualWeight("");
        setWeight(0);
    };

    const handleCheckout = () => {
        if (cart.length === 0) return;
        setShowPaymentModal(true);
    };

    const handleConfirmPayment = async (paymentType: PaymentType) => {
        if (cart.length === 0) return;
        
        setIsProcessing(true);
        const orderNumber = generateOrderNumber();

        try {
            // Prepare purchase data
            const purchaseData = {
                orderNumber,
                subtotal,
                tax,
                total,
                paymentType,
                details: cart.map((item) => ({
                    productId: item.id,
                    productName: item.name,
                    price: item.price,
                    quantity: item.qty,
                    weight: item.weight,
                    saleUnit: item.saleUnit,
                    lineTotal: calculateItemTotal(item),
                })),
            };

            // Save to database
            const response = await fetch("/api/purchases", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(purchaseData),
            });

            if (!response.ok) {
                throw new Error("Failed to save purchase");
            }

            // Create the completed order snapshot
            setCompletedOrder({
                items: [...cart],
                subtotal,
                tax,
                total,
                orderNumber,
                paymentType,
            });

            setShowPaymentModal(false);
            setShowReceipt(true);
        } catch (error) {
            console.error("Error saving purchase:", error);
            // Still show receipt even if save fails (offline mode)
            setCompletedOrder({
                items: [...cart],
                subtotal,
                tax,
                total,
                orderNumber,
                paymentType,
            });
            setShowPaymentModal(false);
            setShowReceipt(true);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCancelPayment = () => {
        setShowPaymentModal(false);
    };

    const handleNewSale = () => {
        clearCart();
        setShowReceipt(false);
        setCompletedOrder(null);
    };

    const handleCloseReceipt = () => {
        setShowReceipt(false);
        setCompletedOrder(null);
    };

    return (
        <div className="bg-white dark:bg-gray-dark rounded-2xl shadow-lg flex flex-col h-full overflow-hidden">
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 p-6 pb-0">
                <h2 className="text-lg font-semibold mb-4 text-green-600">{t("cart.title")}</h2>
                
                {/* Scale Weight Input Container */}
                <div className="mb-4 p-4 bg-gray-100 dark:bg-dark-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <ScaleIcon className="w-5 h-5 text-gray-600 dark:text-dark-5" />
                            <span className="text-sm font-medium text-gray-600 dark:text-dark-5">{t("cart.scaleWeight")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-xs text-gray-500 dark:text-dark-5">
                                {isConnected ? t("cart.connected") : t("cart.disconnected")}
                            </span>
                        </div>
                    </div>
                    
                    {/* Weight Display */}
                    <div className="text-center py-3">
                        <div className="text-3xl font-bold text-gray-800 dark:text-dark-6 font-mono">
                            {currentWeight.toFixed(2)}
                            <span className="text-lg ml-1 text-gray-500 dark:text-dark-5">
                                {pendingWeightProduct ? pendingWeightProduct.saleUnit : 'kg'}
                            </span>
                        </div>
                    </div>

                    {/* Manual Input */}
                    <div className="flex gap-2 mb-2">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={t("cart.manualWeight")}
                            value={manualWeight}
                            onChange={(e) => setManualWeight(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm rounded-lg border dark:bg-dark-2 dark:border-dark-4 dark:text-dark-6 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <button
                            onClick={simulateScaleReading}
                            className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition"
                            title={t("cart.read")}
                        >
                            {t("cart.read")}
                        </button>
                    </div>

                    {/* Pending Product Info */}
                    {pendingWeightProduct && (
                        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                                <span className="font-medium">{t("cart.weighing")}:</span> {pendingWeightProduct.name}
                            </p>
                            <p className="text-xs text-yellow-600 dark:text-yellow-300 mb-3">
                                ${pendingWeightProduct.price.toFixed(2)}{getSaleUnitSuffix(pendingWeightProduct.saleUnit)}
                                {currentWeight > 0 && (
                                    <span className="ml-2">
                                        = ${(pendingWeightProduct.price * currentWeight).toFixed(2)}
                                    </span>
                                )}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleConfirmWeight}
                                    disabled={currentWeight <= 0}
                                    className="flex-1 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {t("common.addToCart")}
                                </button>
                                <button
                                    onClick={handleCancelWeight}
                                    className="px-4 py-2 text-sm bg-gray-300 dark:bg-dark-4 text-gray-700 dark:text-dark-6 rounded-lg hover:bg-gray-400 dark:hover:bg-dark-5 transition"
                                >
                                    {t("common.cancel")}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cart Items */}
                <div className="pb-4">
                    {cart.length === 0 ? (
                        <p className="text-center text-gray-400 dark:text-dark-5 py-8">{t("cart.empty")}</p>
                    ) : (
                        cart.map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center mb-3 p-3 bg-purple-50 dark:bg-dark-3 rounded-xl"
                            >
                                <div>
                                    <p className="font-medium text-green-600">{item.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-dark-5">
                                        {isWeightBasedUnit(item.saleUnit) && item.weight !== undefined ? (
                                            <>{item.weight.toFixed(2)} {item.saleUnit} × ${item.price.toFixed(2)}{getSaleUnitSuffix(item.saleUnit)}</>
                                        ) : (
                                            <>{item.qty} × ${item.price.toFixed(2)}{getSaleUnitSuffix(item.saleUnit)}</>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="font-semibold text-green-600">
                                        ${calculateItemTotal(item).toFixed(2)}
                                    </p>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg hover:bg-red-400"
                                        title={t("cart.remove")}
                                    >
                                        −
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            {/* Total and Actions - Always visible at bottom */}
            <div className="shrink-0 border-t dark:border-dark-3 p-6 pt-4 bg-white dark:bg-gray-dark">
                {/* Totals breakdown */}
                <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm text-gray-500 dark:text-dark-5">
                        <span>{t("checkout.subtotal")}</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {taxRate > 0 && (
                        <div className="flex justify-between text-sm text-gray-500 dark:text-dark-5">
                            <span>{t("checkout.tax")} ({(taxRate * 100).toFixed(0)}%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-gray-700 dark:text-dark-6 font-medium pt-2 border-t dark:border-dark-4">
                        <span className="font-semibold">{t("common.total")}</span>
                        <span className="text-green-600 font-bold text-lg">${total.toFixed(2)}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <button 
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full py-4 text-lg font-semibold bg-green-600 text-white rounded-xl hover:bg-green-500 transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t("common.checkout")}
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={saveCart}
                            disabled={cart.length === 0}
                            className="flex-1 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <BookmarkIcon className="w-4 h-4" />
                            {t("cart.saveCart")}
                        </button>
                        <button
                            onClick={() => setShowSavedCarts(true)}
                            className="flex-1 py-2.5 text-sm bg-gray-200 dark:bg-dark-3 text-gray-700 dark:text-dark-6 rounded-xl hover:bg-gray-300 dark:hover:bg-dark-4 transition flex items-center justify-center gap-2 relative"
                        >
                            <FolderIcon className="w-4 h-4" />
                            {t("cart.savedCarts")}
                            {savedCarts.length > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">
                                    {savedCarts.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={clearCart}
                            disabled={cart.length === 0}
                            className="px-4 py-2.5 text-sm bg-gray-200 dark:bg-dark-3 text-gray-700 dark:text-dark-6 rounded-xl hover:bg-gray-300 dark:hover:bg-dark-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t("common.clear")}
                        </button>
                    </div>
                </div>
            </div>

            {/* Saved Carts Modal */}
            <SavedCartsModal
                isOpen={showSavedCarts}
                onClose={() => setShowSavedCarts(false)}
                savedCarts={savedCarts}
                onRestore={restoreCart}
                onDelete={deleteSavedCart}
                t={t}
            />

            {/* Payment Type Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={handleCancelPayment}
                onConfirm={handleConfirmPayment}
                total={total}
                isProcessing={isProcessing}
                t={t}
            />

            {/* Receipt Modal */}
            {completedOrder && (
                <ReceiptModal
                    isOpen={showReceipt}
                    onClose={handleCloseReceipt}
                    onNewSale={handleNewSale}
                    items={completedOrder.items}
                    subtotal={completedOrder.subtotal}
                    tax={completedOrder.tax}
                    total={completedOrder.total}
                    orderNumber={completedOrder.orderNumber}
                    paymentType={completedOrder.paymentType}
                    t={t}
                />
            )}
        </div>
    );
}
