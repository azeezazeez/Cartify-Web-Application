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

// Helper to get current user from localStorage
const getCurrentUser = (): any | null => {
  const user = localStorage.getItem('cartify_currentUser');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
};

// Helper to get auth token
const getAuthToken = (): string | null => {
  const user = getCurrentUser();
  return user?.token || null;
};

// Helper to get current user ID from localStorage
const getUserId = (): number | null => {
  const user = getCurrentUser();
  return user?.id || null;
};

// Helper to check if current user is admin
const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === 'ADMIN';
};

// Helper to get auth headers for authenticated requests
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

// Standard response handler with better error handling
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    try {
      const result = JSON.parse(text);
      throw new Error(result.message || `HTTP ${response.status}: ${response.statusText}`);
    } catch (e) {
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
  // Auth
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

  // Products (Public - No Auth)
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

  // Cart (Requires Auth)
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
    } catch (error) {
      console.error('Error fetching cart:', error);
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

  // Wishlist (Requires Auth)
  async getWishlist(): Promise<Product[]> {
    const userId = getUserId();
    if (!userId) return [];

    try {
      const response = await fetch(`${BASE_URL}/wishlist/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return [];
      const result = await response.json();

      if (result && typeof result === 'object') {
        if ('success' in result && 'data' in result) {
          return Array.isArray(result.data) ? result.data : [];
        }
        if (Array.isArray(result)) return result;
        if (result.items && Array.isArray(result.items)) return result.items;
      }
      return [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  },

  async toggleWishlist(productId: string): Promise<{ isWishlisted: boolean }> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    try {
      console.log('Toggling wishlist - User ID:', userId, 'Product ID:', productId);

      // First, try to ADD to wishlist
      const addResponse = await fetch(`${BASE_URL}/wishlist/add`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, productId }),
      });

      // If add succeeds (200 OK), product was NOT in wishlist - now it is added
      if (addResponse.ok) {
        console.log('Successfully added to wishlist');
        return { isWishlisted: true };
      }

      // If add fails with 409 (Conflict), product IS already in wishlist - so remove it
      if (addResponse.status === 409) {
        console.log('Product already in wishlist, removing...');
        const removeResponse = await fetch(`${BASE_URL}/wishlist/remove/${userId}/${productId}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });

        if (removeResponse.ok) {
          console.log('Successfully removed from wishlist');
          return { isWishlisted: false };
        } else {
          const errorData = await removeResponse.json();
          console.error('Remove failed:', errorData);
          throw new Error(errorData.message || 'Failed to remove from wishlist');
        }
      }

      // Handle other errors
      const errorData = await addResponse.json();
      throw new Error(errorData.message || 'Failed to toggle wishlist');
    } catch (error) {
      console.error('Toggle wishlist error:', error);
      throw error;
    }
  },

  async createOrder(): Promise<any> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/orders/place/${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ shippingAddress: 'Default Address' }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      throw new Error(result.message || 'Failed to place order');
    }
    return result.data;
  },

  async getOrderHistory(): Promise<any[]> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/orders/user/${userId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to fetch orders: HTTP ${response.status} — ${text}`);
    }

    const result = await response.json();

    if (result?.success && Array.isArray(result.data)) return result.data;
    if (Array.isArray(result)) return result;
    return [];
  },

  async getOrderById(orderId: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/orders/${orderId}`, {
      method: 'GET',
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

  // ─── Profile (uses userId-based endpoints with localStorage fallback) ────────

  async getUserProfile(): Promise<any> {
    const userId = getUserId();
    const localUser = getCurrentUser();

    // Always return localStorage data as the base — it's always fresh from login
    if (!userId || !localUser) throw new Error('User not logged in');

    // Try the user-specific endpoint; fall back to localStorage if unavailable
    const endpoints = [
      `${BASE_URL}/users/${userId}`,
      `${BASE_URL}/auth/users/${userId}`,
      `${BASE_URL}/admin/customers/${userId}`,
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, { headers: getAuthHeaders() });
        if (response.ok) {
          const result = await response.json();
          const data = result?.data ?? result;
          // Merge with localStorage so we never lose token/role
          return { ...localUser, ...data };
        }
      } catch {
        // try next
      }
    }

    // All endpoints failed — return localStorage data so the UI still works
    console.warn('Profile endpoint unavailable, using cached user data');
    return localUser;
  },

  async updateUserProfile(profileData: any): Promise<any> {
    const userId = getUserId();
    const localUser = getCurrentUser();
    if (!userId || !localUser) throw new Error('User not logged in');

    // Try user-specific PUT endpoints
    const endpoints = [
      `${BASE_URL}/users/${userId}`,
      `${BASE_URL}/auth/users/${userId}`,
    ];

    for (const url of endpoints) {
      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(profileData),
        });
        if (response.ok) {
          const result = await response.json();
          const updated = result?.data ?? result;
          // Persist updated data to localStorage so it survives page refreshes
          const merged = { ...localUser, ...updated };
          localStorage.setItem('cartify_currentUser', JSON.stringify(merged));
          return merged;
        }
      } catch {
        // try next
      }
    }

    // No endpoint worked — update localStorage only so the UI reflects the change
    console.warn('Profile update endpoint unavailable, saving locally only');
    const merged = { ...localUser, ...profileData };
    localStorage.setItem('cartify_currentUser', JSON.stringify(merged));
    return merged;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    // Try multiple likely password-change endpoints
    const attempts: Array<{ url: string; method: string; body: object }> = [
      {
        url: `${BASE_URL}/auth/change-password`,
        method: 'PUT',
        body: { userId, currentPassword, newPassword },
      },
      {
        url: `${BASE_URL}/users/${userId}/change-password`,
        method: 'PUT',
        body: { currentPassword, newPassword },
      },
      {
        url: `${BASE_URL}/auth/reset-password`,
        method: 'POST',
        body: { userId, currentPassword, newPassword },
      },
    ];

    for (const { url, method, body } of attempts) {
      try {
        const response = await fetch(url, {
          method,
          headers: getAuthHeaders(),
          body: JSON.stringify(body),
        });
        if (response.ok) return; // success
        if (response.status === 400 || response.status === 401) {
          // Definitive failure (wrong current password etc.) — surface the error
          const result = await response.json().catch(() => ({}));
          throw new Error(result.message || 'Incorrect current password');
        }
        // 404 / 405 → try next endpoint
      } catch (err: any) {
        // Re-throw only definitive errors, not "endpoint not found" ones
        if (err.message && !err.message.startsWith('HTTP')) throw err;
      }
    }

    throw new Error('Password change is not supported by the server at this time');
  },

  // Admin Methods (Requires Auth + Admin Role)
  async adminGetAllOrders(): Promise<AdminOrder[]> {
    if (!isAdmin()) throw new Error('Unauthorized: Admin access required');

    const response = await fetch(`${BASE_URL}/admin/orders`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to fetch orders');
    return data.data;
  },

  async adminGetOrderStats(): Promise<OrderStats> {
    if (!isAdmin()) throw new Error('Unauthorized: Admin access required');

    const response = await fetch(`${BASE_URL}/admin/orders/stats`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to fetch stats');
    return data.data;
  },

  async adminUpdateOrderStatus(orderId: string, status: string): Promise<AdminOrder> {
    if (!isAdmin()) throw new Error('Unauthorized: Admin access required');

    const response = await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to update order status');
    return data.data;
  },

  async adminGetAllCustomers(): Promise<AdminCustomer[]> {
    if (!isAdmin()) throw new Error('Unauthorized: Admin access required');

    const response = await fetch(`${BASE_URL}/admin/customers`, {
      headers: getAuthHeaders(),
    });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to fetch customers');
    return data.data;
  },

  // Helper Methods
  isAdmin(): boolean {
    return isAdmin();
  },

  getCurrentUser(): any | null {
    return getCurrentUser();
  },

  getUserId(): number | null {
    return getUserId();
  },

  getAuthToken(): string | null {
    return getAuthToken();
  }
};
