import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { ApiResponse, ApiError } from '../types';

// Configuration de base pour l'API client
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Intercepteur de requête pour ajouter le token d'authentification
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('auth-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur de réponse pour gérer les erreurs globalement
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          localStorage.removeItem('auth-token');
          window.location.href = '/auth/login';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: unknown): ApiError {
    if (error.response) {
      // Erreur de réponse du serveur
      return {
        message: error.response.data?.message || 'Une erreur est survenue',
        code: error.response.status.toString(),
        details: error.response.data,
      };
    } else if (error.request) {
      // Erreur de réseau
      return {
        message: 'Erreur de connexion au serveur',
        code: 'NETWORK_ERROR',
        details: error.request,
      };
    } else {
      // Autre erreur
      return {
        message: error.message || 'Une erreur inattendue est survenue',
        code: 'UNKNOWN_ERROR',
        details: error,
      };
    }
  }

  // Méthodes HTTP génériques
  async get<T>(url: string, config?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: Record<string, unknown>): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }

  // Méthode pour mettre à jour le token
  setAuthToken(token: string) {
    localStorage.setItem('auth-token', token);
  }

  // Méthode pour supprimer le token
  removeAuthToken() {
    localStorage.removeItem('auth-token');
  }
}

// Instance singleton de l'API client
export const apiClient = new ApiClient();
export default apiClient;