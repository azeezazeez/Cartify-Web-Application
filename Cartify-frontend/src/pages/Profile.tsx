import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User as UserIcon, Package, Settings, LogOut, MapPin, Phone, Mail, Camera, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';

interface UserProfile {
    id: number;
    email: string;
    username: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
    role: string;
    profileImage?: string;
    createdAt?: string;
}

type TabType = 'personal' | 'orders' | 'settings';

interface ProfileProps {
    user: any;
    onLogout: () => void;
    showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onLogout, showToast }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab') as TabType;

    const [activeTab, setActiveTab] = useState<TabType>(tabParam || 'personal');
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showAvatarModal, setShowAvatarModal] = useState(false);
    const [deleteStep, setDeleteStep] = useState<'request' | 'verify'>('request');
    const [otpValue, setOtpValue] = useState('');
    const [isSendingOtp, setIsSendingOtp] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [userOrders, setUserOrders] = useState<any[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        phoneNumber: '',
        address: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
    });

    useEffect(() => {
        if (user && user.id) {
            fetchProfile();
        }
    }, [user]);

    const fetchUserOrders = async () => {
        setIsLoadingOrders(true);
        try {
            const orders = await api.getOrderHistory();
            setUserOrders(Array.isArray(orders) ? orders : []);
        } catch (error) {
            console.error('Failed to fetch orders:', error);
            setUserOrders([]);
        } finally {
            setIsLoadingOrders(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'orders' && user && user.id) {
            fetchUserOrders();
        }
    }, [activeTab, user]);

    // Replace your fetchProfile function in Profile.tsx with this:

