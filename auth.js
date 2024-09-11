const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('./db'); // Connects to the PostgreSQL database
const router = express.Router();
const jwt = require('jsonwebtoken'); // For secure authentication with JWT
require('dotenv').config(); // Load .env variables

// Set up secret key for JWT
const secretKey = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Store in environment variable in production

// Helper function to generate JWT tokens
function generateToken(user) {
    return jwt.sign({ userId: user.id, username: user.username }, secretKey, {
        expiresIn: '1h' // Token expiration time
    });
}

// Middleware to verify JWT tokens
function authenticateToken(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1]; // Expecting 'Bearer <token>'
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
}

// Register new user
router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;
    try {
        // Hash the user's password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user into the database with default 'free' membership
        const result = await pool.query(
            'INSERT INTO users (username, password, email, membership) VALUES ($1, $2, $3, $4) RETURNING id',
            [username, hashedPassword, email, 'free']
        );

        // Generate JWT token for the new user
        const token = generateToken({ id: result.rows[0].id, username });

        res.status(201).json({ userId: result.rows[0].id, token });
    } catch (err) {
        res.status(400).send(err.message);
    }
});

// Login existing user
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Fetch the user by username
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        // Check if user exists and compare passwords
        if (user && await bcrypt.compare(password, user.password)) {
            // Generate JWT token for the user
            const token = generateToken(user);
            res.status(200).json({ userId: user.id, token });
        } else {
            res.status(400).json({ error: 'Invalid credentials' });
        }
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Middleware to protect routes (for paid membership content)
function checkMembership(req, res, next) {
    // Check the user's membership level
    pool.query('SELECT membership FROM users WHERE id = $1', [req.user.userId])
        .then(result => {
            const membership = result.rows[0]?.membership;
            if (membership === 'premium') {
                next(); // Allow access if the user has a premium membership
            } else {
                res.status(403).json({ message: 'You need a premium membership to access this content.' });
            }
        })
        .catch(err => {
            res.status(500).json({ message: 'Server error. Try again later.' });
        });
}

// Route to upgrade membership
router.post('/upgrade-membership', async (req, res) => {
    const { userId, membershipType } = req.body; // e.g., 'premium'
    try {
        const result = await pool.query(
            'UPDATE users SET membership = $1 WHERE id = $2 RETURNING membership',
            [membershipType, userId]
        );
        res.status(200).json({ message: `Membership upgraded to ${result.rows[0].membership}` });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Protected route for premium content (only for premium members)
router.get('/premium-videos', authenticateToken, checkMembership, async (req, res) => {
    try {
        // Retrieve premium videos from the database
        const result = await pool.query('SELECT * FROM videos WHERE is_premium = true');
        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Protected route to access general video content (user must be logged in)
router.get('/protected-content', authenticateToken, async (req, res) => {
    try {
        // Assuming you want to restrict video content access based on some criteria (e.g., membership)
        const result = await pool.query('SELECT * FROM videos WHERE user_id = $1', [req.user.userId]);

        res.status(200).json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Route to stream a video and check membership
router.get('/video/:id', authenticateToken, async (req, res) => {
    const videoId = req.params.id;
    try {
        const user = await pool.query('SELECT membership FROM users WHERE id = $1', [req.user.userId]);
        const video = await pool.query('SELECT * FROM videos WHERE id = $1', [videoId]);

        if (user.rows[0].membership !== 'premium' && video.rows[0].is_premium) {
            return res.status(403).json({ error: 'Upgrade to premium to view this video.' });
        }

        res.status(200).json(video.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

module.exports = router;
