import { api } from '@shared/api/client';
import type { LoginResponse } from '@shared/auth/types';

export const authApi = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', { identifier, password });
    return data;
  },

  async refresh(): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/refresh');
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async heartbeat(): Promise<void> {
    await api.post('/auth/heartbeat');
  },

  async me(): Promise<LoginResponse['user']> {
    const { data } = await api.get<LoginResponse['user']>('/auth/me');
    return data;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post('/auth/reset-password', { token, newPassword });
  },
};
