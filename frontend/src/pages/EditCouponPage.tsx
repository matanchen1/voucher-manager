import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DollarSign, Package, Calendar, Building2, Tag, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { couponApi } from '../services/api';
import { CreateCouponRequest, Coupon } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

const EditCouponPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [voucher, setVoucher] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<CreateCouponRequest>({
    code: '',
    company: '',
    type: 'money',
    original_amount: undefined,
    currency: 'NIS',
    product_description: '',
    category: '',
    expiration_date: '',
    notes: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      fetchVoucher();
    }
  }, [id]);

  const fetchVoucher = async () => {
    try {
      setInitialLoading(true);
      const data = await couponApi.getCoupon(id!);
      setVoucher(data);
      
      // Populate form with existing data
      setFormData({
        code: data.code,
        company: data.company,
        type: data.type,
        original_amount: data.original_amount,
        currency: data.currency,
        product_description: data.product_description,
        category: data.category,
        expiration_date: data.expiration_date,
        notes: data.notes
      });
    } catch (err) {
      toast.error('Failed to load voucher');
      navigate('/coupons');
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.code.trim()) {
      newErrors.code = 'Voucher code is required';
    }
    if (!formData.company.trim()) {
      newErrors.company = 'Store name is required';
    }

    // Type-specific validation
    if (formData.type === 'money') {
      if (!formData.original_amount || formData.original_amount <= 0) {
        newErrors.original_amount = 'Amount must be greater than 0';
      }
      if (!formData.currency?.trim()) {
        newErrors.currency = 'Currency is required for gift cards';
      }
    } else if (formData.type === 'product') {
      if (!formData.product_description?.trim()) {
        newErrors.product_description = 'Service description is required';
      }
    }

    // Expiration date validation
    if (formData.expiration_date) {
      const expirationDate = new Date(formData.expiration_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (expirationDate < today) {
        newErrors.expiration_date = 'Expiration date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);
      
      // Prepare the data for submission
      const submitData: CreateCouponRequest = {
        code: formData.code.trim(),
        company: formData.company.trim(),
        type: formData.type,
        category: formData.category?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        expiration_date: formData.expiration_date || undefined
      };

      if (formData.type === 'money') {
        submitData.original_amount = formData.original_amount;
        submitData.currency = formData.currency || 'NIS';
      } else {
        submitData.product_description = formData.product_description?.trim();
      }

      await couponApi.updateCoupon(id!, submitData);
      toast.success('Voucher updated successfully!');
      navigate('/coupons');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update voucher';
      toast.error(errorMessage);
      
      // Handle specific validation errors from the server
      if (errorMessage.includes('code already exists')) {
        setErrors({ code: 'This voucher code already exists' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateCouponRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleTypeChange = (type: 'money' | 'product') => {
    setFormData(prev => ({
      ...prev,
      type,
      // Reset type-specific fields
      original_amount: type === 'money' ? prev.original_amount : undefined,
      currency: type === 'money' ? (prev.currency || 'NIS') : undefined,
      product_description: type === 'product' ? prev.product_description : ''
    }));
    
    // Clear type-specific errors
    const typeSpecificErrors = ['original_amount', 'currency', 'product_description'];
    const newErrors = { ...errors };
    typeSpecificErrors.forEach(field => delete newErrors[field]);
    setErrors(newErrors);
  };

  // Common categories for suggestions
  const commonCategories = [
    'Supermarkets',
    'Pharmacies', 
    'Clothing & Fashion',
    'Electronics',
    'Home & Garden',
    'Restaurants',
    'Beauty & Spa',
    'Sports & Fitness',
    'Entertainment',
    'Other'
  ];

  // Common currencies
  const currencies = ['NIS', 'USD', 'EUR', 'GBP'];

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">Voucher not found</div>
        <button
          onClick={() => navigate('/coupons')}
          className="btn-primary"
        >
          Back to Vouchers
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Voucher</h1>
          <p className="text-gray-600 mt-1">
            Update voucher: {voucher.code} - {voucher.company}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Voucher Type Selection */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Voucher Type</h2>
            <p className="text-sm text-gray-600">Choose the type of voucher</p>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleTypeChange('money')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  formData.type === 'money'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg mr-4 ${
                    formData.type === 'money' ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    <DollarSign className={`h-6 w-6 ${
                      formData.type === 'money' ? 'text-primary-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">Gift Card</h3>
                    <p className="text-sm text-gray-600">Monetary value that can be spent partially</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeChange('product')}
                className={`p-4 border-2 rounded-lg transition-colors ${
                  formData.type === 'product'
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg mr-4 ${
                    formData.type === 'product' ? 'bg-primary-100' : 'bg-gray-100'
                  }`}>
                    <Package className={`h-6 w-6 ${
                      formData.type === 'product' ? 'text-primary-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">Service Voucher</h3>
                    <p className="text-sm text-gray-600">Specific service or item (one-time use)</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voucher Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Voucher Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="e.g., SP500, IKEA100, MC200..."
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.code ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code}</p>}
              </div>

              {/* Store */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="inline h-4 w-4 mr-1" />
                  Store *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => handleInputChange('company', e.target.value)}
                  placeholder="e.g., Super Pharm, IKEA, Rami Levy..."
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.company ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.company && <p className="mt-1 text-sm text-red-600">{errors.company}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Type-specific Fields */}
        {formData.type === 'money' ? (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Gift Card Details</h2>
              {voucher.type === 'money' && (
                <p className="text-sm text-gray-600">
                  Current balance: {voucher.remaining_amount || 0} / {voucher.original_amount || 0} {voucher.currency}
                </p>
              )}
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Original Amount *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.original_amount || ''}
                    onChange={(e) => handleInputChange('original_amount', parseFloat(e.target.value) || undefined)}
                    placeholder="0.00"
                    className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                      errors.original_amount ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.original_amount && <p className="mt-1 text-sm text-red-600">{errors.original_amount}</p>}
                  <p className="mt-1 text-xs text-gray-500">
                    Note: Changing this will not affect the remaining balance
                  </p>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency *
                  </label>
                  <select
                    value={formData.currency || 'NIS'}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                      errors.currency ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    {currencies.map(currency => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                  {errors.currency && <p className="mt-1 text-sm text-red-600">{errors.currency}</p>}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Service Voucher Details</h2>
            </div>
            <div className="card-body">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Service Description *
                </label>
                <textarea
                  value={formData.product_description || ''}
                  onChange={(e) => handleInputChange('product_description', e.target.value)}
                  placeholder="e.g., Spa treatment, Hair cut, Massage..."
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.product_description ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.product_description && <p className="mt-1 text-sm text-red-600">{errors.product_description}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Additional Information</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <input
                  type="text"
                  list="categories"
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  placeholder="Select or type a category"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <datalist id="categories">
                  {commonCategories.map(category => (
                    <option key={category} value={category} />
                  ))}
                </datalist>
              </div>

              {/* Expiration Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expiration_date || ''}
                  onChange={(e) => handleInputChange('expiration_date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                    errors.expiration_date ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.expiration_date && <p className="mt-1 text-sm text-red-600">{errors.expiration_date}</p>}
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="inline h-4 w-4 mr-1" />
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional notes, restrictions, or details..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary inline-flex items-center px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Updating...</span>
              </>
            ) : (
              'Update Voucher'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditCouponPage; 