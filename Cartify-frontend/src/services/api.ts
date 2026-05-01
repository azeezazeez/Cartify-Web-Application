const BASE_URL = 'https://cartify-web-application.onrender.com/api';

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem('cartify_currentUser') || 'null');
  } catch {
    return null;
  }
};

const isAdmin = () => getUser()?.role === 'ADMIN';

const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: getUser()?.token ? `Bearer ${getUser().token}` : ''
});

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.data || data;
}

export const api = {
  adminGetAllOrders: async () => {
    if (!isAdmin()) throw new Error('Admin only');
    return handle(await fetch(`${BASE_URL}/admin/orders`, { headers: headers() }));
  },

  adminGetOrderStats: async () => {
    if (!isAdmin()) throw new Error('Admin only');
    return handle(await fetch(`${BASE_URL}/admin/orders/stats`, { headers: headers() }));
  },

  adminUpdateOrderStatus: async (orderId: string, status: string) => {
    if (!isAdmin()) throw new Error('Admin only');

    return handle(
      await fetch(`${BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify({ status })
      })
    );
  },

  adminGetAllCustomers: async () => {
    if (!isAdmin()) throw new Error('Admin only');
    return handle(await fetch(`${BASE_URL}/admin/customers`, { headers: headers() }));
  }
};