const fetchProfile = async () => {
  try {
    const data = await api.getUserProfile();
    setProfile(data);
    setFormData({
      username: data.username || '',
      phoneNumber: data.phoneNumber || '',
      address: data.address || '',
      city: data.city || '',
      state: data.state || '',
      country: data.country || '',
      zipCode: data.zipCode || '',
    });
  } catch (error: any) {
    const msg = error?.message || '';

    if (msg.includes('Token expired') || msg.includes('Invalid token')) {
      // Only logout for actual auth failures
      showToast('Session expired. Please log in again.', 'error');
      setTimeout(() => onLogout(), 2000);
    } else if (msg.includes('User not found')) {
      // DB was reset - user needs to re-register, not just re-login
      showToast('Account not found. Please register again.', 'error');
      setTimeout(() => onLogout(), 2000);
    } else {
      // Network error, server down etc — DO NOT logout
      showToast('Could not load profile. Please try again.', 'info');
    }
  }
};

    const handleSaveProfile = async () => {
        if (!formData.username.trim()) {
            showToast('Username is required', 'info');
            return;
        }
        try {
            setIsSaving(true);
            const updatedProfile = await api.updateUserProfile(formData);
            setProfile(updatedProfile);
            setIsEditing(false);
            showToast('Profile updated successfully!', 'success');
            const storedUser = localStorage.getItem('cartify_currentUser');
            if (storedUser) {
                const userData = JSON.parse(storedUser);
                userData.username = updatedProfile.username;
                localStorage.setItem('cartify_currentUser', JSON.stringify(userData));
            }
        } catch (error: any) {
            showToast(error?.message || 'Failed to update profile', 'info');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            showToast('Passwords do not match', 'info');
            return;
        }
        if (passwordData.new.length < 6) {
            showToast('Password must be at least 6 characters', 'info');
            return;
        }
        setIsUpdatingPassword(true);
        try {
            await api.changePassword(passwordData.current, passwordData.new);
            showToast('Password updated successfully', 'success');
            setShowPasswordModal(false);
            setPasswordData({ current: '', new: '', confirm: '' });
        } catch (error: any) {
            showToast(error?.message || 'Failed to update password', 'info');
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    const handleSendOtp = async () => {
        if (!user) return;
        setIsSendingOtp(true);
        try {
            await api.generateOtp(user.email);
            setDeleteStep('verify');
            showToast(`OTP sent to ${user.email}`, 'success');
        } catch (error: any) {
            showToast(error?.message || 'Failed to send OTP', 'info');
        } finally {
            setIsSendingOtp(false);
        }
    };

    const handleVerifyAndDelete = async () => {
        if (!user) return;
        setIsDeleting(true);
        try {
            await api.resetPassword({ email: user.email, otp: otpValue, newPassword: 'deleted_temp' });
            onLogout();
            showToast('Account permanently deleted', 'success');
            navigate('/');
        } catch (error: any) {
            showToast(error?.message || 'Invalid OTP or deletion failed', 'info');
        } finally {
            setIsDeleting(false);
        }
    };

    const selectPredefinedAvatar = async (url: string) => {
        try {
            await api.updateUserProfile({ profileImage: url });
            await fetchProfile();
            showToast('Profile picture updated', 'success');
            setShowAvatarModal(false);
        } catch (error) {
            showToast('Failed to update profile picture', 'info');
        }
    };

    if (!user) return null;

    const navItems = [
        { id: 'personal' as TabType, label: 'Personal Information', icon: UserIcon },
        { id: 'orders' as TabType, label: 'Order History', icon: Package },
        { id: 'settings' as TabType, label: 'Account Settings', icon: Settings },
    ];

    const getOrderStatusDisplay = (status: string) => {
        const statusMap: { [key: string]: { label: string; color: string } } = {
            'PENDING': { label: 'Pending', color: 'bg-yellow-500/10 text-yellow-600' },
            'PROCESSING': { label: 'Processing', color: 'bg-blue-500/10 text-blue-600' },
            'SHIPPED': { label: 'Shipped', color: 'bg-indigo-500/10 text-indigo-600' },
            'DELIVERED': { label: 'Delivered', color: 'bg-green-500/10 text-green-600' },
            'CANCELLED': { label: 'Cancelled', color: 'bg-red-500/10 text-red-600' },
        };
        return statusMap[status] || { label: status || 'Processing', color: 'bg-gray-500/10 text-gray-600' };
    };

    const inputClass = "w-full bg-gray-50 border border-transparent px-5 py-4 rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-gray-200 transition-all disabled:opacity-50 text-gray-900";
    const inputWithIconClass = "w-full bg-gray-50 border border-transparent px-12 py-4 rounded-2xl text-sm focus:outline-none focus:bg-white focus:border-gray-200 transition-all disabled:opacity-50 text-gray-900";

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="container mx-auto px-6 py-32 min-h-screen bg-white"
        >
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-12">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="h-28 w-28 bg-brand-100 rounded-full flex items-center justify-center overflow-hidden border border-brand-200 shadow-inner relative">
                                {profile?.profileImage ? (
                                    <img src={profile.profileImage} alt={profile.username} className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-brand-600 font-serif text-4xl font-bold uppercase">
                                        {user.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                                    </span>
                                )}
                                <button
                                    onClick={() => setShowAvatarModal(true)}
                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                                >
                                    <Camera className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div>
                            <h1 className="font-serif text-3xl tracking-tight text-gray-900">
                                {profile?.username || user.email}
                            </h1>
                            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1">
                                {user.role === 'ADMIN' ? 'Administrator' : 'Customer'}
                            </p>
                        </div>
                    </div>

                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-4 px-6 py-4 text-[10px] font-bold uppercase tracking-widest transition-all text-left rounded-xl ${
                                    activeTab === item.id
                                        ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/10'
                                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                }`}
                            >
                                <item.icon className={`h-4 w-4 ${activeTab === item.id ? 'text-white' : ''}`} />
                                {item.label}
                            </button>
                        ))}
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-4 px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 transition-colors text-left mt-8 rounded-xl"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </button>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">

                        {/* PERSONAL INFO */}
                        {activeTab === 'personal' && (
                            <motion.div key="personal" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="p-6 sm:p-10 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-10">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">Personal Information</h2>
                                        <p className="text-2xl font-serif text-gray-900">Account Details</p>
                                    </div>
                                    <div className="flex gap-3">
                                        {isEditing && (
                                            <button onClick={() => setIsEditing(false)}
                                                className="px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest font-bold border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all">
                                                Cancel
                                            </button>
                                        )}
                                        <button
                                            onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                            disabled={isSaving}
                                            className={`px-8 py-3 rounded-xl text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap ${
                                                isEditing ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}>
                                            {isEditing ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Username</label>
                                        <div className="relative">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input type="text" disabled={!isEditing} value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className={inputWithIconClass} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input type="email" disabled value={user.email} className={`${inputWithIconClass} opacity-60`} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input type="tel" disabled={!isEditing} value={formData.phoneNumber}
                                                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                                className={inputWithIconClass} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input type="text" disabled={!isEditing} value={formData.address}
                                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                                className={inputWithIconClass} />
                                        </div>
                                    </div>

                                    {[
                                        { label: 'ZIP Code', key: 'zipCode' },
                                        { label: 'City', key: 'city' },
                                        { label: 'State', key: 'state' },
                                        { label: 'Country', key: 'country' },
                                    ].map(({ label, key }) => (
                                        <div key={key} className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">{label}</label>
                                            <input type="text" disabled={!isEditing}
                                                value={formData[key as keyof typeof formData]}
                                                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                                className={inputClass} />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* ORDER HISTORY */}
                        {activeTab === 'orders' && (
                            <motion.div key="orders" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="p-6 sm:p-10 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-8">
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">Order History</h2>
                                    <p className="text-2xl font-serif text-gray-900">Recent Purchases</p>
                                </div>
                                {isLoadingOrders ? (
                                    <div className="flex justify-center py-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
                                    </div>
                                ) : userOrders.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                                        <Package className="h-12 w-12 text-gray-300" />
                                        <p className="text-sm font-light italic text-gray-500">No orders found.</p>
                                        <button onClick={() => navigate('/')}
                                            className="px-6 py-3 bg-brand-600 text-white rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-brand-700 transition-colors">
                                            Start Shopping
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {userOrders.map((order: any, index: number) => {
                                            const statusDisplay = getOrderStatusDisplay(order.status);
                                            return (
                                                <div key={order.orderId || index} className="border border-gray-100 rounded-2xl p-6 bg-white">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-widest text-gray-500">Order #{(order.orderId || order.id || '').toString().slice(0, 8)}</p>
                                                            <p className="text-sm font-bold mt-1 text-gray-900">${(order.totalAmount || 0).toFixed(2)}</p>
                                                            {order.items && (
                                                                <p className="text-[10px] text-gray-500 mt-1">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                                                            )}
                                                        </div>
                                                        <span className={`px-3 py-1 text-[8px] font-bold uppercase tracking-wider rounded-full ${statusDisplay.color}`}>
                                                            {statusDisplay.label}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500">
                                                        {new Date(order.orderDate || order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {/* ACCOUNT SETTINGS */}
                        {activeTab === 'settings' && (
                            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                                className="p-6 sm:p-10 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-10">
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">Account Settings</h2>
                                    <p className="text-2xl font-serif text-gray-900">Preferences & Security</p>
                                </div>
                                <div className="space-y-8">
                                    <div className="p-6 border border-gray-100 rounded-2xl space-y-4 bg-white">
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-900">Password</h3>
                                        <p className="text-sm text-gray-500 font-light">Change your account password to keep your account secure.</p>
                                        <button onClick={() => setShowPasswordModal(true)}
                                            className="px-6 py-3 border border-gray-300 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-gray-50 transition-colors text-gray-700">
                                            Update Password
                                        </button>
                                    </div>
                                    <div className="pt-8 border-t border-gray-100">
                                        <button onClick={() => setShowDeleteModal(true)}
                                            className="text-red-600 hover:bg-red-50 rounded-xl px-6 py-3 text-[10px] uppercase tracking-widest font-bold transition-colors">
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Password Modal */}
            <AnimatePresence>
                {showPasswordModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowPasswordModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">Security</h2>
                                <h3 className="text-2xl font-serif text-gray-900">Update Password</h3>
                            </div>
                            <form onSubmit={handlePasswordUpdate} className="space-y-5">
                                {[
                                    { label: 'Current Password', key: 'current' },
                                    { label: 'New Password', key: 'new' },
                                    { label: 'Confirm New Password', key: 'confirm' },
                                ].map(({ label, key }) => (
                                    <div key={key} className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">{label}</label>
                                        <input type="password" required
                                            value={passwordData[key as keyof typeof passwordData]}
                                            onChange={(e) => setPasswordData({ ...passwordData, [key]: e.target.value })}
                                            className="w-full bg-gray-50 border border-transparent px-5 py-3 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-gray-200 transition-all text-gray-900" />
                                    </div>
                                ))}
                                <div className="flex gap-3 pt-4">
                                    <button type="button" onClick={() => setShowPasswordModal(false)}
                                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-gray-50 text-gray-700">Cancel</button>
                                    <button type="submit" disabled={isUpdatingPassword}
                                        className="flex-1 px-4 py-3 bg-brand-600 text-white rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-brand-700 disabled:opacity-50">
                                        {isUpdatingPassword ? 'Updating...' : 'Update'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Account Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => { setShowDeleteModal(false); setDeleteStep('request'); setOtpValue(''); }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-2xl p-8 shadow-2xl space-y-6">
                            <div className="space-y-2">
                                <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-red-500">Danger Zone</h2>
                                <h3 className="text-2xl font-serif text-gray-900">Delete Account</h3>
                            </div>
                            {deleteStep === 'request' ? (
                                <div className="space-y-5">
                                    <p className="text-sm text-gray-500 font-light leading-relaxed">
                                        This action is <span className="font-bold text-red-600">permanent</span>. All your data will be erased.
                                        We will send a verification code to <span className="font-bold text-gray-900">{user.email}</span>.
                                    </p>
                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => setShowDeleteModal(false)}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-gray-50 text-gray-700">Cancel</button>
                                        <button onClick={handleSendOtp} disabled={isSendingOtp}
                                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 disabled:opacity-50">
                                            {isSendingOtp ? 'Sending...' : 'Send OTP'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <p className="text-sm text-gray-500 font-light">Enter the 6-digit code sent to your email.</p>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Verification Code</label>
                                        <input type="text" maxLength={6} placeholder="000000" value={otpValue}
                                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                                            className="w-full bg-gray-50 border border-transparent px-5 py-3 rounded-xl text-center text-xl tracking-[0.5em] focus:outline-none focus:bg-white focus:border-gray-200 transition-all text-gray-900" />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button onClick={() => setDeleteStep('request')}
                                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-gray-50 text-gray-700">Back</button>
                                        <button onClick={handleVerifyAndDelete} disabled={otpValue.length !== 6 || isDeleting}
                                            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-[10px] uppercase tracking-widest font-bold hover:bg-red-700 disabled:opacity-50">
                                            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Avatar Modal */}
            <AnimatePresence>
                {showAvatarModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowAvatarModal(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-2xl bg-white rounded-2xl p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h2 className="text-[10px] font-bold uppercase tracking-[0.4em] text-gray-500">Personalization</h2>
                                    <h3 className="text-2xl font-serif text-gray-900">Choose Profile Picture</h3>
                                </div>
                                <button onClick={() => setShowAvatarModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="h-5 w-5 text-gray-700" />
                                </button>
                            </div>
                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Cartoon Avatars</h4>
                                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                                        {['avataaars', 'personas', 'lorelei', 'adventurer', 'bottts', 'fun-emoji'].map((style) => (
                                            <button key={style}
                                                onClick={() => selectPredefinedAvatar(`https://api.dicebear.com/7.x/${style}/svg?seed=${style}`)}
                                                className="aspect-square rounded-xl bg-gray-100 overflow-hidden hover:ring-2 hover:ring-brand-500 transition-all hover:scale-105">
                                                <img src={`https://api.dicebear.com/7.x/${style}/svg?seed=${style}`} alt="Avatar" className="w-full h-full object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Lettered Logos</h4>
                                    <div className="grid grid-cols-6 sm:grid-cols-9 gap-3">
                                        {Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map((letter, index) => {
                                            const colors = ['D4AF37', '1A237E', '1B5E20', '880E4F', '212121', 'AD1457', '4E342E', '37474F', '000000'];
                                            const color = colors[index % colors.length];
                                            return (
                                                <button key={letter}
                                                    onClick={() => selectPredefinedAvatar(`https://api.dicebear.com/7.x/initials/svg?seed=${letter}&backgroundColor=${color}&fontFamily=serif`)}
                                                    style={{ backgroundColor: `#${color}` }}
                                                    className="aspect-square rounded-xl flex items-center justify-center text-white font-serif font-bold text-lg hover:scale-110 transition-transform shadow-md">
                                                    {letter}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Profile;
