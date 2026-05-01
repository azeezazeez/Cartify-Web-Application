import { Product, CartItem } from '../types';

const BASE_URL = 'https://cartify-web-application.onrender.com/api';

export interface AdminOrder {
  orderId: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  totalAmount: number;
  status: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  shippingAddress: string;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  recentOrders: AdminOrder[];
}

export interface AdminCustomer {
  id: number;
  name: string;
  email: string;
  role: string;
  joinedDate: string;
  totalOrders: number;
  totalSpent: number;
}

// Helpers
const getCurrentUser = (): any | null => {
  const user = localStorage.getItem('cartify_currentUser');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

const getAuthToken = (): string | null => {
  const user = getCurrentUser();
  return user?.token || null;
};

const getUserId = (): number | null => {
  const user = getCurrentUser();
  return user?.id || null;
};

const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'ADMIN';
};

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    try {
      const result = JSON.parse(text);
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    } catch {
      throw new Error(text || `HTTP ${response.status}: ${response.statusText}`);
    }
  }

  const result = await response.json();

  if (result && typeof result === 'object' && 'success' in result && !result.success) {
    throw new Error(result.message || 'API request failed');
  }

  return (result && typeof result === 'object' && 'data' in result) ? result.data : result;
}

export const api = {

  // AUTH
  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }

    if (data.data) {
      localStorage.setItem('cartify_currentUser', JSON.stringify(data.data));
    }

    return { user: data.data };
  },

  async register(userData: any) {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return handleResponse<any>(response);
  },

  logout() {
    localStorage.removeItem('cartify_currentUser');
  },

  async generateOtp(email: string) {
    const response = await fetch(`${BASE_URL}/auth/forgot-password/generate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<any>(response);
  },

  async resetPassword(resetData: any) {
    const response = await fetch(`${BASE_URL}/auth/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resetData),
    });
    return handleResponse<any>(response);
  },

  // PRODUCTS
  async getProducts(category?: string, search?: string): Promise<Product[]> {
    let url = `${BASE_URL}/products`;
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);

    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;

    const response = await fetch(url);
    return handleResponse<Product[]>(response);
  },

  async getProductById(id: string): Promise<Product> {
    const response = await fetch(`${BASE_URL}/products/${id}`);
    return handleResponse<Product>(response);
  },

  // CART
  async getCart(): Promise<any> {
    const userId = getUserId();
    if (!userId) return { items: [], totalItems: 0, totalAmount: 0 };

    try {
      const response = await fetch(`${BASE_URL}/cart/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return { items: [], totalItems: 0, totalAmount: 0 };
      const result = await response.json();
      return result.data || result;
    } catch {
      return { items: [], totalItems: 0, totalAmount: 0 };
    }
  },

  async addToCart(productId: string, quantity: number = 1): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/cart/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, productId, quantity }),
    });
    await handleResponse<any>(response);
  },

  async updateCartQuantity(productId: string, quantity: number): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/cart/update`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, productId, quantity }),
    });
    await handleResponse<any>(response);
  },

  async removeFromCart(productId: string): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/cart/remove/${userId}/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleResponse<any>(response);
  },

  async clearCart(): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/cart/clear/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    await handleResponse<any>(response);
  },

  // WISHLIST
  async getWishlist(): Promise<Product[]> {
    const userId = getUserId();
    if (!userId) return [];

    try {
      const response = await fetch(`${BASE_URL}/wishlist/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return [];
      const result = await response.json();
      return result.data || [];
    } catch {
      return [];
    }
  },

  async toggleWishlist(productId: string): Promise<{ isWishlisted: boolean }> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const addResponse = await fetch(`${BASE_URL}/wishlist/add`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ userId, productId }),
    });

    if (addResponse.ok) return { isWishlisted: true };

    if (addResponse.status === 409) {
      const removeResponse = await fetch(`${BASE_URL}/wishlist/remove/${userId}/${productId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (removeResponse.ok) return { isWishlisted: false };
    }

    throw new Error('Failed to toggle wishlist');
  },

  // ORDERS
  async createOrder(): Promise<any> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/orders/place/${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ shippingAddress: 'Default Address' }),
    });

    return handleResponse<any>(response);
  },

  async getOrderHistory(): Promise<any[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/orders/user/${userId}`, {
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    return result.data || [];
  },

  async getOrderById(orderId: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  async cancelOrder(orderId: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/orders/${orderId}/cancel`, {
      method: 'PUT',
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  // ✅ FIXED HERE
  async updateUserProfile(profileData: any): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),
    });
    return handleResponse<any>(response);
  },

  async getUserProfile(): Promise<any> {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<any>(response);
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/auth/profile/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse<void>(response);
  },

  // ADMIN
  async adminGetAllOrders(): Promise<AdminOrder[]> {
    if (!isAdmin()) throw new Error('Unauthorized');

    const response = await fetch(`${BASE_URL}/admin/orders`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminOrder[]>(response);
  },

  async adminGetOrderStats(): Promise<OrderStats> {
    if (!isAdmin()) throw new Error('Unauthorized');

    const response = await fetch(`${BASE_URL}/admin/orders/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<OrderStats>(response);
  },

  async adminUpdateOrderStatus(orderId: string, status: string): Promise<AdminOrder> {
    if (!isAdmin()) throw new Error('Unauthorized');

    const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse<AdminOrder>(response);
  },

  async adminGetAllCustomers(): Promise<AdminCustomer[]> {
    if (!isAdmin()) throw new Error('Unauthorized');

    const response = await fetch(`${BASE_URL}/admin/customers`, {
      headers: getAuthHeaders(),
    });
    return handleResponse<AdminCustomer[]>(response);
  },

  // HELPERS
  isAdmin() {
    return isAdmin();
  },

  getCurrentUser() {
    return getCurrentUser();
  },

  getUserId() {
    return getUserId();
  },

  getAuthToken() {
    return getAuthToken();
  }
};
