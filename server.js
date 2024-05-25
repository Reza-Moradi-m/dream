const express = require('express');
const bodyParser = require('body-parser');
const authRoutes = require('./auth');

const app = express();
const port = 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Use the auth routes
app.use('/auth', authRoutes);

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
