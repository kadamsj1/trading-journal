import { create } from 'zustand';
import { authApi } from './api';

interface User {
  id: number;
  email: string;
  username: string;
  full_name: string | null;
  is_active: boolean;
  is_admin: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    password: string;
    full_name?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  login: async (username: string, password: string) => {
    set({ isLoading: true });
    try {
      // Server sets HttpOnly cookie automatically
      const response = await authApi.login(username, password);
      set({ user: response.data, isLoading: false, isInitialized: true });
    } catch (error) {
      set({ isLoading: false, isInitialized: true });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      await authApi.register(data);
      // Auto-login after registration
      await useAuthStore.getState().login(data.username, data.password);
    } catch (error) {
      set({ isLoading: false, isInitialized: true });
      throw error;
    }
  },

  logout: async () => {
    try {
      // Server clears the HttpOnly cookie
      await authApi.logout();
    } catch {
      // Even if server call fails, clear local state
    }
    set({ user: null, isInitialized: true });
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // Cookie is automatically sent by browser with withCredentials: true
      const response = await authApi.me();
      set({ user: response.data, isLoading: false, isInitialized: true });
    } catch {
      // Cookie invalid or expired
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },
}));
