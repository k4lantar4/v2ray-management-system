import axios, { AxiosInstance } from 'axios';
import { useRouter } from 'next/router';

// تعریف interface های مورد نیاز
interface LoginData {
  phone: string;
  password: string;
}

interface User {
  id: number;
  phone: string;
  full_name: string;
  role: string;
  status: string;
  wallet_balance: number;
  language: string;
  last_login: string;
}

interface Subscription {
  id: number;
  user_id: number;
  plan: string;
  start_date: string;
  end_date: string;
  status: string;
  traffic_limit: number;
  traffic_used: number;
}

// ایجاد نمونه axios با تنظیمات پایه
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// افزودن interceptor برای مدیریت توکن
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// افزودن interceptor برای مدیریت خطاها
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// سرویس‌های احراز هویت
export const authService = {
  login: async (data: LoginData) => {
    const response = await api.post('/auth/login/access-token', data);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  resetPassword: async (phone: string) => {
    return await api.post('/auth/password-reset/request', { phone });
  },

  verifyResetCode: async (phone: string, code: string, new_password: string) => {
    return await api.post('/auth/password-reset/verify', {
      phone,
      code,
      new_password,
    });
  },
};

// سرویس مدیریت کاربران
export const userService = {
  getUsers: async (params?: any) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUser: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  createUser: async (data: Partial<User>) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  updateUser: async (id: number, data: Partial<User>) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id: number) => {
    return await api.delete(`/users/${id}`);
  },
};

// سرویس مدیریت اشتراک‌ها
export const subscriptionService = {
  getSubscriptions: async (params?: any) => {
    const response = await api.get('/subscriptions', { params });
    return response.data;
  },

  getSubscription: async (id: number) => {
    const response = await api.get(`/subscriptions/${id}`);
    return response.data;
  },

  createSubscription: async (data: Partial<Subscription>) => {
    const response = await api.post('/subscriptions', data);
    return response.data;
  },

  updateSubscription: async (id: number, data: Partial<Subscription>) => {
    const response = await api.put(`/subscriptions/${id}`, data);
    return response.data;
  },

  deleteSubscription: async (id: number) => {
    return await api.delete(`/subscriptions/${id}`);
  },
};

// سرویس مدیریت تیکت‌ها
export const ticketService = {
  getTickets: async (params?: any) => {
    const response = await api.get('/tickets', { params });
    return response.data;
  },

  getTicket: async (id: number) => {
    const response = await api.get(`/tickets/${id}`);
    return response.data;
  },

  createTicket: async (data: any) => {
    const response = await api.post('/tickets', data);
    return response.data;
  },

  replyToTicket: async (id: number, message: string) => {
    const response = await api.post(`/tickets/${id}/reply`, { message });
    return response.data;
  },

  closeTicket: async (id: number) => {
    const response = await api.post(`/tickets/${id}/close`);
    return response.data;
  },
};

export default api;
