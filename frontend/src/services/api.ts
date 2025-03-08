import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { setupAxiosInterceptors } from './errorHandler';

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

// Cache configuration
interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export type ApiResponse<T> = {
  data: T;
  status: number;
  message?: string;
};

export type ApiError = {
  message: string;
  status: number;
  code?: string;
};

class ApiClient {
  private static instance: ApiClient;
  private client: AxiosInstance;
  private cache: Map<string, { data: unknown; timestamp: number }>;
  private readonly cacheDuration = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.cache = new Map();
    this.setupInterceptors();
  }

  public static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors(): void {
    setupAxiosInterceptors(this.client);

    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }

  private getCacheKey(config: AxiosRequestConfig): string {
    return `${config.method}-${config.url}-${JSON.stringify(config.params || {})}-${JSON.stringify(config.data || {})}`;
  }

  private isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheDuration;
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const cacheKey = this.getCacheKey(config);

    // Try to get from cache for GET requests
    if (config.method?.toLowerCase() === 'get') {
      const cached = this.cache.get(cacheKey);
      if (cached && this.isCacheValid(cached.timestamp)) {
        return cached.data as T;
      }
    }

    try {
      const response: AxiosResponse<ApiResponse<T>> = await this.client.request(config);
      
      // Cache GET responses
      if (config.method?.toLowerCase() === 'get') {
        this.cache.set(cacheKey, {
          data: response.data.data,
          timestamp: Date.now(),
        });
      }

      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error) && error.response) {
      const apiError = error.response.data as ApiError;
      return new Error(apiError.message || 'An error occurred');
    }
    return new Error('An unexpected error occurred');
  }

  public async get<T>(url: string, config?: Omit<AxiosRequestConfig, 'method' | 'url'>): Promise<T> {
    return this.request<T>({ ...config, method: 'get', url });
  }

  public async post<T>(url: string, data?: unknown, config?: Omit<AxiosRequestConfig, 'method' | 'url' | 'data'>): Promise<T> {
    return this.request<T>({ ...config, method: 'post', url, data });
  }

  public async put<T>(url: string, data?: unknown, config?: Omit<AxiosRequestConfig, 'method' | 'url' | 'data'>): Promise<T> {
    return this.request<T>({ ...config, method: 'put', url, data });
  }

  public async delete<T>(url: string, config?: Omit<AxiosRequestConfig, 'method' | 'url'>): Promise<T> {
    return this.request<T>({ ...config, method: 'delete', url });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public invalidateCache(urlPattern: string): void {
    for (const [key] of this.cache) {
      if (key.includes(urlPattern)) {
        this.cache.delete(key);
      }
    }
  }
}

export const api = ApiClient.getInstance();

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
