import { create } from 'zustand';

export interface Business {
  id: string;
  name: string;
  description: string;
  industry: string;
  status: 'PLANNING' | 'DEVELOPING' | 'DEPLOYING' | 'ACTIVE' | 'PAUSED' | 'CLOSED';
  websiteUrl?: string;
  monthlyPrice: number;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessMetrics {
  visitors: number;
  conversions: number;
  revenue: number;
  bounceRate?: number;
  sessionDuration?: number;
  pageViews: number;
}

interface BusinessState {
  // State
  businesses: Business[];
  selectedBusiness: Business | null;
  metrics: Record<string, BusinessMetrics>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setBusinesses: (businesses: Business[]) => void;
  addBusiness: (business: Business) => void;
  updateBusiness: (id: string, updates: Partial<Business>) => void;
  deleteBusiness: (id: string) => void;
  setSelectedBusiness: (business: Business | null) => void;
  setMetrics: (businessId: string, metrics: BusinessMetrics) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Computed
  getBusiness: (id: string) => Business | undefined;
  getBusinessById: (id: string) => Business | undefined;
  getActiveBusinesses: () => Business[];
  getTotalRevenue: () => number;
}

export const useBusinessStore = create<BusinessState>((set, get) => ({
  // Initial state
  businesses: [],
  selectedBusiness: null,
  metrics: {},
  isLoading: false,
  error: null,

  // Actions
  setBusinesses: (businesses: Business[]) => {
    set({ businesses });
  },

  addBusiness: (business: Business) => {
    set((state) => ({
      businesses: [...state.businesses, business],
    }));
  },

  updateBusiness: (id: string, updates: Partial<Business>) => {
    set((state) => ({
      businesses: state.businesses.map((business) =>
        business.id === id ? { ...business, ...updates } : business
      ),
      selectedBusiness:
        state.selectedBusiness?.id === id
          ? { ...state.selectedBusiness, ...updates }
          : state.selectedBusiness,
    }));
  },

  deleteBusiness: (id: string) => {
    set((state) => ({
      businesses: state.businesses.filter((business) => business.id !== id),
      selectedBusiness:
        state.selectedBusiness?.id === id ? null : state.selectedBusiness,
    }));
  },

  setSelectedBusiness: (business: Business | null) => {
    set({ selectedBusiness: business });
  },

  setMetrics: (businessId: string, metrics: BusinessMetrics) => {
    set((state) => ({
      metrics: {
        ...state.metrics,
        [businessId]: metrics,
      },
    }));
  },

  setLoading: (isLoading: boolean) => {
    set({ isLoading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Computed getters
  getBusiness: (id: string) => {
    return get().businesses.find((business) => business.id === id);
  },

  getBusinessById: (id: string) => {
    return get().businesses.find((business) => business.id === id);
  },

  getActiveBusinesses: () => {
    return get().businesses.filter((business) => business.status === 'ACTIVE');
  },

  getTotalRevenue: () => {
    const { businesses, metrics } = get();
    return businesses.reduce((total, business) => {
      const businessMetrics = metrics[business.id];
      return total + (businessMetrics?.revenue || 0);
    }, 0);
  },
}));