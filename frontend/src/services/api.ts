import axios, { AxiosResponse, AxiosError } from 'axios';
import {
  Coupon,
  CouponsResponse,
  CreateCouponRequest,
  UseCouponRequest,
  CouponStats,
  CouponFilters,
  ApiError
} from '../types';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth tokens here if needed in the future
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiError>) => {
    let errorMessage = 'An unexpected error occurred';
    
    if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
      if (error.response.data.message) {
        errorMessage += `: ${error.response.data.message}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return Promise.reject(new Error(errorMessage));
  }
);

// API functions
export const couponApi = {
  // Get all coupons with optional filters
  getCoupons: async (filters?: CouponFilters): Promise<CouponsResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await api.get<CouponsResponse>(`/coupons?${params.toString()}`);
    return response.data;
  },

  // Get single coupon by ID
  getCoupon: async (id: string): Promise<Coupon> => {
    const response = await api.get<Coupon>(`/coupons/${id}`);
    return response.data;
  },

  // Create new coupon
  createCoupon: async (couponData: CreateCouponRequest): Promise<Coupon> => {
    const response = await api.post<Coupon>('/coupons', couponData);
    return response.data;
  },

  // Update coupon (for editing)
  updateCoupon: async (id: string, couponData: Partial<CreateCouponRequest>): Promise<Coupon> => {
    const response = await api.put<Coupon>(`/coupons/${id}`, couponData);
    return response.data;
  },

  // Use coupon (partial or full usage)
  useCoupon: async (id: string, usageData: UseCouponRequest): Promise<Coupon> => {
    const response = await api.put<Coupon>(`/coupons/${id}/use`, usageData);
    return response.data;
  },

  // Delete coupon
  deleteCoupon: async (id: string): Promise<void> => {
    await api.delete(`/coupons/${id}`);
  },

  // Get statistics
  getStats: async (): Promise<CouponStats> => {
    const response = await api.get<CouponStats>('/coupons/stats/summary');
    return response.data;
  },

  // Get recent coupons
  getRecentCoupons: async (): Promise<Coupon[]> => {
    const response = await api.get<Coupon[]>('/coupons/recent');
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; timestamp: string; uptime: number }> => {
    const response = await api.get('/health');
    return response.data;
  }
};

// Utility functions
export const formatCurrency = (amount: number, currency = 'NIS'): string => {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: currency === 'NIS' ? 'ILS' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('he-IL', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'success';
    case 'expiring':
      return 'warning';
    case 'expired':
    case 'used':
      return 'danger';
    default:
      return 'gray';
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'expiring':
      return 'Expiring Soon';
    case 'expired':
      return 'Expired';
    case 'used':
      return 'Used';
    default:
      return status;
  }
};

export default api; 