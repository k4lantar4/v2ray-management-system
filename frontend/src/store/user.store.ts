import { create } from 'zustand';
import { services } from '@/services/api';
import { User, CreateUserDto, UpdateUserDto, PaginationParams } from '@/types/api';

interface UserState {
  users: User[];
  selectedUser: User | null;
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  getUsers: (params?: PaginationParams) => Promise<void>;
  getUser: (id: number) => Promise<void>;
  createUser: (data: CreateUserDto) => Promise<void>;
  updateUser: (id: number, data: UpdateUserDto) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  blockUser: (id: number) => Promise<void>;
  unblockUser: (id: number) => Promise<void>;
  addCredit: (id: number, amount: number) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  selectedUser: null,
  total: 0,
  page: 1,
  limit: 10,
  isLoading: false,
  error: null,

  getUsers: async (params?: PaginationParams) => {
    set({ isLoading: true, error: null });
    try {
      const response = await services.users.getUsers(params);
      set({
        users: response.items,
        total: response.total,
        page: response.page,
        limit: response.limit,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch users',
        isLoading: false,
      });
      throw error;
    }
  },

  getUser: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const user = await services.users.getUser(id);
      set({
        selectedUser: user,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch user',
        isLoading: false,
      });
      throw error;
    }
  },

  createUser: async (data: CreateUserDto) => {
    set({ isLoading: true, error: null });
    try {
      await services.users.createUser(data);
      await get().getUsers({ page: get().page, limit: get().limit });
    } catch (error: any) {
      set({
        error: error.message || 'Failed to create user',
        isLoading: false,
      });
      throw error;
    }
  },

  updateUser: async (id: number, data: UpdateUserDto) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await services.users.updateUser(id, data);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? updatedUser : user
        ),
        selectedUser: updatedUser,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update user',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteUser: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await services.users.deleteUser(id);
      set((state) => ({
        users: state.users.filter((user) => user.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to delete user',
        isLoading: false,
      });
      throw error;
    }
  },

  blockUser: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await services.users.blockUser(id);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? updatedUser : user
        ),
        selectedUser: updatedUser,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to block user',
        isLoading: false,
      });
      throw error;
    }
  },

  unblockUser: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await services.users.unblockUser(id);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? updatedUser : user
        ),
        selectedUser: updatedUser,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to unblock user',
        isLoading: false,
      });
      throw error;
    }
  },

  addCredit: async (id: number, amount: number) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await services.users.addCredit(id, amount);
      set((state) => ({
        users: state.users.map((user) =>
          user.id === id ? updatedUser : user
        ),
        selectedUser: updatedUser,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.message || 'Failed to add credit',
        isLoading: false,
      });
      throw error;
    }
  },
})); 