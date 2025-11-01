import apiClient from './client';
import { User } from '../types';

interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  user: User;
}

export const authAPI = {
  /**
   * Kullanıcı kaydı
   */
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<any, any>('/auth/register', credentials);
    return response.data;
  },

  /**
   * Kullanıcı girişi
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<any, any>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Çıkış
   */
  logout: async (): Promise<void> => {
    await apiClient.post<any, any>('/auth/logout');
  },

  /**
   * Token yenileme
   */
  refreshToken: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await apiClient.post<any, any>('/auth/refresh', { refreshToken });
    return response.data;
  },

  /**
   * Mevcut kullanıcı bilgilerini al
   */
  getMe: async (): Promise<UserResponse> => {
    const response = await apiClient.get<any, any>('/auth/me');
    return response.data;
  },

  /**
   * Şifre sıfırlama talebi
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const response = await apiClient.post<any, any>('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Şifre sıfırlama
   */
  resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
    const response = await apiClient.post<any, any>('/auth/reset-password', { token, password });
    return response.data;
  },

  /**
   * Şifre değiştirme
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    const response = await apiClient.post<any, any>('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Email doğrulama
   */
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const response = await apiClient.get<any, any>(`/auth/verify-email/${token}`);
    return response.data;
  },
};
