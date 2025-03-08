import { BaseApiService } from './base';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  PaginationParams,
  PaginatedResponse,
} from '@/types/api';

export class UserService extends BaseApiService {
  private static instance: UserService;

  private constructor() {
    super();
  }

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    return this.get('/users', { params });
  }

  async getUser(id: number): Promise<User> {
    return this.get(`/users/${id}`);
  }

  async createUser(data: CreateUserDto): Promise<User> {
    return this.post('/users', data);
  }

  async updateUser(id: number, data: UpdateUserDto): Promise<User> {
    return this.patch(`/users/${id}`, data);
  }

  async deleteUser(id: number): Promise<void> {
    return this.delete(`/users/${id}`);
  }

  async blockUser(id: number): Promise<User> {
    return this.post(`/users/${id}/block`);
  }

  async unblockUser(id: number): Promise<User> {
    return this.post(`/users/${id}/unblock`);
  }

  async addCredit(id: number, amount: number): Promise<User> {
    return this.post(`/users/${id}/credit`, { amount });
  }

  async getUserSubscriptions(id: number): Promise<any[]> {
    return this.get(`/users/${id}/subscriptions`);
  }

  async getUserTransactions(id: number): Promise<any[]> {
    return this.get(`/users/${id}/transactions`);
  }
} 