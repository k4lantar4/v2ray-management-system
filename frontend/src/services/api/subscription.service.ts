import { BaseApiService } from './base';
import {
  Subscription,
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  PaginationParams,
  PaginatedResponse,
} from '@/types/api';

export class SubscriptionService extends BaseApiService {
  private static instance: SubscriptionService;

  private constructor() {
    super();
  }

  public static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async getSubscriptions(params?: PaginationParams): Promise<PaginatedResponse<Subscription>> {
    return this.get('/subscriptions', { params });
  }

  async getSubscription(id: number): Promise<Subscription> {
    return this.get(`/subscriptions/${id}`);
  }

  async createSubscription(data: CreateSubscriptionDto): Promise<Subscription> {
    return this.post('/subscriptions', data);
  }

  async updateSubscription(id: number, data: UpdateSubscriptionDto): Promise<Subscription> {
    return this.patch(`/subscriptions/${id}`, data);
  }

  async deleteSubscription(id: number): Promise<void> {
    return this.delete(`/subscriptions/${id}`);
  }

  async renewSubscription(id: number, duration: number): Promise<Subscription> {
    return this.post(`/subscriptions/${id}/renew`, { duration });
  }

  async cancelSubscription(id: number): Promise<Subscription> {
    return this.post(`/subscriptions/${id}/cancel`);
  }

  async getSubscriptionConfig(id: number): Promise<any> {
    return this.get(`/subscriptions/${id}/config`);
  }

  async getSubscriptionUsage(id: number): Promise<any> {
    return this.get(`/subscriptions/${id}/usage`);
  }

  async getSubscriptionInvoices(id: number): Promise<any[]> {
    return this.get(`/subscriptions/${id}/invoices`);
  }

  async generateSubscriptionConfig(id: number): Promise<any> {
    return this.post(`/subscriptions/${id}/generate-config`);
  }
} 