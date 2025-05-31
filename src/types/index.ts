export interface Coupon {
  id: string;
  code: string;
  company: string;
  type: 'money' | 'product';
  
  // For money coupons
  original_amount?: number;
  remaining_amount?: number;
  currency?: string;
  
  // For product coupons
  product_description?: string;
  is_used?: boolean;
  
  // Common fields
  category?: string;
  expiration_date?: string;
  notes?: string;
  date_added: string;
  last_used?: string;
  created_at: string;
  updated_at: string;
  
  // Computed status
  status: 'active' | 'used' | 'expired' | 'expiring';
  
  // For money coupons with usage history
  usage_history?: CouponUsage[];
}

export interface CouponUsage {
  date: string;
  type: 'used' | 'partial_use';
  amount?: number;
  currency?: string;
  remaining_after?: number;
  notes?: string;
}

export interface CreateCouponRequest {
  code: string;
  company: string;
  type: 'money' | 'product';
  original_amount?: number;
  currency?: string;
  product_description?: string;
  category?: string;
  expiration_date?: string;
  notes?: string;
}

export interface UseCouponRequest {
  amount?: number;
  notes?: string;
}

export interface CouponsResponse {
  coupons: Coupon[];
  total: number;
  limit: number;
  offset: number;
}

export interface CouponStats {
  total_coupons: number;
  active_money_coupons: number;
  active_product_coupons: number;
  expiring_soon: number;
  total_value: number;
  total_companies: number;
  total_categories: number;
}

export interface CouponFilters {
  company?: string;
  category?: string;
  type?: 'money' | 'product';
  status?: 'active' | 'used' | 'expired' | 'expiring';
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any[];
}

// UI State Types
export interface FilterState {
  search: string;
  company: string;
  category: string;
  type: string;
  status: string;
}

export interface SortState {
  field: keyof Coupon;
  direction: 'asc' | 'desc';
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

// Component Props Types
export interface CouponCardProps {
  coupon: Coupon;
  onEdit?: (coupon: Coupon) => void;
  onDelete?: (coupon: Coupon) => void;
  onUse?: (coupon: Coupon) => void;
}

export interface CouponFormProps {
  coupon?: Coupon;
  onSubmit: (data: CreateCouponRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: any;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

// Hook Types
export interface UseCouponsReturn {
  coupons: Coupon[];
  loading: boolean;
  error: string | null;
  total: number;
  pagination: PaginationState;
  filters: FilterState;
  refresh: () => Promise<void>;
  updateFilters: (filters: Partial<FilterState>) => void;
  updatePagination: (pagination: Partial<PaginationState>) => void;
}

export interface UseStatsReturn {
  stats: CouponStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} 