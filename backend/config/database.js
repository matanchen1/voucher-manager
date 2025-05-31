const { Pool } = require('pg');

// Database connection pool
let pool;

const initDatabase = async () => {
    try {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });

        // Test the connection
        const client = await pool.connect();
        await client.query('SELECT NOW()');
        client.release();
        
        console.log('Database connection established');
        return pool;
    } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
    }
};

const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
};

const getClient = async () => {
    return await pool.connect();
};

const closePool = async () => {
    if (pool) {
        await pool.end();
        console.log('Database pool closed');
    }
};

module.exports = {
    initDatabase,
    query,
    getClient,
    closePool
}; 