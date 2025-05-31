const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const cron = require('node-cron');

// Load environment variables
dotenv.config();

// Import routes and services
const couponRoutes = require('./routes/coupons');
const telegramBot = require('./services/telegramBot');
const { initDatabase } = require('./config/database');
const { checkExpiringCoupons } = require('./services/notificationService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/coupons', couponRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Initialize services
async function startServer() {
    try {
        // Initialize database connection
        await initDatabase();
        console.log('✅ Database connected successfully');

        // Start Telegram bot if token is provided
        if (process.env.TELEGRAM_BOT_TOKEN) {
            telegramBot.start();
            console.log('✅ Telegram bot started');
        } else {
            console.log('⚠️  Telegram bot token not provided, skipping bot initialization');
        }

        // Schedule daily expiration check at 9:00 AM
        cron.schedule('0 9 * * *', () => {
            console.log('🔍 Running daily expiration check...');
            checkExpiringCoupons();
        }, {
            timezone: "Asia/Jerusalem"
        });

        // Start server
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`📱 API available at http://localhost:${PORT}/api`);
            console.log(`🏥 Health check at http://localhost:${PORT}/api/health`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});

startServer(); 