import { BaseApiService } from './base';
import { AuthResponse, LoginDto } from '@/types/api';

export class AuthService extends BaseApiService {
  private static instance: AuthService;

  private constructor() {
    super();
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/login', data);
    localStorage.setItem('token', response.token);
    return response;
  }

  async loginWithTelegram(telegramData: any): Promise<AuthResponse> {
    const response = await this.post<AuthResponse>('/auth/telegram', telegramData);
    localStorage.setItem('token', response.token);
    return response;
  }

  async logout(): Promise<void> {
    await this.post('/auth/logout');
    localStorage.removeItem('token');
  }

  async getCurrentUser(): Promise<AuthResponse['user']> {
    return this.get('/auth/me');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }
} 