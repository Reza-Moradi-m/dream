require('dotenv').config(); // load environment variables from .env
const { Pool } = require('pg');

// Create a new pool instance with your database configuration from environment variables
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

module.exports = pool;
