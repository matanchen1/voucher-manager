const request = require('supertest');
const app = require('../app'); // Assuming your Express app is exported from app.js
const { query: dbQuery, pool } = require('../config/database'); // Assuming pool is exported for graceful shutdown

// Helper function to create coupons for testing
const createCoupon = async (coupon) => {
  const {
    id,
    code,
    company,
    type,
    category,
    notes,
    expiration_date,
    original_amount,
    currency = 'NIS',
    product_description,
    date_added = new Date() // Default to now if not provided
  } = coupon;
  const remaining_amount = type === 'money' ? original_amount : null;

  return dbQuery(`
    INSERT INTO coupons (
        id, code, company, type, original_amount, remaining_amount,
        currency, product_description, category, expiration_date, notes, date_added
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `, [
    id, code, company, type, original_amount, remaining_amount,
    currency, product_description, category, expiration_date, notes, date_added
  ]);
};

describe('Coupon API - Recent Endpoint', () => {
  const testCoupons = [
    { id: 'recent-1', code: 'RECENT01', company: 'TestCorp', type: 'money', original_amount: 100, date_added: new Date('2023-01-01T10:00:00Z') },
    { id: 'recent-2', code: 'RECENT02', company: 'TestCorp', type: 'product', product_description: 'Free Tea', date_added: new Date('2023-01-02T10:00:00Z') },
    { id: 'recent-3', code: 'RECENT03', company: 'AnotherCo', type: 'money', original_amount: 50, date_added: new Date('2023-01-03T10:00:00Z') },
    { id: 'recent-4', code: 'RECENT04', company: 'TestCorp', type: 'money', original_amount: 20, date_added: new Date('2023-01-04T10:00:00Z') },
    { id: 'recent-5', code: 'RECENT05', company: 'SuperStore', type: 'product', product_description: 'Free Coffee', date_added: new Date('2023-01-05T10:00:00Z') },
    { id: 'recent-6', code: 'RECENT06', company: 'TestCorp', type: 'money', original_amount: 10, date_added: new Date('2023-01-06T10:00:00Z') },
    { id: 'recent-7', code: 'RECENT07', company: 'OldCoupon', type: 'money', original_amount: 5, date_added: new Date('2022-12-31T10:00:00Z') },
  ];

  beforeAll(async () => {
    // In a real setup, you might point to a separate test database
    // For now, we assume the dev DB is used and we clean up
    await dbQuery('DELETE FROM coupon_usage');
    await dbQuery('DELETE FROM coupons');
  });

  beforeEach(async () => {
    await dbQuery('DELETE FROM coupon_usage');
    await dbQuery('DELETE FROM coupons');
    // Insert test data, unsorted by date_added to ensure endpoint sorts them
    const shuffledCoupons = [...testCoupons].sort(() => Math.random() - 0.5);
    for (const coupon of shuffledCoupons) {
      await createCoupon(coupon);
    }
  });

  afterEach(async () => {
    await dbQuery('DELETE FROM coupon_usage');
    await dbQuery('DELETE FROM coupons');
  });

  afterAll(async () => {
    // Close the database pool
    if (pool && pool.end) {
      await pool.end();
    }
  });

  describe('GET /api/coupons/recent', () => {
    it('should return 200 OK and a JSON array', async () => {
      const response = await request(app)
        .get('/api/coupons/recent')
        .expect('Content-Type', /json/)
        .expect(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return at most 5 coupons', async () => {
      const response = await request(app).get('/api/coupons/recent');
      expect(response.body.length).toBeLessThanOrEqual(5);
      // Ensure we have more than 5 coupons in test data to make this test meaningful
      expect(testCoupons.length).toBeGreaterThan(5);
       // Specifically, it should be 5 if more than 5 are available
      const activeTestCoupons = testCoupons.filter(c => new Date(c.date_added) > new Date('2022-12-31T23:59:59Z')); // Filter out very old ones if any logic changes
      if (activeTestCoupons.length >= 5) {
        expect(response.body.length).toBe(5);
      } else {
        expect(response.body.length).toBe(activeTestCoupons.length);
      }
    });

    it('should return coupons sorted by date_added descending', async () => {
      const response = await request(app).get('/api/coupons/recent');
      const recentCoupons = response.body;
      expect(recentCoupons.length).toBeGreaterThan(0); // Ensure we have data to test sorting

      for (let i = 0; i < recentCoupons.length - 1; i++) {
        const date1 = new Date(recentCoupons[i].date_added);
        const date2 = new Date(recentCoupons[i+1].date_added);
        expect(date1.getTime()).toBeGreaterThanOrEqual(date2.getTime());
      }

      // Verify the top items are indeed the most recent ones from testCoupons
      const sortedTestCoupons = [...testCoupons]
        .sort((a, b) => new Date(b.date_added).getTime() - new Date(a.date_added).getTime())
        .slice(0, 5);

      recentCoupons.forEach((coupon, index) => {
        expect(coupon.id).toBe(sortedTestCoupons[index].id);
        expect(coupon.code).toBe(sortedTestCoupons[index].code);
      });
    });

    it('should return an empty array if no coupons exist', async () => {
      // Clear all coupons first
      await dbQuery('DELETE FROM coupons');
      const response = await request(app).get('/api/coupons/recent');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should include the status field for each coupon', async () => {
        const response = await request(app).get('/api/coupons/recent');
        expect(response.status).toBe(200);
        expect(response.body.length).toBeGreaterThan(0);
        response.body.forEach(coupon => {
          expect(coupon.status).toBeDefined();
          // Add more specific status checks if needed, e.g. for an active coupon
          if (coupon.id === 'recent-6') { // RECENT06 is expected to be active
            expect(coupon.status).toBe('active');
          }
        });
      });
  });
});
