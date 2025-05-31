const { query: dbQuery } = require('../config/database');

// Check for expiring coupons and send notifications
const checkExpiringCoupons = async () => {
  try {
    console.log('🔍 Checking for expiring coupons...');
    
    // Get coupons expiring in the next 7 days
    const expiringResult = await dbQuery(`
      SELECT * FROM coupons 
      WHERE expiration_date IS NOT NULL 
      AND expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      AND ((type = 'product' AND is_used = false) OR (type = 'money' AND remaining_amount > 0))
      ORDER BY expiration_date ASC
    `);

    // Get coupons expiring today
    const todayResult = await dbQuery(`
      SELECT * FROM coupons 
      WHERE expiration_date = CURRENT_DATE
      AND ((type = 'product' AND is_used = false) OR (type = 'money' AND remaining_amount > 0))
    `);

    if (expiringResult.rows.length > 0) {
      console.log(`📅 Found ${expiringResult.rows.length} coupons expiring in the next 7 days`);
      
      // Log expiring coupons
      expiringResult.rows.forEach(coupon => {
        const daysLeft = Math.ceil(
          (new Date(coupon.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
        );
        
        console.log(`⏰ ${coupon.code} (${coupon.company}) expires in ${daysLeft} day(s)`);
      });
    }

    if (todayResult.rows.length > 0) {
      console.log(`🚨 ${todayResult.rows.length} coupons expire TODAY!`);
      
      todayResult.rows.forEach(coupon => {
        console.log(`❗ URGENT: ${coupon.code} (${coupon.company}) expires today!`);
      });
    }

    if (expiringResult.rows.length === 0 && todayResult.rows.length === 0) {
      console.log('✅ No coupons expiring soon');
    }

    // Future: Send notifications via Telegram bot
    // const telegramBot = require('./telegramBot');
    // if (telegramBot.bot && expiringResult.rows.length > 0) {
    //   // Send notification to admin chat
    // }

    return {
      expiringSoon: expiringResult.rows,
      expiringToday: todayResult.rows
    };

  } catch (error) {
    console.error('❌ Error checking expiring coupons:', error);
    throw error;
  }
};

// Check for expired coupons (already expired)
const checkExpiredCoupons = async () => {
  try {
    const result = await dbQuery(`
      SELECT * FROM coupons 
      WHERE expiration_date IS NOT NULL 
      AND expiration_date < CURRENT_DATE
      AND ((type = 'product' AND is_used = false) OR (type = 'money' AND remaining_amount > 0))
      ORDER BY expiration_date DESC
    `);

    if (result.rows.length > 0) {
      console.log(`🗑️  Found ${result.rows.length} expired coupons that are still marked as active`);
    }

    return result.rows;
  } catch (error) {
    console.error('❌ Error checking expired coupons:', error);
    throw error;
  }
};

// Get summary of coupon statuses
const getCouponStatusSummary = async () => {
  try {
    const result = await dbQuery(`
      SELECT 
        COUNT(*) as total_coupons,
        COUNT(CASE 
          WHEN expiration_date IS NOT NULL AND expiration_date <= CURRENT_DATE THEN 1 
        END) as expired,
        COUNT(CASE 
          WHEN expiration_date IS NOT NULL 
          AND expiration_date BETWEEN CURRENT_DATE + 1 AND CURRENT_DATE + INTERVAL '7 days' THEN 1 
        END) as expiring_soon,
        COUNT(CASE 
          WHEN expiration_date IS NOT NULL AND expiration_date = CURRENT_DATE THEN 1 
        END) as expiring_today,
        COUNT(CASE 
          WHEN type = 'product' AND is_used = true THEN 1 
          WHEN type = 'money' AND remaining_amount <= 0 THEN 1 
        END) as used,
        COUNT(CASE 
          WHEN ((type = 'product' AND is_used = false) OR (type = 'money' AND remaining_amount > 0))
          AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE + INTERVAL '7 days') THEN 1 
        END) as active
      FROM coupons
    `);

    return result.rows[0];
  } catch (error) {
    console.error('❌ Error getting coupon status summary:', error);
    throw error;
  }
};

// Send notification about expiring coupons (placeholder for future integration)
const sendExpirationNotification = async (coupons, type = 'expiring') => {
  try {
    if (coupons.length === 0) return;

    const message = type === 'today' 
      ? `🚨 ${coupons.length} coupon(s) expire TODAY!`
      : `⏰ ${coupons.length} coupon(s) expiring in the next 7 days`;

    console.log(`📢 Notification: ${message}`);

    // Future: Implement actual notification sending
    // - Telegram bot message
    // - Email notification
    // - Push notification
    
    return { sent: true, message, count: coupons.length };
  } catch (error) {
    console.error('❌ Error sending expiration notification:', error);
    throw error;
  }
};

// Main function to run all expiration checks
const runExpirationCheck = async () => {
  try {
    console.log('🔄 Starting expiration check...');
    
    const results = await checkExpiringCoupons();
    const summary = await getCouponStatusSummary();
    
    console.log('📊 Coupon Status Summary:', {
      total: summary.total_coupons,
      active: summary.active,
      expiring_today: summary.expiring_today,
      expiring_soon: summary.expiring_soon,
      used: summary.used,
      expired: summary.expired
    });

    // Send notifications if needed
    if (results.expiringToday.length > 0) {
      await sendExpirationNotification(results.expiringToday, 'today');
    }
    
    if (results.expiringSoon.length > 0) {
      await sendExpirationNotification(results.expiringSoon, 'expiring');
    }

    console.log('✅ Expiration check completed');
    return { success: true, results, summary };

  } catch (error) {
    console.error('❌ Expiration check failed:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  checkExpiringCoupons,
  checkExpiredCoupons,
  getCouponStatusSummary,
  sendExpirationNotification,
  runExpirationCheck
}; 