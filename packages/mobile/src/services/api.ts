import { useAuthStore } from '../stores/authStore';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3001/api' 
  : 'https://sophia-api.vercel.app/api';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Base API client with authentication
class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return useAuthStore.getState().token;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.message || 'An error occurred',
          response.status,
          errorData.code
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      throw new APIError('Network error', 0);
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
export const apiClient = new APIClient(API_BASE_URL);

// API endpoints
export const API = {
  // Authentication
  auth: {
    login: (data: { email: string; password: string }) =>
      apiClient.post('/auth/login', data),
    register: (data: { email: string; password: string; name: string }) =>
      apiClient.post('/auth/register', data),
    refresh: () => apiClient.post('/auth/refresh'),
    logout: () => apiClient.post('/auth/logout'),
  },

  // Businesses
  businesses: {
    getAll: () => apiClient.get('/businesses'),
    getById: (id: string) => apiClient.get(`/businesses/${id}`),
    create: (data: any) => apiClient.post('/businesses', data),
    update: (id: string, data: any) => apiClient.put(`/businesses/${id}`, data),
    delete: (id: string) => apiClient.delete(`/businesses/${id}`),
    getMetrics: (id: string) => apiClient.get(`/businesses/${id}/metrics`),
    // AI Research endpoints
    generateIdea: (preferences: any) => apiClient.post('/businesses/ai/generate-idea', preferences),
    conductResearch: (industry: string) => apiClient.post('/businesses/ai/research', { industry }),
    // Real-time status updates
    getStatus: (id: string) => apiClient.get(`/businesses/${id}/status`),
  },

  // Analytics
  analytics: {
    getOverview: () => apiClient.get('/analytics/overview'),
    getBusinessAnalytics: (businessId: string) =>
      apiClient.get(`/analytics/businesses/${businessId}`),
  },

  // User profile
  user: {
    getProfile: () => apiClient.get('/user/profile'),
    updateProfile: (data: any) => apiClient.put('/user/profile', data),
  },
};