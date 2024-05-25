const express = require('express');
const bcrypt = require('bcrypt'); // for hashing passwords
const pool = require('./db'); // import the database connection

const router = express.Router();

// Define the register route
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if the username or email already exists in the database
        const userCheck = await pool.query(
            'SELECT * FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Insert the new user into the database
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
            [username, email, passwordHash]
        );

        // Respond with the newly created user
        res.status(201).json({ message: 'User registered successfully', user: newUser.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
