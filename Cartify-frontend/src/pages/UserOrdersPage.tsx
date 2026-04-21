// pages/UserOrdersPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Package, Calendar, Truck, CheckCircle, Clock,
    AlertCircle, ChevronRight, Search, Filter, X, ShoppingBag
} from 'lucide-react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface OrderItem {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    subtotal: number;
}

interface Order {
    orderId: string;
    orderDate: string;
    totalAmount: number;
    status: string;
    items: OrderItem[];
}

interface UserOrdersPageProps {
    isDark?: boolean;
}

export const UserOrdersPage = ({ isDark = false }: UserOrdersPageProps) => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    // ─── Theme tokens ─────────────────────────────────────────────────────────
    // dark mode  → white bg, black text
    // light mode → dark bg, white text
    const pageBg = isDark ? 'bg-gray-50' : 'bg-gray-950';
    const cardBg = isDark ? 'bg-white' : 'bg-gray-900';
    const cardBorder = isDark ? 'border-gray-100' : 'border-gray-800';
    const textPrimary = isDark ? 'text-gray-900' : 'text-white';
    const textSecondary = isDark ? 'text-gray-600' : 'text-gray-300';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
    const inputBg = isDark ? 'bg-gray-50 border-gray-200 focus:border-gray-900'
        : 'bg-gray-800 border-gray-700 focus:border-white';
    const inputText = isDark ? 'text-gray-900' : 'text-white';
    const selectBg = isDark ? 'bg-gray-50 border-gray-200 focus:border-gray-900 text-gray-900'
        : 'bg-gray-800 border-gray-700 focus:border-white text-white';
    const sectionBg = isDark ? 'bg-gray-50' : 'bg-gray-800/50';
    const iconBg = isDark ? 'bg-gray-100' : 'bg-gray-800';
    const iconText = isDark ? 'text-gray-600' : 'text-gray-400';
    const emptyIcon = isDark ? 'text-gray-200' : 'text-gray-700';
    const btnPrimary = isDark
        ? 'bg-gray-900 text-white hover:bg-gray-800'
        : 'bg-white text-gray-900 hover:bg-gray-100';
    const btnOutline = isDark
        ? 'border border-gray-200 text-gray-900 hover:bg-gray-50'
        : 'border border-gray-700 text-white hover:bg-gray-800';
    const viewDetailsTxt = isDark
        ? 'text-gray-600 hover:text-gray-900'
        : 'text-gray-400 hover:text-white';

    // Status colors for both themes
    const getStatusColor = (status: string) => {
        switch ((status || '').toUpperCase()) {
            case 'DELIVERED':
                return isDark
                    ? 'bg-green-100 text-green-800'
                    : 'bg-green-900/20 text-green-400 border border-green-800/50';
            case 'SHIPPED':
                return isDark
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-blue-900/20 text-blue-400 border border-blue-800/50';
            case 'PROCESSING':
                return isDark
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-yellow-900/20 text-yellow-400 border border-yellow-800/50';
            case 'PENDING':
                return isDark
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-orange-900/20 text-orange-400 border border-orange-800/50';
            case 'CANCELLED':
                return isDark
                    ? 'bg-red-100 text-red-800'
                    : 'bg-red-900/20 text-red-400 border border-red-800/50';
            default:
                return isDark
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-gray-800/50 text-gray-400 border border-gray-700';
        }
    };
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const userStr = localStorage.getItem('cartify_currentUser');
            if (!userStr) { setError('Please log in to view your orders.'); setOrders([]); return; }
            const data = await api.getOrderHistory();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error: any) {
            setError(error?.message || 'Failed to load orders. Please try again.');
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch ((status || '').toUpperCase()) {
            case 'DELIVERED': return <CheckCircle className="w-4 h-4" />;
            case 'SHIPPED': return <Truck className="w-4 h-4" />;
            case 'PROCESSING': return <Package className="w-4 h-4" />;
            case 'PENDING': return <Clock className="w-4 h-4" />;
            case 'CANCELLED': return <X className="w-4 h-4" />;
            default: return <AlertCircle className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Date not available';
        try {
            return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                .format(new Date(dateString));
        } catch { return dateString; }
    };

    const formatCurrency = (amount: number) => {
        if (amount == null || isNaN(amount)) return '$0.00';
        return '$' + Number(amount).toFixed(2);
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'all' ||
            (order.status || '').toUpperCase() === filterStatus.toUpperCase();
        const matchesSearch = !searchQuery ||
            order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.items || []).some(item =>
                (item.productName || '').toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesStatus && matchesSearch;
    });

    if (isLoading) {
        return (
            <div className={`min-h-screen pt-24 flex items-center justify-center ${pageBg}`}>
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
                    <div className={`w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4 ${isDark ? 'border-gray-200 border-t-gray-900' : 'border-gray-700 border-t-white'}`} />
                    <p className={textSecondary}>Loading your orders...</p>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`min-h-screen pt-24 flex items-center justify-center ${pageBg}`}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md mx-auto px-4">
                    <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>Something went wrong</h3>
                    <p className={`mb-6 ${textSecondary}`}>{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={fetchOrders} className={`px-6 py-3 rounded-xl font-medium transition-colors ${btnPrimary}`}>
                            Try Again
                        </button>
                        <button onClick={() => navigate('/')} className={`px-6 py-3 rounded-xl font-medium transition-colors ${btnOutline}`}>
                            Go Home
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen pt-24 pb-12 ${pageBg}`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <h1 className={`text-3xl font-serif font-bold ${textPrimary}`}>My Orders</h1>
                    <p className={`mt-2 ${textSecondary}`}>
                        {orders.length} order{orders.length !== 1 ? 's' : ''} placed
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className={`rounded-2xl p-6 shadow-sm mb-6 ${cardBg}`}
                >
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by order ID or product name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl text-sm focus:outline-none transition-colors ${inputBg} ${inputText}`}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className={`px-4 py-2.5 border rounded-xl text-sm focus:outline-none transition-colors ${selectBg}`}
                            >
                                <option value="all">All Orders</option>
                                <option value="PENDING">Pending</option>
                                <option value="PROCESSING">Processing</option>
                                <option value="SHIPPED">Shipped</option>
                                <option value="DELIVERED">Delivered</option>
                                <option value="CANCELLED">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Empty state */}
                {filteredOrders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                        className={`rounded-2xl p-16 text-center shadow-sm ${cardBg}`}
                    >
                        <ShoppingBag className={`w-16 h-16 mx-auto mb-4 ${emptyIcon}`} />
                        <h3 className={`text-xl font-serif font-bold mb-2 ${textPrimary}`}>
                            {searchQuery || filterStatus !== 'all' ? 'No orders match your filters' : "You haven't placed any orders yet"}
                        </h3>
                        <p className={`mb-6 text-sm ${textSecondary}`}>
                            {searchQuery || filterStatus !== 'all'
                                ? 'Try adjusting your search or filter'
                                : 'When you place an order, it will appear here'}
                        </p>
                        {!searchQuery && filterStatus === 'all' && (
                            <button onClick={() => navigate('/')} className={`px-6 py-3 rounded-xl font-medium transition-colors ${btnPrimary}`}>
                                Start Shopping
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order, index) => (
                            <motion.div
                                key={order.orderId}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                                className={`rounded-2xl shadow-sm overflow-hidden ${cardBg}`}
                            >
                                {/* Order Header */}
                                <div className={`p-6 border-b ${cardBorder}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${iconBg}`}>
                                                <Package className={`w-5 h-5 ${iconText}`} />
                                            </div>
                                            <div>
                                                <p className={`text-xs uppercase tracking-wide ${textMuted}`}>Order ID</p>
                                                <p className={`font-mono font-semibold text-sm ${textPrimary}`}>{order.orderId}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className={`w-3.5 h-3.5 ${textMuted}`} />
                                                <span className={`text-sm ${textSecondary}`}>{formatDate(order.orderDate)}</span>
                                            </div>
                                            <span className={`text-sm font-semibold ${textPrimary}`}>{formatCurrency(order.totalAmount)}</span>
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                <span className="capitalize">{(order.status || '').toLowerCase()}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {(order.items || []).map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                                                    <Package className={`w-5 h-5 ${iconText}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`font-medium text-sm truncate ${textPrimary}`}>{item.productName}</p>
                                                    <p className={`text-xs mt-0.5 ${textMuted}`}>{formatCurrency(item.price)} × {item.quantity}</p>
                                                </div>
                                                <p className={`font-medium text-sm flex-shrink-0 ${textPrimary}`}>{formatCurrency(item.subtotal)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={`mt-4 pt-4 border-t flex items-center justify-between ${cardBorder}`}>
                                        <p className={`text-sm ${textMuted}`}>
                                            {(order.items || []).length} item{(order.items || []).length !== 1 ? 's' : ''}
                                        </p>
                                        <div className="text-right">
                                            <p className={`text-xs ${textMuted}`}>Order Total</p>
                                            <p className={`text-lg font-bold ${textPrimary}`}>{formatCurrency(order.totalAmount)}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className={`px-6 py-4 flex justify-end ${sectionBg}`}>
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${viewDetailsTxt}`}
                                    >
                                        View Details <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Details Modal */}
            <AnimatePresence>
                {selectedOrder && (
                    <OrderDetailsModal
                        order={selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                        formatDate={formatDate}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                        formatCurrency={formatCurrency}
                        isDark={isDark}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    formatDate: (date: string) => string;
    getStatusColor: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
    formatCurrency: (amount: number) => string;
    isDark: boolean;
}

const OrderDetailsModal = ({
    order, onClose, formatDate, getStatusColor, getStatusIcon, formatCurrency, isDark
}: OrderDetailsModalProps) => {
    const modalBg = isDark ? 'bg-white' : 'bg-gray-900';
    const textPrimary = isDark ? 'text-gray-900' : 'text-white';
    const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
    const borderColor = isDark ? 'border-gray-100' : 'border-gray-800';
    const itemBg = isDark ? 'bg-gray-50' : 'bg-gray-800/50';
    const iconBg = isDark ? 'bg-gray-100' : 'bg-gray-800';
    const iconText = isDark ? 'text-gray-400' : 'text-gray-500';
    const closeBtn = isDark ? 'hover:bg-gray-100 text-gray-700' : 'hover:bg-gray-800 text-gray-300';
    const btnPrimary = isDark
        ? 'bg-gray-900 text-white hover:bg-gray-800'
        : 'bg-white text-gray-900 hover:bg-gray-100';

    return (
        <>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
            />
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-[210] rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${modalBg}`}
            >
                {/* Header */}
                <div className={`p-6 border-b flex items-center justify-between flex-shrink-0 ${borderColor}`}>
                    <div>
                        <h2 className={`text-xl font-serif font-bold ${textPrimary}`}>Order Details</h2>
                        <p className={`font-mono text-sm mt-0.5 ${textMuted}`}>{order.orderId}</p>
                    </div>
                    <button onClick={onClose} className={`p-2 rounded-full transition-colors ${closeBtn}`}>
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex items-center justify-between mb-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{(order.status || '').toLowerCase()}</span>
                        </span>
                        <div className={`flex items-center gap-1.5 text-sm ${textMuted}`}>
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(order.orderDate)}
                        </div>
                    </div>

                    <h3 className={`text-sm font-semibold uppercase tracking-wide mb-3 ${textMuted}`}>Items Ordered</h3>
                    <div className="space-y-3 mb-6">
                        {(order.items || []).map((item, idx) => (
                            <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl ${itemBg}`}>
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                                    <Package className={`w-4 h-4 ${iconText}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate ${textPrimary}`}>{item.productName}</p>
                                    <p className={`text-xs mt-0.5 ${textMuted}`}>{formatCurrency(item.price)} × {item.quantity}</p>
                                </div>
                                <p className={`text-sm font-semibold flex-shrink-0 ${textPrimary}`}>{formatCurrency(item.subtotal)}</p>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className={`border-t pt-4 space-y-2 ${borderColor}`}>
                        <div className="flex justify-between text-sm">
                            <span className={textMuted}>Subtotal</span>
                            <span className={textPrimary}>{formatCurrency(order.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className={textMuted}>Shipping</span>
                            <span className="text-green-600 dark:text-green-400 font-medium">Free</span>
                        </div>
                        <div className={`flex justify-between pt-2 border-t ${borderColor}`}>
                            <span className={`font-bold ${textPrimary}`}>Total</span>
                            <span className={`font-bold ${textPrimary}`}>{formatCurrency(order.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`p-6 border-t flex-shrink-0 ${borderColor}`}>
                    <button onClick={onClose} className={`w-full py-3 rounded-xl font-medium transition-colors ${btnPrimary}`}>
                        Close
                    </button>
                </div>
            </motion.div>
        </>
    );
};