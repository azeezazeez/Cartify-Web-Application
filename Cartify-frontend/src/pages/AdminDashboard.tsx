import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign } from 'lucide-react';
import {
    Package,
    Users,
    ShoppingBag,
    TrendingUp,
    Clock,
    XCircle,
    Search,
    Filter,
    Eye,
    ChevronDown,
    RefreshCw,
    AlertCircle,
    X
} from 'lucide-react';
import { api, AdminOrder, OrderStats, AdminCustomer } from '../services/api';

interface AdminDashboardProps {
    user: any;
    onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
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
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: 'asc' | 'desc';
    } | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        setError(null);
        try {
            // ONLY REAL API DATA - NO MOCK DATA
            const [ordersData, customersData, statsData] = await Promise.all([
                api.adminGetAllOrders(),
                api.adminGetAllCustomers(),
                api.adminGetOrderStats()
            ]);
            setOrders(ordersData || []);
            setCustomers(customersData || []);
            setStats(statsData);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to fetch dashboard data. Please ensure the backend is running.');
            // SET EMPTY ARRAYS - NO MOCK DATA
            setOrders([]);
            setCustomers([]);
            setStats(null);
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
            const newStats = await api.adminGetOrderStats();
            setStats(newStats);
        } catch (err) {
            console.error('Failed to update order status:', err);
            alert('Failed to update order status. Please try again.');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const filteredOrders = useMemo(() => {
        if (!orders.length) return [];

        let filtered = orders.filter(order => {
            if (!order) return false;

            const searchLower = searchTerm.toLowerCase().trim();

            if (!searchLower) {
                return statusFilter === 'all' || order.status === statusFilter;
            }

            const orderId = (order.orderId || '').toLowerCase();
            const customerName = (order.customerName || '').toLowerCase();
            const customerEmail = (order.customerEmail || '').toLowerCase();

            const matchesSearch =
                orderId.includes(searchLower) ||
                customerName.includes(searchLower) ||
                customerEmail.includes(searchLower);

            const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        if (sortConfig !== null) {
            filtered = [...filtered].sort((a, b) => {
                const aValue = a[sortConfig.key as keyof AdminOrder];
                const bValue = b[sortConfig.key as keyof AdminOrder];

                // Check for undefined values
                if (aValue === undefined) return 1;
                if (bValue === undefined) return -1;

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        return filtered;
    }, [orders, searchTerm, statusFilter, sortConfig]);

    const filteredCustomers = useMemo(() => {
        if (!customers.length) return [];

        return customers.filter(customer => {
            if (!customer) return false;

            const searchLower = searchTerm.toLowerCase().trim();
            if (!searchLower) return true;

            const name = (customer.name || '').toLowerCase();
            const email = (customer.email || '').toLowerCase();

            return name.includes(searchLower) || email.includes(searchLower);
        });
    }, [customers, searchTerm]);

    const paginatedOrders = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredOrders, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const handleSort = (key: string) => {
        setSortConfig(current => {
            if (current?.key === key) {
                if (current.direction === 'asc') {
                    return { key, direction: 'desc' };
                }
                return null;
            }
            return { key, direction: 'asc' };
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
            case 'PROCESSING': return 'bg-purple-100 text-purple-800';
            case 'SHIPPED': return 'bg-indigo-100 text-indigo-800';
            case 'DELIVERED': return 'bg-green-100 text-green-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatCurrency = (amount: number) => {
        return '$' + (amount || 0).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
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
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <RefreshCw className="w-12 h-12 animate-spin text-brand-600 mx-auto mb-4" />
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Connection Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button 
                        onClick={fetchDashboardData}
                        className="w-full py-3 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        <span>Try Again</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-20">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-16 sm:top-20 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Admin Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Signed in as {user?.name || user?.email || 'Admin'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={fetchDashboardData}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Refresh data"
                            >
                                <RefreshCw className="w-5 h-5 text-gray-600" />
                            </button>
                            <button
                                onClick={onLogout}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex space-x-2 sm:space-x-6 mt-6 overflow-x-auto pb-2 scrollbar-hide">
                        {[
                            { id: 'overview', label: 'Overview', icon: TrendingUp },
                            { id: 'orders', label: 'Orders', icon: ShoppingBag },
                            { id: 'customers', label: 'Customers', icon: Users },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    setActiveTab(tab.id as any);
                                    setSearchTerm('');
                                    setStatusFilter('all');
                                    setCurrentPage(1);
                                }}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-brand-600 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="font-medium text-sm">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Overview Tab */}
                {activeTab === 'overview' && stats && (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Orders</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-2">
                                            {stats.totalOrders || 0}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <ShoppingBag className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Revenue</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-2">
                                            {formatCurrency(stats.totalRevenue || 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <DollarSign className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Customers</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-2">
                                            {customers.length || 0}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                        <Users className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Pending</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-2">
                                            {stats.pendingOrders || 0}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-yellow-50 rounded-lg">
                                        <Clock className="w-6 h-6 text-yellow-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Orders - Minimalist View */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                             <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <h3 className="font-bold text-gray-900">Recent Orders</h3>
                                <button className="text-brand-600 text-sm font-medium hover:underline" onClick={() => setActiveTab('orders')}>View All</button>
                             </div>
                             <div className="divide-y divide-gray-100">
                                {stats.recentOrders?.slice(0, 5).map((order) => (
                                    <div key={order.orderId} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold">
                                                {order.customerName?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{order.customerName}</p>
                                                <p className="text-xs text-gray-500">#{order.orderId?.slice(0, 8)} • {formatDate(order.orderDate)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search order ID, name or email..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Filter className="w-5 h-5 text-gray-400" />
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
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

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('orderId')}>Order ID</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('customerName')}>Customer</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('orderDate')}>Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('totalAmount')}>Amount</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedOrders.map((order) => (
                                            <tr key={order.orderId} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    #{order.orderId?.slice(0, 8)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm font-bold text-gray-900">{order.customerName}</p>
                                                    <p className="text-xs text-gray-500">{order.customerEmail}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(order.orderDate)}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(order.totalAmount)}</td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={order.status}
                                                        onChange={(e) => handleUpdateOrderStatus(order.orderId, e.target.value)}
                                                        disabled={updatingStatus === order.orderId}
                                                        className={`text-xs font-bold rounded-full px-3 py-1 border-0 focus:ring-2 focus:ring-brand-500 cursor-pointer ${getStatusColor(order.status)}`}
                                                    >
                                                        <option value="PENDING">Pending</option>
                                                        <option value="CONFIRMED">Confirmed</option>
                                                        <option value="PROCESSING">Processing</option>
                                                        <option value="SHIPPED">Shipped</option>
                                                        <option value="DELIVERED">Delivered</option>
                                                        <option value="CANCELLED">Cancelled</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowOrderDetails(true);
                                                        }}
                                                        className="p-2 hover:bg-brand-50 rounded-full transition-colors text-brand-600"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {filteredOrders.length === 0 && (
                                <div className="text-center py-12">
                                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-500">No orders found matching your criteria</p>
                                </div>
                            )}

                            {totalPages > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
                                    <p className="text-xs text-gray-500">Showing page {currentPage} of {totalPages}</p>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-50"
                                        >
                                            Prev
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium disabled:opacity-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Customers Tab */}
                {activeTab === 'customers' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search customers by name or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Joined</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Orders</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Spent</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredCustomers.map((customer) => (
                                            <tr key={customer.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 font-bold">
                                                            {customer.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{customer.name}</p>
                                                            <p className="text-xs text-gray-500">{customer.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{customer.joinedDate?.slice(0, 10)}</td>
                                                <td className="px-6 py-4 text-sm font-medium">{customer.totalOrders || 0}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">{formatCurrency(customer.totalSpent || 0)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-full bg-gray-100 text-gray-600">
                                                        {customer.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            <AnimatePresence>
                {showOrderDetails && selectedOrder && (
                    <div className="fixed inset-0 z-[100] overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen px-4 py-8">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowOrderDetails(false)}
                                className="fixed inset-0 bg-black/40 backdrop-blur-sm"
                            />
                            
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white rounded-3xl max-w-2xl w-full mx-auto shadow-2xl overflow-hidden"
                            >
                                {/* Modal Header */}
                                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                                    <div>
                                        <p className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-1">Order Summary</p>
                                        <h2 className="text-2xl font-black text-gray-900">
                                            #{selectedOrder.orderId?.slice(0, 8)}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setShowOrderDetails(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <div className="p-8 space-y-8">
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 font-sans">
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Customer</h4>
                                            <p className="text-sm font-bold text-gray-900">{selectedOrder.customerName}</p>
                                            <p className="text-xs text-gray-500">{selectedOrder.customerEmail}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Shipping To</h4>
                                            <p className="text-xs text-gray-700 leading-relaxed">
                                                {selectedOrder.shippingAddress || 'Address not provided'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Items Ordered</h4>
                                        <div className="space-y-4">
                                            {selectedOrder.items?.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-400">
                                                            IMG
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{item.productName}</p>
                                                            <p className="text-xs text-gray-500">Qty: {item.quantity} x {formatCurrency(item.price)}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-gray-900">
                                                        {formatCurrency(item.price * item.quantity)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary & Status */}
                                    <div className="flex flex-col sm:flex-row gap-8 pt-6 border-t border-gray-100">
                                        <div className="flex-1 space-y-4">
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Order Management</h4>
                                            <div className="space-y-3">
                                                <label className="block text-xs font-medium text-gray-500">Update Status</label>
                                                <select
                                                    value={selectedOrder.status}
                                                    onChange={(e) => {
                                                        handleUpdateOrderStatus(selectedOrder.orderId, e.target.value);
                                                        setSelectedOrder({ ...selectedOrder, status: e.target.value });
                                                    }}
                                                    className={`w-full px-4 py-2 text-xs font-bold rounded-xl border-2 focus:outline-none focus:ring-0 ${getStatusColor(selectedOrder.status)}`}
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
                                        
                                        <div className="w-full sm:w-64 bg-gray-50 rounded-2xl p-6">
                                            <div className="space-y-2 pb-4 border-b border-gray-200">
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <span>Subtotal</span>
                                                    <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500">
                                                    <span>Shipping</span>
                                                    <span>$0.00</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between pt-4">
                                                <span className="text-sm font-black text-gray-900">Total</span>
                                                <span className="text-lg font-black text-brand-600">{formatCurrency(selectedOrder.totalAmount)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
