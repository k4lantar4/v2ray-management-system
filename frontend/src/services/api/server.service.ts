import { BaseApiService } from './base';
import {
  Server,
  CreateServerDto,
  UpdateServerDto,
  PaginationParams,
  PaginatedResponse,
} from '@/types/api';

export class ServerService extends BaseApiService {
  private static instance: ServerService;

  private constructor() {
    super();
  }

  public static getInstance(): ServerService {
    if (!ServerService.instance) {
      ServerService.instance = new ServerService();
    }
    return ServerService.instance;
  }

  async getServers(params?: PaginationParams): Promise<PaginatedResponse<Server>> {
    return this.get('/servers', { params });
  }

  async getServer(id: number): Promise<Server> {
    return this.get(`/servers/${id}`);
  }

  async createServer(data: CreateServerDto): Promise<Server> {
    return this.post('/servers', data);
  }

  async updateServer(id: number, data: UpdateServerDto): Promise<Server> {
    return this.patch(`/servers/${id}`, data);
  }

  async deleteServer(id: number): Promise<void> {
    return this.delete(`/servers/${id}`);
  }

  async toggleMaintenanceMode(id: number): Promise<Server> {
    return this.post(`/servers/${id}/maintenance`);
  }

  async getServerStats(id: number): Promise<any> {
    return this.get(`/servers/${id}/stats`);
  }

  async getServerUsers(id: number): Promise<any[]> {
    return this.get(`/servers/${id}/users`);
  }

  async getServerLoad(id: number): Promise<number> {
    return this.get(`/servers/${id}/load`);
  }

  async backupServer(id: number): Promise<void> {
    return this.post(`/servers/${id}/backup`);
  }

  async restoreServer(id: number, backupId: string): Promise<void> {
    return this.post(`/servers/${id}/restore`, { backupId });
  }

  async getServerBackups(id: number): Promise<any[]> {
    return this.get(`/servers/${id}/backups`);
  }
} 