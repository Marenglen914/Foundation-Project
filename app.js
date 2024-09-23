const express = require('express');
const authRoutes = require('./util/routes/auth');
const ticketRoutes = require('./util/routes/tickets');  // Import ticket routes
require('dotenv').config();

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Authentication routes
app.use('/auth', authRoutes);

// Ticket routes
app.use('/tickets', ticketRoutes);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
