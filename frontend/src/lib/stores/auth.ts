import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types';
import apiClient from '../api/client';

interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'individual' | 'enterprise';
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          
          const response = await apiClient.post<{ user: User; token: string }>('/auth/login', {
            email,
            password,
          });

          const { user, token } = response.data;
          
          // Configurer le token dans l'API client
          apiClient.setAuthToken(token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
           set({ isLoading: false });
           throw error;
        }
      },

      register: async (userData: RegisterData) => {
        try {
          set({ isLoading: true });
          
          const response = await apiClient.post<{ user: User; token: string }>('/auth/register', userData);
          
          const { user, token } = response.data;
          
          // Configurer le token dans l'API client
          apiClient.setAuthToken(token);
          
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        // Supprimer le token de l'API client
        apiClient.removeAuthToken();
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      refreshUser: async () => {
        try {
          const { token } = get();
          if (!token) return;
          
          set({ isLoading: true });
          
          const response = await apiClient.get<User>('/auth/me');
          
          set({
            user: response.data,
            isLoading: false,
          });
        } catch (error) {
          // En cas d'erreur, déconnecter l'utilisateur
          get().logout();
        }
      },

      setUser: (user: User) => {
        set({ user });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);