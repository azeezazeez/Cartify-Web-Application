import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  ShoppingBag,
  TrendingUp,
  Clock,
  Search,
  Filter,
  Eye,
  RefreshCw,
  AlertCircle,
  X
} from 'lucide-react';
import { DollarSign } from 'lucide-react';
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
  const itemsPerPage = 10;

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

      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setStats(statsData ?? null);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);

    try {
      const updatedOrder = await api.adminUpdateOrderStatus(orderId, newStatus);

      setOrders(prev =>
        prev.map(order =>
          order.orderId === orderId ? updatedOrder : order
        )
      );

      if (selectedOrder?.orderId === orderId) {
        setSelectedOrder(updatedOrder);
      }

      setStats(await api.adminGetOrderStats());
    } catch (err) {
      console.error(err);
      alert('Failed to update order');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const q = searchTerm.toLowerCase();

      return (
        (order.orderId || '').toLowerCase().includes(q) ||
        (order.customerName || '').toLowerCase().includes(q) ||
        (order.customerEmail || '').toLowerCase().includes(q)
      ) && (statusFilter === 'all' || order.status === statusFilter);
    });
  }, [orders, searchTerm, statusFilter]);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const formatCurrency = (amount: number) =>
    '$' + (amount || 0).toLocaleString();

  const formatDate = (date: string) =>
    new Date(date).toLocaleString();

  if (loading) return <div className="p-10 text-center">Loading...</div>;

  if (error)
    return (
      <div className="p-10 text-center text-red-500">
        {error}
        <button onClick={fetchDashboardData} className="ml-4 underline">
          Retry
        </button>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 pt-20">

      {/* HEADER */}
      <div className="bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p>{user?.email}</p>
      </div>

      {/* TABS */}
      <div className="flex gap-4 p-4">
        {['overview', 'orders', 'customers'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 ${
              activeTab === tab ? 'bg-black text-white' : 'bg-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-4 gap-4 p-6">
          <div className="bg-white p-4">Orders: {stats.totalOrders}</div>
          <div className="bg-white p-4">Revenue: {formatCurrency(stats.totalRevenue)}</div>
          <div className="bg-white p-4">Customers: {customers.length}</div>
          <div className="bg-white p-4">Pending: {stats.pendingOrders}</div>
        </div>
      )}

      {/* ORDERS */}
      {activeTab === 'orders' && (
        <div className="p-6">
          <input
            placeholder="Search..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="border p-2 mb-4"
          />

          {paginatedOrders.map(order => (
            <div key={order.orderId} className="border p-4 mb-2">
              <p>{order.customerName}</p>
              <p>{formatCurrency(order.totalAmount)}</p>

              <select
                value={order.status}
                onChange={e =>
                  handleUpdateOrderStatus(order.orderId, e.target.value)
                }
              >
                <option>PENDING</option>
                <option>CONFIRMED</option>
                <option>PROCESSING</option>
                <option>SHIPPED</option>
                <option>DELIVERED</option>
                <option>CANCELLED</option>
              </select>

              <button
                onClick={() => {
                  setSelectedOrder(order);
                  setShowOrderDetails(true);
                }}
              >
                View
              </button>
            </div>
          ))}

          {/* PAGINATION */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span>{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* MODAL */}
      <AnimatePresence>
        {showOrderDetails && selectedOrder && (
          <div className="fixed inset-0 flex items-center justify-center">
            <motion.div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowOrderDetails(false)}
            />

            <motion.div
              onClick={e => e.stopPropagation()}
              className="bg-white p-6 z-10"
            >
              <h2>{selectedOrder.customerName}</h2>
              <p>{selectedOrder.customerEmail}</p>
              <button onClick={() => setShowOrderDetails(false)}>
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
