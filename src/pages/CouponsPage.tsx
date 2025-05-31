import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Eye, Edit, Trash2, DollarSign, Package, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { couponApi, formatCurrency, formatDate, getStatusColor, getStatusLabel } from '../services/api';
import { Coupon, CouponFilters, FilterState, PaginationState } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import UseCouponModal from '../components/UseCouponModal';

const CouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  
  // Filter and pagination state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    company: '',
    category: '',
    type: '',
    status: ''
  });
  
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 12,
    total: 0
  });
  
  const [showFilters, setShowFilters] = useState(false);
  const [companies, setCompanies] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [showUseModal, setShowUseModal] = useState(false);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filterParams: CouponFilters = {
        limit: pagination.limit,
        offset: (pagination.page - 1) * pagination.limit
      };
      
      // Add filters with proper typing
      if (filters.search) filterParams.search = filters.search;
      if (filters.company) filterParams.company = filters.company;
      if (filters.category) filterParams.category = filters.category;
      if (filters.type) filterParams.type = filters.type as 'money' | 'product';
      if (filters.status) filterParams.status = filters.status as 'active' | 'used' | 'expired' | 'expiring';
      
      const response = await couponApi.getCoupons(filterParams);
      setCoupons(response.coupons);
      setTotal(response.total);
      setPagination(prev => ({ ...prev, total: response.total }));
      
      // Extract unique companies and categories for filter options
      const uniqueCompanies = Array.from(new Set(response.coupons.map(c => c.company)));
      const uniqueCategories = Array.from(new Set(response.coupons.map(c => c.category).filter(Boolean))) as string[];
      setCompanies(uniqueCompanies);
      setCategories(uniqueCategories);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch coupons');
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      company: '',
      category: '',
      type: '',
      status: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!window.confirm(`Are you sure you want to delete the coupon "${coupon.code}"?`)) {
      return;
    }
    
    try {
      await couponApi.deleteCoupon(coupon.id);
      toast.success('Coupon deleted successfully');
      fetchCoupons(); // Refresh the list
    } catch (err) {
      toast.error('Failed to delete coupon');
    }
  };

  const handleUseCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setShowUseModal(true);
  };

  const confirmUseCoupon = async (amount?: number, notes?: string) => {
    if (!selectedCoupon) return;

    try {
      await couponApi.useCoupon(selectedCoupon.id, { amount, notes });
      
      if (selectedCoupon.type === 'product') {
        toast.success('Service voucher marked as used');
      } else {
        toast.success(`Used ${amount} ${selectedCoupon.currency} from voucher`);
      }
      
      fetchCoupons(); // Refresh the list
    } catch (err) {
      toast.error('Failed to use voucher');
      throw err; // Re-throw so modal can handle it
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'expiring':
        return <AlertTriangle className="h-4 w-4" />;
      case 'expired':
      case 'used':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  if (loading && coupons.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">All Vouchers</h1>
          <p className="text-gray-600 mt-1">
            {total > 0 ? `${total} voucher${total !== 1 ? 's' : ''} found` : 'No vouchers found'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500 font-medium">Quick filters:</span>
            <button
              onClick={() => {
                handleFilterChange('category', filters.category === 'Supermarkets' ? '' : 'Supermarkets');
                handleFilterChange('company', ''); // Clear company filter when selecting category
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filters.category === 'Supermarkets' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              🛒 Supermarkets
            </button>
            <button
              onClick={() => {
                handleFilterChange('company', filters.company === 'McDonalds' ? '' : 'McDonalds');
                handleFilterChange('category', ''); // Clear category filter when selecting company
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filters.company === 'McDonalds' 
                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              🍟 McDonalds
            </button>
            {(filters.category === 'Supermarkets' || filters.company === 'McDonalds') && (
              <button
                onClick={() => {
                  handleFilterChange('category', '');
                  handleFilterChange('company', '');
                }}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="border-l border-gray-300 pl-3">
            <a
              href="/add-coupon"
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Voucher
            </a>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="card-body">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search vouchers by code, store, or description..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center text-gray-600 hover:text-gray-800"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
              
              {(filters.search || filters.company || filters.category || filters.type || filters.status) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Filter Options */}
            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Store</label>
                  <select
                    value={filters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Stores</option>
                    {companies.map(company => (
                      <option key={company} value={company}>{company}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Types</option>
                    <option value="money">Gift Cards</option>
                    <option value="product">Service Vouchers</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="expiring">Expiring Soon</option>
                    <option value="expired">Expired</option>
                    <option value="used">Used</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="card border-red-200 bg-red-50">
          <div className="card-body">
            <div className="text-red-600 text-center">
              {error}
              <button
                onClick={fetchCoupons}
                className="block mx-auto mt-2 text-sm underline hover:no-underline"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupons Grid */}
      {coupons.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="card hover:shadow-lg transition-shadow">
                <div className="card-body">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{coupon.code}</h3>
                      <p className="text-gray-600 text-sm">{coupon.company}</p>
                    </div>
                    <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                      getStatusColor(coupon.status) === 'success' ? 'bg-green-100 text-green-800' :
                      getStatusColor(coupon.status) === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      getStatusColor(coupon.status) === 'danger' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {getStatusIcon(coupon.status)}
                      <span className="ml-1">{getStatusLabel(coupon.status)}</span>
                    </div>
                  </div>

                  {/* Type and Value */}
                  <div className="mb-3">
                    {coupon.type === 'money' ? (
                      <div>
                        <div className="flex items-center text-green-600 mb-2">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <div className="font-medium">
                            <div className="text-lg">
                              {formatCurrency(coupon.remaining_amount || 0)} {coupon.currency}
                            </div>
                            <div className="text-xs text-gray-500">
                              of {formatCurrency(coupon.original_amount || 0)} {coupon.currency}
                            </div>
                          </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ 
                              width: `${Math.max(0, Math.min(100, ((coupon.remaining_amount || 0) / (coupon.original_amount || 1)) * 100))}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {Math.round(((coupon.remaining_amount || 0) / (coupon.original_amount || 1)) * 100)}% remaining
                          {coupon.usage_history && coupon.usage_history.length > 0 && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {coupon.usage_history.length} use{coupon.usage_history.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center text-blue-600">
                        <Package className="h-4 w-4 mr-1" />
                        <span className="font-medium">Service Voucher</span>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {coupon.type === 'product' && coupon.product_description && (
                    <p className="text-gray-600 text-sm mb-3">{coupon.product_description}</p>
                  )}

                  {/* Category and Expiration */}
                  <div className="space-y-1 text-xs text-gray-500 mb-4">
                    {coupon.category && (
                      <div>Category: {coupon.category}</div>
                    )}
                    {coupon.expiration_date && (
                      <div>Expires: {formatDate(coupon.expiration_date)}</div>
                    )}
                  </div>

                  {/* Notes */}
                  {coupon.notes && (
                    <p className="text-gray-600 text-sm mb-4 italic">"{coupon.notes}"</p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {coupon.status === 'active' && (
                      <button
                        onClick={() => handleUseCoupon(coupon)}
                        className="flex-1 bg-primary-600 text-white text-xs py-2 px-3 rounded hover:bg-primary-700 transition-colors"
                      >
                        Use
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`/coupons/${coupon.id}`, '_blank')}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => window.open(`/edit-coupon/${coupon.id}`, '_blank')}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit Coupon"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Coupon"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="px-3 py-2 text-sm text-gray-700">
                  Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                </span>
                
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        !loading && (
          <div className="card">
            <div className="card-body">
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vouchers found</h3>
                <p className="text-gray-600 mb-6">
                  {Object.values(filters).some(f => f) 
                    ? 'Try adjusting your filters or search terms.'
                    : 'Get started by adding your first voucher!'
                  }
                </p>
                <a
                  href="/add-coupon"
                  className="btn-primary inline-flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Voucher
                </a>
              </div>
            </div>
          </div>
        )
      )}

      {/* Use Coupon Modal */}
      {selectedCoupon && (
        <UseCouponModal
          coupon={selectedCoupon}
          isOpen={showUseModal}
          onClose={() => {
            setShowUseModal(false);
            setSelectedCoupon(null);
          }}
          onConfirm={confirmUseCoupon}
        />
      )}
    </div>
  );
};

export default CouponsPage; 