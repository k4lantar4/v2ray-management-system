import { create } from 'zustand';
import { services } from '@/services/api';
import {
  Subscription,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  PaginationParams,
} from '@/types/api';

interface SubscriptionState {
  subscriptions: Subscription[];
  selectedSubscription: Subscription | null;
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  getSubscriptions: (params?: PaginationParams) => Promise<void>;
  getSubscription: (id: number) => Promise<void>;
  createSubscription: (data: CreateSubscriptionDto) => Promise<void>;
  updateSubscription: (id: number, data: UpdateSubscriptionDto) => Promise<void>;
  deleteSubscription: (id: number) => Promise<void>;
  renewSubscription: (id: number, duration: number) => Promise<void>;
  cancelSubscription: (id: number) => Promise<void>;
  getSubscriptionConfig: (id: number) => Promise<any>;
  getSubscriptionUsage: (id: number) => Promise<any>;
  getSubscriptionInvoices: (id: number) => Promise<any[]>;
  generateSubscriptionConfig: (id: number) => Promise<any>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  selectedSubscription: null,
  total: 0,
  page: 1,
  limit: 10,
  isLoading: false,
  error: null,

  getSubscriptions: async (params?: PaginationParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await services.subscriptions.getSubscriptions(params);
      set({
        subscriptions: response.items,
        total: response.total,
        page: response.page,
        limit: response.limit,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch subscriptions',
        isLoading: false,
      });
      throw error;
    }
  },

  getSubscription: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const subscription = await services.subscriptions.getSubscription(id);
      set({
        selectedSubscription: subscription,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch subscription',
        isLoading: false,
      });
      throw error;
    }
  },

  createSubscription: async (data: CreateSubscriptionDto) => {
    set({ isLoading: true, error: null });
    try {
      await services.subscriptions.createSubscription(data);
      await get().getSubscriptions({ page: get().page, limit: get().limit });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create subscription',
        isLoading: false,
      });
      throw error;
    }
  },

  updateSubscription: async (id: number, data: UpdateSubscriptionDto) => {
    set({ isLoading: true, error: null });
    try {
      const updatedSubscription = await services.subscriptions.updateSubscription(id, data);
      set((state) => ({
        subscriptions: state.subscriptions.map((subscription) =>
          subscription.id === id ? updatedSubscription : subscription
        ),
        selectedSubscription: updatedSubscription,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update subscription',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteSubscription: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await services.subscriptions.deleteSubscription(id);
      set((state) => ({
        subscriptions: state.subscriptions.filter((subscription) => subscription.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete subscription',
        isLoading: false,
      });
      throw error;
    }
  },

  renewSubscription: async (id: number, duration: number) => {
    set({ isLoading: true, error: null });
    try {
      const updatedSubscription = await services.subscriptions.renewSubscription(id, duration);
      set((state) => ({
        subscriptions: state.subscriptions.map((subscription) =>
          subscription.id === id ? updatedSubscription : subscription
        ),
        selectedSubscription: updatedSubscription,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to renew subscription',
        isLoading: false,
      });
      throw error;
    }
  },

  cancelSubscription: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const updatedSubscription = await services.subscriptions.cancelSubscription(id);
      set((state) => ({
        subscriptions: state.subscriptions.map((subscription) =>
          subscription.id === id ? updatedSubscription : subscription
        ),
        selectedSubscription: updatedSubscription,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to cancel subscription',
        isLoading: false,
      });
      throw error;
    }
  },

  getSubscriptionConfig: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const config = await services.subscriptions.getSubscriptionConfig(id);
      set({ isLoading: false });
      return config;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to get subscription config',
        isLoading: false,
      });
      throw error;
    }
  },

  getSubscriptionUsage: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const usage = await services.subscriptions.getSubscriptionUsage(id);
      set({ isLoading: false });
      return usage;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to get subscription usage',
        isLoading: false,
      });
      throw error;
    }
  },

  getSubscriptionInvoices: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const invoices = await services.subscriptions.getSubscriptionInvoices(id);
      set({ isLoading: false });
      return invoices;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to get subscription invoices',
        isLoading: false,
      });
      throw error;
    }
  },

  generateSubscriptionConfig: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const config = await services.subscriptions.generateSubscriptionConfig(id);
      set({ isLoading: false });
      return config;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to generate subscription config',
        isLoading: false,
      });
      throw error;
    }
  },
})); 