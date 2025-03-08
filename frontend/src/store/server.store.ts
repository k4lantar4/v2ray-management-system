import { create } from 'zustand';
import { services } from '@/services/api';
import { Server, CreateServerDto, UpdateServerDto, PaginationParams } from '@/types/api';

interface ServerState {
  servers: Server[];
  selectedServer: Server | null;
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  getServers: (params?: PaginationParams) => Promise<void>;
  getServer: (id: number) => Promise<void>;
  createServer: (data: CreateServerDto) => Promise<void>;
  updateServer: (id: number, data: UpdateServerDto) => Promise<void>;
  deleteServer: (id: number) => Promise<void>;
  toggleMaintenanceMode: (id: number) => Promise<void>;
  getServerStats: (id: number) => Promise<any>;
  getServerLoad: (id: number) => Promise<number>;
  backupServer: (id: number) => Promise<void>;
  restoreServer: (id: number, backupId: string) => Promise<void>;
  getServerBackups: (id: number) => Promise<any[]>;
}

export const useServerStore = create<ServerState>((set, get) => ({
  servers: [],
  selectedServer: null,
  total: 0,
  page: 1,
  limit: 10,
  isLoading: false,
  error: null,

  getServers: async (params?: PaginationParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await services.servers.getServers(params);
      set({
        servers: response.items,
        total: response.total,
        page: response.page,
        limit: response.limit,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch servers',
        isLoading: false,
      });
      throw error;
    }
  },

  getServer: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const server = await services.servers.getServer(id);
      set({
        selectedServer: server,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch server',
        isLoading: false,
      });
      throw error;
    }
  },

  createServer: async (data: CreateServerDto) => {
    set({ isLoading: true, error: null });
    try {
      await services.servers.createServer(data);
      await get().getServers({ page: get().page, limit: get().limit });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create server',
        isLoading: false,
      });
      throw error;
    }
  },

  updateServer: async (id: number, data: UpdateServerDto) => {
    set({ isLoading: true, error: null });
    try {
      const updatedServer = await services.servers.updateServer(id, data);
      set((state) => ({
        servers: state.servers.map((server) =>
          server.id === id ? updatedServer : server
        ),
        selectedServer: updatedServer,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update server',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteServer: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await services.servers.deleteServer(id);
      set((state) => ({
        servers: state.servers.filter((server) => server.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete server',
        isLoading: false,
      });
      throw error;
    }
  },

  toggleMaintenanceMode: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const updatedServer = await services.servers.toggleMaintenanceMode(id);
      set((state) => ({
        servers: state.servers.map((server) =>
          server.id === id ? updatedServer : server
        ),
        selectedServer: updatedServer,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to toggle maintenance mode',
        isLoading: false,
      });
      throw error;
    }
  },

  getServerStats: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const stats = await services.servers.getServerStats(id);
      set({ isLoading: false });
      return stats;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to get server stats',
        isLoading: false,
      });
      throw error;
    }
  },

  getServerLoad: async (id: number) => {
    try {
      return await services.servers.getServerLoad(id);
    } catch (error: any) {
      throw error;
    }
  },

  backupServer: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await services.servers.backupServer(id);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to backup server',
        isLoading: false,
      });
      throw error;
    }
  },

  restoreServer: async (id: number, backupId: string) => {
    set({ isLoading: true, error: null });
    try {
      await services.servers.restoreServer(id, backupId);
      set({ isLoading: false });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to restore server',
        isLoading: false,
      });
      throw error;
    }
  },

  getServerBackups: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const backups = await services.servers.getServerBackups(id);
      set({ isLoading: false });
      return backups;
    } catch (error: any) {
      set({
        error: error.message || 'Failed to get server backups',
        isLoading: false,
      });
      throw error;
    }
  },
})); 