import React, { useState } from 'react';
import { X, DollarSign, Package } from 'lucide-react';
import { Coupon } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface UseCouponModalProps {
  coupon: Coupon;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount?: number, notes?: string) => Promise<void>;
}

const UseCouponModal: React.FC<UseCouponModalProps> = ({
  coupon,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const remainingAmount = coupon.remaining_amount || 0;
  const currency = coupon.currency || 'NIS';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (coupon.type === 'money') {
      const useAmount = parseFloat(amount);
      
      if (isNaN(useAmount) || useAmount <= 0) {
        setError('Please enter a valid amount greater than 0');
        return;
      }
      
      if (useAmount > remainingAmount) {
        setError(`Amount cannot exceed remaining balance of ${remainingAmount} ${currency}`);
        return;
      }
    }

    try {
      setLoading(true);
      await onConfirm(
        coupon.type === 'money' ? parseFloat(amount) : undefined,
        notes.trim() || undefined
      );
      onClose();
      // Reset form
      setAmount('');
      setNotes('');
    } catch (err) {
      setError('Failed to use voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleUseAll = () => {
    if (coupon.type === 'money') {
      setAmount(remainingAmount.toString());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            {coupon.type === 'money' ? (
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <Package className="h-5 w-5 text-blue-600 mr-2" />
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              Use Voucher
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Voucher Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{coupon.code}</span>
                <span className="text-sm text-gray-600">{coupon.company}</span>
              </div>
              
              {coupon.type === 'money' ? (
                <div className="text-sm text-gray-600">
                  <div>Available: <span className="font-medium text-green-600">
                    {remainingAmount} {currency}
                  </span></div>
                  <div>Original: {coupon.original_amount || 0} {currency}</div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  <div>Service: {coupon.product_description}</div>
                  <div className="text-orange-600 font-medium">One-time use</div>
                </div>
              )}
            </div>

            {/* Amount Input (for money coupons) */}
            {coupon.type === 'money' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Use
                </label>
                <div className="flex space-x-2 mb-2">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      min="0"
                      max={remainingAmount}
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleUseAll}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Use All
                  </button>
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="flex space-x-2 mb-2">
                  {[50, 100, 200].map(quickAmount => (
                    remainingAmount >= quickAmount && (
                      <button
                        key={quickAmount}
                        type="button"
                        onClick={() => setAmount(quickAmount.toString())}
                        className="px-3 py-1 text-xs bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 transition-colors"
                      >
                        {quickAmount} {currency}
                      </button>
                    )
                  ))}
                </div>
                
                <p className="text-xs text-gray-500">
                  Maximum: {remainingAmount} {currency}
                </p>
              </div>
            )}

            {/* Usage History (for money coupons with history) */}
            {coupon.type === 'money' && coupon.usage_history && coupon.usage_history.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Usage History
                </label>
                <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                  {coupon.usage_history.slice(-3).reverse().map((usage, index) => (
                    <div key={index} className="flex justify-between items-center text-xs text-gray-600 py-1">
                      <span>{new Date(usage.date).toLocaleDateString()}</span>
                      <span className="font-medium">
                        -{usage.amount} {usage.currency}
                      </span>
                    </div>
                  ))}
                  {coupon.usage_history.length > 3 && (
                    <div className="text-xs text-gray-400 text-center mt-1">
                      +{coupon.usage_history.length - 3} more transactions
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Confirmation for product coupons */}
            {coupon.type === 'product' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Confirm:</strong> This service voucher will be marked as used and cannot be undone.
                </p>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Where did you use this voucher? Any additional details..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (coupon.type === 'money' && (!amount || parseFloat(amount) <= 0))}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Using...</span>
                </>
              ) : (
                <>
                  {coupon.type === 'money' ? `Use ${amount || '0'} ${currency}` : 'Mark as Used'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UseCouponModal; 