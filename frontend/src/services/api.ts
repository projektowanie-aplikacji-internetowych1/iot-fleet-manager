const BASE_URL = 'http://localhost:3000';

export interface User {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  organizationId: string;
  organization?: {
    name: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

import { translateError } from '../utils/errors';

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch (err: any) {
    throw new Error(translateError(err.message || 'Failed to fetch'));
  }

  if (response.status === 401) {
    if (!path.startsWith('/auth/')) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_info');
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const rawMessage = errorData.message || `API error: ${response.status}`;
    throw new Error(translateError(rawMessage));
  }

  return response.json();
}

export const api = {
  async login(loginData: any): Promise<AuthResponse> {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('user_info', JSON.stringify(data.user));
    return data;
  },

  async register(registerData: any): Promise<AuthResponse> {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registerData),
    });
    localStorage.setItem('auth_token', data.accessToken);
    localStorage.setItem('user_info', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_info');
    window.location.href = '/login';
  },

  getCurrentUser(): User | null {
    const info = localStorage.getItem('user_info');
    if (!info) return null;
    try {
      return JSON.parse(info);
    } catch {
      return null;
    }
  },

  async getOrganizations(): Promise<any[]> {
    return apiFetch('/organizations');
  },

  async createOrganization(orgData: any): Promise<any> {
    return apiFetch('/organizations', {
      method: 'POST',
      body: JSON.stringify(orgData),
    });
  },

  async getDevices(): Promise<any[]> {
    return apiFetch('/devices');
  },

  async getDevice(id: string): Promise<any> {
    return apiFetch(`/devices/${id}`);
  },

  async createDevice(deviceData: any): Promise<any> {
    return apiFetch('/devices', {
      method: 'POST',
      body: JSON.stringify(deviceData),
    });
  },

  async updateDevice(id: string, deviceData: any): Promise<any> {
    return apiFetch(`/devices/${id}`, {
      method: 'PUT',
      body: JSON.stringify(deviceData),
    });
  },

  async deleteDevice(id: string): Promise<any> {
    return apiFetch(`/devices/${id}`, {
      method: 'DELETE',
    });
  },

  async getDeviceMetrics(id: string): Promise<any[]> {
    return apiFetch(`/devices/${id}/metrics`);
  },

  async getBatteryAnalytics(): Promise<any> {
    return apiFetch('/analytics/battery');
  },

  async getStatusAnalytics(): Promise<any> {
    return apiFetch('/analytics/status');
  },

  async deleteOrganization(id: string): Promise<any> {
    return apiFetch(`/organizations/${id}`, {
      method: 'DELETE',
    });
  },

  async getUsers(): Promise<any[]> {
    return apiFetch('/users');
  },

  async createUser(userData: any): Promise<any> {
    return apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(id: string, userData: any): Promise<any> {
    return apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id: string): Promise<any> {
    return apiFetch(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  async getProfile(): Promise<any> {
    return apiFetch('/users/me');
  },

  async updateProfile(profileData: any): Promise<any> {
    return apiFetch('/users/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  async deleteProfile(): Promise<any> {
    return apiFetch('/users/me', {
      method: 'DELETE',
    });
  },

  async pollAllDevices(): Promise<any> {
    return apiFetch('/devices/poll', {
      method: 'POST',
    });
  },

  async pollDevice(id: string): Promise<any> {
    return apiFetch(`/devices/${id}/poll`, {
      method: 'POST',
    });
  },
};
