import React, { useState, useEffect } from 'react';
import { Ticket, DollarSign, AlertTriangle, Building2 } from 'lucide-react';
import { couponApi, formatCurrency } from '../services/api';
import { CouponStats } from '../types';
import StatsCard from '../components/StatsCard';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await couponApi.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button
          onClick={fetchStats}
          className="btn-primary"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your voucher collection
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Vouchers"
            value={stats.total_coupons}
            icon={<Ticket className="h-6 w-6" />}
            color="blue"
          />
          
          <StatsCard
            title="Total Value"
            value={formatCurrency(stats.total_value)}
            icon={<DollarSign className="h-6 w-6" />}
            color="green"
          />
          
          <StatsCard
            title="Expiring Soon"
            value={stats.expiring_soon}
            icon={<AlertTriangle className="h-6 w-6" />}
            color="yellow"
          />
          
          <StatsCard
            title="Stores"
            value={stats.total_companies}
            icon={<Building2 className="h-6 w-6" />}
            color="gray"
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/add-coupon"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="bg-primary-100 p-3 rounded-lg mr-4">
                <Ticket className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Add New Voucher</h3>
                <p className="text-sm text-gray-600">Add a gift card or voucher</p>
              </div>
            </a>

            <a
              href="/coupons?status=expiring"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="bg-warning-100 p-3 rounded-lg mr-4">
                <AlertTriangle className="h-6 w-6 text-warning-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Expiring Vouchers</h3>
                <p className="text-sm text-gray-600">Review expiring vouchers</p>
              </div>
            </a>

            <a
              href="/coupons"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="bg-success-100 p-3 rounded-lg mr-4">
                <DollarSign className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">All Vouchers</h3>
                <p className="text-sm text-gray-600">Browse all your vouchers</p>
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Recent Activity - placeholder for future enhancement */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="card-body">
          <div className="text-center py-8 text-gray-500">
            <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Recent activity will appear here</p>
            <p className="text-sm">Add some vouchers to get started!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 