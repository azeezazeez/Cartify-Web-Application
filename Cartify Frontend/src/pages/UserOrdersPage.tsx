// pages/UserOrdersPage.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IndianRupee } from 'lucide-react';
import {
    Package,
    Calendar,
    DollarSign,
    Truck,
    CheckCircle,
    Clock,
    AlertCircle,
    ChevronRight,
    Search,
    Filter,
    X
} from 'lucide-react';
import { api } from '../services/api';

interface OrderItem {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    total: number;
}

interface Order {
    orderId: string;
    orderDate: string;
    totalAmount: number;
    status: string;
    items: OrderItem[];
}

export const UserOrdersPage = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const data = await api.getOrderHistory();
            console.log('📦 Orders fetched:', data);

            // Now data should already be the array of orders
            setOrders(data);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';

        switch (status.toUpperCase()) {
            case 'DELIVERED':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'SHIPPED':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'PROCESSING':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'PENDING':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        if (!status) return <AlertCircle className="w-4 h-4" />;

        switch (status.toUpperCase()) {
            case 'DELIVERED':
                return <CheckCircle className="w-4 h-4" />;
            case 'SHIPPED':
                return <Truck className="w-4 h-4" />;
            case 'PROCESSING':
                return <Package className="w-4 h-4" />;
            case 'PENDING':
                return <Clock className="w-4 h-4" />;
            case 'CANCELLED':
                return <X className="w-4 h-4" />;
            default:
                return <AlertCircle className="w-4 h-4" />;
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'Date not available';

        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(date);
        } catch (error) {
            return dateString;
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesStatus = filterStatus === 'all' ||
            (order.status && order.status.toUpperCase() === filterStatus.toUpperCase());

        const matchesSearch = order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.items && order.items.some(item =>
                item.productName && item.productName.toLowerCase().includes(searchQuery.toLowerCase())
            ));

        return matchesStatus && matchesSearch;
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-brand-950 pt-24 flex items-center justify-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-950 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-brand-600 dark:text-brand-400">Loading your orders...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-brand-950 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1 className="text-3xl font-serif font-bold text-brand-950 dark:text-white">
                        My Orders
                    </h1>
                    <p className="text-brand-600 dark:text-brand-300 mt-2">
                        View and track all your orders
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-brand-900 rounded-2xl p-6 shadow-sm mb-8"
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-400" />
                            <input
                                type="text"
                                placeholder="Search orders by ID or product..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-lg focus:outline-none focus:border-brand-950 dark:focus:border-white"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center space-x-2">
                            <Filter className="w-5 h-5 text-brand-400" />
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-2 bg-brand-50 dark:bg-brand-800 border border-brand-100 dark:border-brand-700 rounded-lg focus:outline-none focus:border-brand-950 dark:focus:border-white"
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

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-brand-900 rounded-2xl p-12 text-center shadow-sm"
                    >
                        <Package className="w-16 h-16 text-brand-300 mx-auto mb-4" />
                        <h3 className="text-xl font-serif font-bold text-brand-950 dark:text-white mb-2">
                            No orders found
                        </h3>
                        <p className="text-brand-500 mb-6">
                            {searchQuery || filterStatus !== 'all'
                                ? "No orders match your filters"
                                : "You haven't placed any orders yet"}
                        </p>
                        {!searchQuery && filterStatus === 'all' && (
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-3 bg-brand-950 text-white rounded-xl font-medium hover:bg-brand-900 transition-colors"
                            >
                                Start Shopping
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        {filteredOrders.map((order, index) => (
                            <motion.div
                                key={order.orderId}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white dark:bg-brand-900 rounded-2xl shadow-sm overflow-hidden"
                            >
                                {/* Order Header */}
                                <div className="p-6 border-b border-brand-100 dark:border-brand-800">
                                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="p-3 bg-brand-100 dark:bg-brand-800 rounded-xl">
                                                <Package className="w-6 h-6 text-brand-600 dark:text-brand-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm text-brand-500 dark:text-brand-400">Order Number</p>
                                                <p className="font-mono font-medium text-brand-950 dark:text-white">
                                                    {order.orderId}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-6">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="w-4 h-4 text-brand-400" />
                                                <span className="text-sm text-brand-600 dark:text-brand-300">
                                                    {formatDate(order.orderDate)}
                                                </span>
                                            </div> 
                                            <div className="flex items-center space-x-2">
                                                <IndianRupee className="w-4 h-4 text-brand-400" />
                                                <span className="text-sm font-medium text-brand-950 dark:text-white">
                                                    ${order.totalAmount?.toFixed(2)}
                                                </span>
                                            </div>
                                            <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                <span className="capitalize">{order.status?.toLowerCase()}</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-6">
                                    <div className="space-y-4">
                                        {order.items && order.items.map((item, idx) => (
                                            <div key={idx} className="flex items-center space-x-4">
                                                {/* Product Image Placeholder */}
                                                <div className="w-16 h-16 bg-brand-100 dark:bg-brand-800 rounded-lg overflow-hidden flex-shrink-0">
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Package className="w-6 h-6 text-brand-400" />
                                                    </div>
                                                </div>

                                                {/* Product Details */}
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-brand-950 dark:text-white">
                                                        {item.productName}
                                                    </h4>
                                                    <div className="flex items-center space-x-4 mt-1">
                                                        <span className="text-sm text-brand-500">
                                                            Qty: {item.quantity}
                                                        </span>
                                                        <span className="text-sm text-brand-500">
                                                            ${item.price?.toFixed(2)} each
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Total */}
                                                <div className="text-right">
                                                    <p className="font-medium text-brand-950 dark:text-white">
                                                        ${item.total?.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Total */}
                                    <div className="mt-4 pt-4 border-t border-brand-100 dark:border-brand-800 flex justify-end">
                                        <div className="text-right">
                                            <p className="text-sm text-brand-500 dark:text-brand-400">Total</p>
                                            <p className="text-xl font-bold text-brand-950 dark:text-white">
                                                ${order.totalAmount?.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Footer */}
                                <div className="px-6 py-4 bg-brand-50 dark:bg-brand-800/50 flex justify-end">
                                    <button
                                        onClick={() => setSelectedOrder(order)}
                                        className="flex items-center space-x-2 text-brand-600 hover:text-brand-950 dark:text-brand-400 dark:hover:text-white transition-colors"
                                    >
                                        <span className="text-sm font-medium">View Details</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    formatDate={formatDate}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                />
            )}
        </div>
    );
};

// Order Details Modal Component
interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
    formatDate: (date: string) => string;
    getStatusColor: (status: string) => string;
    getStatusIcon: (status: string) => JSX.Element;
}

const OrderDetailsModal = ({
    order,
    onClose,
    formatDate,
    getStatusColor,
    getStatusIcon
}: OrderDetailsModalProps) => {
    return (
        <AnimatePresence>
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
                />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white dark:bg-brand-900 z-[210] rounded-3xl overflow-hidden shadow-2xl"
                >
                    <div className="p-6 border-b border-brand-100 dark:border-brand-800">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-serif font-bold text-brand-950 dark:text-white">
                                Order Details
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-brand-100 dark:hover:bg-brand-800 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {/* Order Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-brand-500 dark:text-brand-400">Order Number</p>
                                <p className="font-mono font-medium text-brand-950 dark:text-white">
                                    {order.orderId}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-brand-500 dark:text-brand-400">Date</p>
                                <p className="text-brand-950 dark:text-white">{formatDate(order.orderDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-brand-500 dark:text-brand-400">Status</p>
                                <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                    {getStatusIcon(order.status)}
                                    <span className="capitalize">{order.status?.toLowerCase()}</span>
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-brand-500 dark:text-brand-400">Total Amount</p>
                                <p className="text-lg font-bold text-brand-950 dark:text-white">
                                    ${order.totalAmount?.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        {/* Order Items */}
                        <h3 className="text-lg font-serif font-bold text-brand-950 dark:text-white mb-3">
                            Items
                        </h3>
                        <div className="space-y-4">
                            {order.items && order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center space-x-4">
                                    <div className="w-16 h-16 bg-brand-100 dark:bg-brand-800 rounded-lg overflow-hidden flex-shrink-0">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Package className="w-6 h-6 text-brand-400" />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-brand-950 dark:text-white">
                                            {item.productName}
                                        </h4>
                                        <div className="flex items-center space-x-4 mt-1">
                                            <span className="text-sm text-brand-500">
                                                Qty: {item.quantity}
                                            </span>
                                            <span className="text-sm text-brand-500">
                                                ${item.price?.toFixed(2)} each
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-brand-950 dark:text-white">
                                            ${item.total?.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Order Summary */}
                        <div className="mt-6 pt-6 border-t border-brand-100 dark:border-brand-800">
                            <div className="flex justify-between mb-2">
                                <span className="text-brand-600 dark:text-brand-300">Subtotal</span>
                                <span className="font-medium text-brand-950 dark:text-white">
                                    ${order.totalAmount?.toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between mb-2">
                                <span className="text-brand-600 dark:text-brand-300">Shipping</span>
                                <span className="font-medium text-green-600">Free</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-brand-100 dark:border-brand-800">
                                <span className="text-lg font-bold text-brand-950 dark:text-white">Total</span>
                                <span className="text-lg font-bold text-brand-950 dark:text-white">
                                    ${order.totalAmount?.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 border-t border-brand-100 dark:border-brand-800">
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-brand-950 text-white rounded-xl font-medium hover:bg-brand-900 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </motion.div>
            </>
        </AnimatePresence>
    );
};
