const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./auth');
const path = require('path');

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Use the auth routes
app.use('/auth', authRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
