import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ticket, BarChart3, Plus, Home } from 'lucide-react';
import { clsx } from 'clsx';

const Navbar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: Home,
    },
    {
      path: '/coupons',
      label: 'Vouchers',
      icon: Ticket,
    },
    {
      path: '/add-coupon',
      label: 'Add Voucher',
      icon: Plus,
    },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Ticket className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Voucher Manager
              </span>
            </Link>
          </div>

          {/* Navigation links */}
          <div className="flex items-center space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                    isActive
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Right side - could add user menu, settings, etc. */}
          <div className="flex items-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <BarChart3 className="h-4 w-4" />
              <span>Personal</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 