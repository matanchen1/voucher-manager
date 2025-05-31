const TelegramBot = require('node-telegram-bot-api');
const { query: dbQuery } = require('../config/database');

class TelegramBotService {
  constructor() {
    this.bot = null;
    this.isStarted = false;
  }

  start() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!token) {
      console.log('⚠️  Telegram bot token not provided, skipping bot initialization');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });
      this.setupCommands();
      this.isStarted = true;
      console.log('✅ Telegram bot started successfully');
    } catch (error) {
      console.error('❌ Failed to start Telegram bot:', error.message);
    }
  }

  setupCommands() {
    if (!this.bot) return;

    // /start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      this.bot.sendMessage(chatId, 
        '🎫 Welcome to Coupon Manager!\n\n' +
        'Available commands:\n' +
        '/add - Add a new coupon\n' +
        '/list [company] - List your coupons\n' +
        '/company <name> - Get coupons by company\n' +
        '/expiring - Show expiring coupons\n' +
        '/stats - Show statistics'
      );
    });

    // /list command
    this.bot.onText(/\/list(?:\s+(.+))?/, async (msg, match) => {
      const chatId = msg.chat.id;
      const company = match[1];
      
      try {
        let query = 'SELECT * FROM coupons WHERE 1=1';
        const params = [];
        
        if (company) {
          query += ' AND LOWER(company) LIKE LOWER($1)';
          params.push(`%${company}%`);
        }
        
        query += ' ORDER BY date_added DESC LIMIT 10';
        
        const result = await dbQuery(query, params);
        
        if (result.rows.length === 0) {
          this.bot.sendMessage(chatId, '📭 No coupons found.');
          return;
        }
        
        let message = company ? `🎫 Coupons for "${company}":\n\n` : '🎫 Your recent coupons:\n\n';
        
        result.rows.forEach((coupon, index) => {
          const status = this.getCouponStatus(coupon);
          const value = coupon.type === 'money' 
            ? `${coupon.remaining_amount} ${coupon.currency || 'NIS'}`
            : coupon.product_description;
            
          message += `${index + 1}. ${coupon.code} - ${coupon.company}\n`;
          message += `   💰 ${value}\n`;
          message += `   📅 Expires: ${coupon.expiration_date || 'No expiration'}\n`;
          message += `   🔍 Status: ${status}\n\n`;
        });
        
        this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error('Error fetching coupons:', error);
        this.bot.sendMessage(chatId, '❌ Error fetching coupons. Please try again.');
      }
    });

    // /company command
    this.bot.onText(/\/company\s+(.+)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const company = match[1];
      
      // Trigger the list command with company filter
      this.bot.emit('message', {
        ...msg,
        text: `/list ${company}`
      });
    });

    // /expiring command
    this.bot.onText(/\/expiring/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const result = await dbQuery(`
          SELECT * FROM coupons 
          WHERE expiration_date IS NOT NULL 
          AND expiration_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
          ORDER BY expiration_date ASC
        `);
        
        if (result.rows.length === 0) {
          this.bot.sendMessage(chatId, '✅ No coupons expiring in the next 7 days!');
          return;
        }
        
        let message = '⏰ Coupons expiring soon:\n\n';
        
        result.rows.forEach((coupon, index) => {
          const daysLeft = Math.ceil(
            (new Date(coupon.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
          );
          
          message += `${index + 1}. ${coupon.code} - ${coupon.company}\n`;
          message += `   ⏳ Expires in ${daysLeft} day(s)\n`;
          message += `   📅 ${coupon.expiration_date}\n\n`;
        });
        
        this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error('Error fetching expiring coupons:', error);
        this.bot.sendMessage(chatId, '❌ Error fetching expiring coupons.');
      }
    });

    // /stats command
    this.bot.onText(/\/stats/, async (msg) => {
      const chatId = msg.chat.id;
      
      try {
        const result = await dbQuery(`
          SELECT 
            COUNT(*) as total_coupons,
            COUNT(CASE WHEN type = 'money' AND remaining_amount > 0 THEN 1 END) as active_money,
            COUNT(CASE WHEN type = 'product' AND is_used = false THEN 1 END) as active_product,
            COALESCE(SUM(CASE WHEN type = 'money' THEN remaining_amount ELSE 0 END), 0) as total_value,
            COUNT(DISTINCT company) as companies
          FROM coupons
        `);
        
        const stats = result.rows[0];
        
        const message = 
          '📊 Your Coupon Statistics:\n\n' +
          `🎫 Total Coupons: ${stats.total_coupons}\n` +
          `💰 Active Money Coupons: ${stats.active_money}\n` +
          `🎁 Active Product Coupons: ${stats.active_product}\n` +
          `💵 Total Value: ${stats.total_value} NIS\n` +
          `🏢 Companies: ${stats.companies}`;
        
        this.bot.sendMessage(chatId, message);
      } catch (error) {
        console.error('Error fetching stats:', error);
        this.bot.sendMessage(chatId, '❌ Error fetching statistics.');
      }
    });
  }

  getCouponStatus(coupon) {
    const now = new Date();
    const expDate = coupon.expiration_date ? new Date(coupon.expiration_date) : null;
    
    if (expDate && expDate <= now) return '❌ Expired';
    if (coupon.type === 'product' && coupon.is_used) return '✅ Used';
    if (coupon.type === 'money' && coupon.remaining_amount <= 0) return '✅ Used';
    if (expDate && expDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) return '⚠️ Expiring Soon';
    return '✅ Active';
  }

  stop() {
    if (this.bot && this.isStarted) {
      this.bot.stopPolling();
      this.isStarted = false;
      console.log('🛑 Telegram bot stopped');
    }
  }
}

const telegramBotService = new TelegramBotService();

module.exports = {
  start: () => telegramBotService.start(),
  stop: () => telegramBotService.stop(),
  bot: telegramBotService.bot
}; 