import { Product, CartItem } from '../types';

const BASE_URL = 'https://cartify-web-application.onrender.com/api';

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface UserProfile {
  id: number;
  email: string;
  username: string;
  role: string;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
  profileImage?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

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

// ─── localStorage helpers ─────────────────────────────────────────────────────

const getCurrentUser = (): any | null => {
  try {
    const stored = localStorage.getItem('cartify_currentUser');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const getAuthToken = (): string | null => getCurrentUser()?.token ?? null;
const getUserId    = (): number | null => getCurrentUser()?.id    ?? null;
const isAdmin      = (): boolean        => getCurrentUser()?.role === 'ADMIN';

const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
};

// ─── Generic response handler ─────────────────────────────────────────────────

async function handleResponse<T>(response: Response): Promise<T> {
  // Try to parse JSON regardless of status so we can surface backend messages
  let result: any;
  try {
    result = await response.json();
  } catch {
    if (!response.ok)
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return undefined as T;
  }

  if (!response.ok) {
    throw new Error(result?.message || `HTTP ${response.status}: ${response.statusText}`);
  }

  // ApiResponse wrapper: { success, message, data }
  if (result && typeof result === 'object' && 'success' in result) {
    if (!result.success) throw new Error(result.message || 'API request failed');
    return (result.data !== undefined ? result.data : result) as T;
  }

  return result as T;
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {

  // ── Auth ──────────────────────────────────────────────────────────────────

  async login(credentials: { email: string; password: string }) {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok || !data.success)
      throw new Error(data.message || 'Login failed');

    if (data.data)
      localStorage.setItem('cartify_currentUser', JSON.stringify(data.data));

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

  // ── Profile ───────────────────────────────────────────────────────────────

  /** GET /api/auth/profile — fetch the current user's full profile. */
  async getUserProfile(): Promise<UserProfile> {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return handleResponse<UserProfile>(response);
  },

  /**
   * PUT /api/auth/profile — update profile fields.
   *
   * FIX: We no longer strip out null / empty-string values.
   * Sending null explicitly tells the backend to CLEAR that field.
   * Previously the filter caused cleared fields to be silently dropped,
   * so the old value stayed in the database forever.
   */
  async updateUserProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(profileData),   // send as-is, nulls included
    });
    return handleResponse<UserProfile>(response);
  },

  /**
   * Convenience wrapper: update only the profile image URL.
   * Used by the avatar picker in Profile.tsx.
   */
  async updateProfileImage(imageUrl: string): Promise<UserProfile> {
    return api.updateUserProfile({ profileImage: imageUrl });
  },

  /** PUT /api/auth/profile/change-password */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/auth/profile/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return handleResponse<void>(response);
  },

  /**
   * DELETE /api/auth/profile — permanently remove the account.
   * FIX: This method was missing entirely; the old code called resetPassword()
   * as a proxy for deletion, which only changed the password — never deleted.
   */
  async deleteAccount(): Promise<void> {
    const response = await fetch(`${BASE_URL}/auth/profile`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse<void>(response);
  },

  // ── Forgot / Reset Password ───────────────────────────────────────────────

  async generateOtp(email: string) {
    const response = await fetch(`${BASE_URL}/auth/forgot-password/generate-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleResponse<any>(response);
  },

  async resetPassword(resetData: { email: string; otp: string; newPassword: string }) {
    const response = await fetch(`${BASE_URL}/auth/forgot-password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resetData),
    });
    return handleResponse<any>(response);
  },

  // ── Products ──────────────────────────────────────────────────────────────

  async getProducts(category?: string, search?: string): Promise<Product[]> {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (search) params.append('search', search);

    const qs = params.toString();
    const response = await fetch(`${BASE_URL}/products${qs ? `?${qs}` : ''}`);
    return handleResponse<Product[]>(response);
  },

  async getProductById(id: string): Promise<Product> {
    const response = await fetch(`${BASE_URL}/products/${id}`);
    return handleResponse<Product>(response);
  },

  // ── Cart ──────────────────────────────────────────────────────────────────

  async getCart(): Promise<any> {
    const userId = getUserId();
    if (!userId) return { items: [], totalItems: 0, totalAmount: 0 };

    try {
      const response = await fetch(`${BASE_URL}/cart/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return { items: [], totalItems: 0, totalAmount: 0 };
      const result = await response.json();
      return result.data ?? result;
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

  // ── Wishlist ──────────────────────────────────────────────────────────────

  async getWishlist(): Promise<Product[]> {
    const userId = getUserId();
    if (!userId) return [];

    try {
      const response = await fetch(`${BASE_URL}/wishlist/${userId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return [];
      const result = await response.json();

      if (result?.success && Array.isArray(result.data)) return result.data;
      if (Array.isArray(result)) return result;
      if (result?.items && Array.isArray(result.items)) return result.items;
      return [];
    } catch {
      return [];
    }
  },

  async toggleWishlist(productId: string): Promise<{ isWishlisted: boolean }> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    // Try to add; if the server returns 409 the item is already there → remove it
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
      const err = await removeResponse.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to remove from wishlist');
    }

    const err = await addResponse.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to toggle wishlist');
  },

  // ── Orders ────────────────────────────────────────────────────────────────

  async createOrder(): Promise<any> {
    const userId = getUserId();
    if (!userId) throw new Error('User not logged in');

    const response = await fetch(`${BASE_URL}/orders/place/${userId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ shippingAddress: 'Default Address' }),
    });

    const result = await response.json();
    if (!response.ok || !result.success)
      throw new Error(result.message || 'Failed to place order');
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

  // ── Admin ─────────────────────────────────────────────────────────────────

  async adminGetAllOrders(): Promise<AdminOrder[]> {
    if (!isAdmin()) throw new Error('Unauthorized: Admin access required');
    const response = await fetch(`${BASE_URL}/admin/orders`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to fetch orders');
    return data.data;
  },

  async adminGetOrderStats(): Promise<OrderStats> {
    if (!isAdmin()) throw new Error('Unauthorized: Admin access required');
    const response = await fetch(`${BASE_URL}/admin/orders/stats`, { headers: getAuthHeaders() });
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
    const response = await fetch(`${BASE_URL}/admin/customers`, { headers: getAuthHeaders() });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || 'Failed to fetch customers');
    return data.data;
  },

  // ── Convenience re-exports ────────────────────────────────────────────────
  isAdmin,
  getCurrentUser,
  getUserId,
  getAuthToken,
};
