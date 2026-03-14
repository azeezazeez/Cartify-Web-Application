import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
    Package,
    Users,
    DollarSign,
    ShoppingBag,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    Search,
    Filter,
    Eye,
    ChevronDown,
    Calendar,
    Download,
    RefreshCw
} from 'lucide-react';
import { api, AdminOrder, OrderStats, AdminCustomer } from '../services/api';

interface DashboardStats {
    totalOrders: number;
    totalRevenue: number;
    totalCustomers: number;
    totalProducts: number;
    pendingOrders: number;
    completedOrders: number;
}

const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'customers'>('overview');
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [customers, setCustomers] = useState<AdminCustomer[]>([]);
    const [stats, setStats] = useState<OrderStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [ordersData, customersData, statsData] = await Promise.all([
                api.adminGetAllOrders(),
                api.adminGetAllCustomers(),
                api.adminGetOrderStats()
            ]);
            setOrders(ordersData);
            setCustomers(customersData);
            setStats(statsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingStatus(orderId);
        try {
            const updatedOrder = await api.adminUpdateOrderStatus(orderId, newStatus);
            setOrders(orders.map(order =>
                order.orderId === orderId ? updatedOrder : order
            ));
            if (selectedOrder?.orderId === orderId) {
                setSelectedOrder(updatedOrder);
            }
            // Refresh stats
            const newStats = await api.adminGetOrderStats();
            setStats(newStats);
        } catch (err) {
            console.error('Failed to update order status:', err);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const filteredCustomers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'PROCESSING': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'SHIPPED': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
            case 'DELIVERED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20"> {/* Added pt-20 for navbar spacing */}
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-brand-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20"> {/* Added pt-20 for navbar spacing */}
                <div className="text-center">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                    <button
                        onClick={fetchDashboardData}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-brand-950 pt-20"> {/* Added pt-20 for navbar spacing */}
            {/* Header */}
            <div className="bg-white dark:bg-brand-900 border-b border-gray-200 dark:border-brand-800 sticky top-20 z-10"> {/* Changed top-0 to top-20 */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                                Admin Dashboard
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Manage your store, orders, and customers
                            </p>
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-brand-800 rounded-lg transition-colors"
                        >
                            <RefreshCw className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex space-x-6 mt-6">
                        {[
                            { id: 'overview', label: 'Overview', icon: TrendingUp },
                            { id: 'orders', label: 'Orders', icon: ShoppingBag },
                            { id: 'customers', label: 'Customers', icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                                    ? 'bg-brand-600 text-white'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-brand-800'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'overview' && stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-8"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-brand-900 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                            {stats.totalOrders}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                        <ShoppingBag className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-brand-900 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                            {formatCurrency(stats.totalRevenue)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-green-600 dark:text-green-300" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-brand-900 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Customers</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                            {customers.length}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                        <Users className="w-6 h-6 text-purple-600 dark:text-purple-300" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-brand-900 rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending Orders</p>
                                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                                            {stats.pendingOrders}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                                        <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Status Breakdown */}
                        <div className="bg-white dark:bg-brand-900 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Order Status Overview
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                {[
                                    { label: 'Pending', value: stats.pendingOrders, color: 'yellow' },
                                    { label: 'Confirmed', value: stats.confirmedOrders, color: 'blue' },
                                    { label: 'Processing', value: stats.processingOrders, color: 'purple' },
                                    { label: 'Shipped', value: stats.shippedOrders, color: 'indigo' },
                                    { label: 'Delivered', value: stats.deliveredOrders, color: 'green' },
                                    { label: 'Cancelled', value: stats.cancelledOrders, color: 'red' },
                                ].map((item) => (
                                    <div key={item.label} className="text-center p-4 bg-gray-50 dark:bg-brand-800 rounded-lg">
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
                                        <p className={`text-sm text-${item.color}-600 dark:text-${item.color}-400`}>
                                            {item.label}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Orders */}
                        <div className="bg-white dark:bg-brand-900 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Recent Orders
                                </h2>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className="text-sm text-brand-600 hover:text-brand-700 font-medium"
                                >
                                    View All
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-brand-800">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Order ID
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-brand-700">
                                        {stats.recentOrders.map((order) => (
                                            <tr key={order.orderId} className="hover:bg-gray-50 dark:hover:bg-brand-800">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                    #{order.orderId.slice(0, 8)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {order.customerName}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                                    {formatDate(order.orderDate)}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(order.totalAmount)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'orders' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Search and Filter */}
                        <div className="bg-white dark:bg-brand-900 rounded-xl p-6 shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search orders by ID, customer name, or email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-brand-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-800 dark:text-white"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-5 h-5 text-gray-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-4 py-2 border border-gray-200 dark:border-brand-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-800 dark:text-white"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="PROCESSING">Processing</option>
                                        <option value="SHIPPED">Shipped</option>
                                        <option value="DELIVERED">Delivered</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Orders Table */}
                        <div className="bg-white dark:bg-brand-900 rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-brand-800">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Order ID
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Items
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-brand-700">
                                        {filteredOrders.map((order) => (
                                            <tr key={order.orderId} className="hover:bg-gray-50 dark:hover:bg-brand-800">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    #{order.orderId.slice(0, 8)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {order.customerName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {order.customerEmail}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                    {formatDate(order.orderDate)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                    {order.items.length} items
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(order.totalAmount)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleUpdateOrderStatus(order.orderId, e.target.value)}
                                                        disabled={updatingStatus === order.orderId}
                                                        className={`px-2 py-1 text-xs font-medium rounded-full border-0 ${getStatusColor(order.status)} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="CONFIRMED">Confirmed</option>
                                                        <option value="PROCESSING">Processing</option>
                                                        <option value="SHIPPED">Shipped</option>
                                                        <option value="DELIVERED">Delivered</option>
                                                        <option value="CANCELLED">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowOrderDetails(true);
                                                        }}
                                                        className="text-brand-600 hover:text-brand-700 font-medium text-sm"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'customers' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Search */}
                        <div className="bg-white dark:bg-brand-900 rounded-xl p-6 shadow-sm">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search customers by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-brand-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-800 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Customers Table */}
                        <div className="bg-white dark:bg-brand-900 rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-brand-800">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Email
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Joined Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Total Orders
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Total Spent
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Role
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-brand-700">
                                        {filteredCustomers.map((customer) => (
                                            <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-brand-800">
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {customer.name}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                    {customer.email}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                    {customer.joinedDate}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                                                    {customer.totalOrders}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(customer.totalSpent)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${customer.role === 'ADMIN'
                                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                        }`}>
                                                        {customer.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Order Details Modal */}
            {showOrderDetails && selectedOrder && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4">
                        <div className="fixed inset-0 bg-black/50" onClick={() => setShowOrderDetails(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative bg-white dark:bg-brand-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-serif font-bold text-gray-900 dark:text-white">
                                    Order Details #{selectedOrder.orderId.slice(0, 8)}
                                </h2>
                                <button
                                    onClick={() => setShowOrderDetails(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-brand-800 rounded-lg"
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-6">
                                {/* Customer Info */}
                                <div className="bg-gray-50 dark:bg-brand-800 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
                                    <p className="text-gray-600 dark:text-gray-300">Name: {selectedOrder.customerName}</p>
                                    <p className="text-gray-600 dark:text-gray-300">Email: {selectedOrder.customerEmail}</p>
                                    <p className="text-gray-600 dark:text-gray-300">Shipping Address: {selectedOrder.shippingAddress}</p>
                                </div>

                                {/* Order Items */}
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Order Items</h3>
                                    <div className="space-y-3">
                                        {selectedOrder.items.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-brand-700">
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">{item.productName}</p>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                                                </div>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(item.price * item.quantity)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="bg-gray-50 dark:bg-brand-800 rounded-lg p-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-600 dark:text-gray-300">Subtotal:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(selectedOrder.totalAmount)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-gray-600 dark:text-gray-300">Shipping:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">Free</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-brand-700">
                                        <span className="font-semibold text-gray-900 dark:text-white">Total:</span>
                                        <span className="font-bold text-lg text-brand-600 dark:text-brand-400">
                                            {formatCurrency(selectedOrder.totalAmount)}
                                        </span>
                                    </div>
                                </div>

                                {/* Update Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Update Order Status
                                    </label>
                                    <select
                                        value={selectedOrder.status}
                                        onChange={(e) => {
                                            handleUpdateOrderStatus(selectedOrder.orderId, e.target.value);
                                            setSelectedOrder({ ...selectedOrder, status: e.target.value });
                                        }}
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-brand-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-brand-800 dark:text-white"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="PROCESSING">Processing</option>
                                        <option value="SHIPPED">Shipped</option>
                                        <option value="DELIVERED">Delivered</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;