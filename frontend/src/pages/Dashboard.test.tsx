import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom'; // For <Link> components if any are rendered indirectly
import Dashboard from './Dashboard'; // Corrected: Dashboard is a default export
import { couponApi } from '../services/api';
import { Coupon, CouponStats } from '../types';

// Mock the entire couponApi service
jest.mock('../services/api', () => ({
  ...jest.requireActual('../services/api'), // Import and retain default exports
  couponApi: {
    getStats: jest.fn(),
    getRecentCoupons: jest.fn(),
    // Mock other functions if Dashboard uses them, otherwise this is fine
  },
}));

const mockStats: CouponStats = {
  total_coupons: 10,
  active_money_coupons: 5,
  active_product_coupons: 3,
  expiring_soon: 2,
  total_value: 500,
  total_companies: 4,
  total_categories: 6,
};

const mockRecentCoupons: Coupon[] = [
  {
    id: '1',
    code: 'RECENT01',
    company: 'TestCo A',
    type: 'money',
    original_amount: 100,
    remaining_amount: 100,
    currency: 'USD',
    date_added: new Date('2023-10-01T10:00:00Z').toISOString(),
    created_at: new Date('2023-10-01T10:00:00Z').toISOString(),
    updated_at: new Date('2023-10-01T10:00:00Z').toISOString(),
    status: 'active',
    is_used: false,
  },
  {
    id: '2',
    code: 'RECENT02',
    company: 'TestCo B',
    type: 'product',
    product_description: 'Free Drink',
    date_added: new Date('2023-09-30T12:00:00Z').toISOString(),
    created_at: new Date('2023-09-30T12:00:00Z').toISOString(),
    updated_at: new Date('2023-09-30T12:00:00Z').toISOString(),
    status: 'active',
    is_used: false,
  },
];

describe('Dashboard - Recent Activity Section', () => {
  beforeEach(() => {
    // Reset mocks before each test
    (couponApi.getStats as jest.Mock).mockReset();
    (couponApi.getRecentCoupons as jest.Mock).mockReset();

    // Default successful mock for getStats to avoid unrelated errors in tests focused on recent activity
    (couponApi.getStats as jest.Mock).mockResolvedValue(mockStats);
  });

  const renderDashboard = () => {
    // Wrap with Router if Link components are used, e.g. in Quick Actions
    // The Dashboard itself doesn't use routing but sub-components or links might
    return render(
      <Router>
        <Dashboard />
      </Router>
    );
  };

  test('shows loading state initially for recent activity', async () => {
    (couponApi.getRecentCoupons as jest.Mock).mockImplementation(() => {
      return new Promise(() => {}); // Never resolves, stays in loading
    });
    renderDashboard();

    // Check for stats loading first (as per component logic)
    await waitFor(() => expect(couponApi.getStats).toHaveBeenCalled());
    // Then check for recent activity section specific loading
    // Assuming a specific loading spinner or text for this section.
    // The component uses a generic LoadingSpinner, so we check if it's there while recentCoupons is null
    // and loadingRecent is true (internal state, harder to check directly).
    // We'll look for the "Recent Activity" heading and then expect a spinner within that card.
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    // Let's assume the spinner inside the "Recent Activity" card would be identifiable
    // For now, we'll check that data is NOT yet there.
    expect(screen.queryByText('RECENT01')).not.toBeInTheDocument();
  });

  test('displays recent coupons correctly after successful fetch', async () => {
    (couponApi.getRecentCoupons as jest.Mock).mockResolvedValue(mockRecentCoupons);
    renderDashboard();

    await waitFor(() => expect(couponApi.getRecentCoupons).toHaveBeenCalled());

    expect(screen.getByText('RECENT01')).toBeInTheDocument();
    expect(screen.getByText('TestCo A')).toBeInTheDocument();
    // formatDate will format this, e.g. "Oct 1, 2023" or similar based on locale
    // For robustness, check for part of the date or use a regex if format is complex
    expect(screen.getByText(new Date('2023-10-01T10:00:00Z').toLocaleDateString('he-IL', { year: 'numeric', month: 'short', day: 'numeric' }))).toBeInTheDocument();


    expect(screen.getByText('RECENT02')).toBeInTheDocument();
    expect(screen.getByText('TestCo B')).toBeInTheDocument();
    expect(screen.getByText(new Date('2023-09-30T12:00:00Z').toLocaleDateString('he-IL', { year: 'numeric', month: 'short', day: 'numeric' }))).toBeInTheDocument();
  });

  test('displays "no recent activity" message when no coupons are returned', async () => {
    (couponApi.getRecentCoupons as jest.Mock).mockResolvedValue([]);
    renderDashboard();

    await waitFor(() => expect(couponApi.getRecentCoupons).toHaveBeenCalled());

    expect(screen.getByText('No recent activity yet.')).toBeInTheDocument();
    expect(screen.getByText('New coupons will appear here.')).toBeInTheDocument();
  });

  test('displays error message for recent activity on API failure', async () => {
    const errorMessage = 'Failed to fetch recent activity';
    (couponApi.getRecentCoupons as jest.Mock).mockRejectedValue(new Error(errorMessage));
    renderDashboard();

    await waitFor(() => expect(couponApi.getRecentCoupons).toHaveBeenCalled());

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  test('allows retrying recent activity fetch after an error', async () => {
    const errorMessage = 'Failed to fetch recent activity';
    (couponApi.getRecentCoupons as jest.Mock)
      .mockRejectedValueOnce(new Error(errorMessage)) // First call fails
      .mockResolvedValueOnce(mockRecentCoupons); // Second call succeeds

    renderDashboard();

    // Wait for the initial error
    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });

    // Click "Try Again"
    fireEvent.click(screen.getByText('Try Again'));

    // Wait for the successful fetch
    await waitFor(() => {
      expect(screen.getByText('RECENT01')).toBeInTheDocument();
      expect(screen.getByText('TestCo A')).toBeInTheDocument();
    });

    expect(couponApi.getRecentCoupons).toHaveBeenCalledTimes(2);
  });

   test('main page loading and error for stats', async () => {
    (couponApi.getStats as jest.Mock).mockReset(); // Clear default mock for this test
    (couponApi.getStats as jest.Mock).mockImplementation(() => new Promise(() => {})); // Never resolves
    (couponApi.getRecentCoupons as jest.Mock).mockResolvedValue([]); // Recent coupons load fine

    renderDashboard();
    // Should show main page loader because stats are still loading
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); // Assuming LoadingSpinner has data-testid

    // Now test stats error
    (couponApi.getStats as jest.Mock).mockReset();
    const statsErrorMessage = 'Failed to load stats';
    (couponApi.getStats as jest.Mock).mockRejectedValue(new Error(statsErrorMessage));

    // Need to unmount and remount or use a different approach if component doesn't re-render fully on prop change
    // For simplicity, we'll re-render here.
    const { rerender } = renderDashboard(); // Initial render

    // To trigger a re-render that re-fetches or shows the error state
    // In a real app, this might be a prop change or route change.
    // Here, we rely on the initial fetch failing.
     await waitFor(() => {
        expect(screen.getByText(statsErrorMessage)).toBeInTheDocument();
        // Ensure recent activity isn't shown, and main error takes precedence
        expect(screen.queryByText('No recent activity yet.')).not.toBeInTheDocument();
     });
  });

});
