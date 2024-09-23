const express = require('express');
const { createTicket, getPendingTickets, processTicket } = require('../services/dynamoDB');
const { v4: uuidv4 } = require('uuid');  // For generating unique ticket IDs
const jwt = require('jsonwebtoken');
require('dotenv').config();

const router = express.Router();

// Middleware to authenticate and authorize users
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;  // Attach user info to request
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Manager views all pending tickets
router.get('/pending', authenticate, async (req, res) => {
    if (req.user.role !== 'Manager') {
        return res.status(403).json({ error: 'Access denied. Only managers can view pending tickets.' });
    }

    try {
        const tickets = await getPendingTickets();
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving pending tickets' });
    }
});

// Manager processes (approve/deny) a ticket
router.put('/process/:id', authenticate, async (req, res) => {
    if (req.user.role !== 'Manager') {
        return res.status(403).json({ error: 'Access denied. Only managers can process tickets.' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['Approved', 'Denied'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be either "Approved" or "Denied".' });
    }

    try {
        await processTicket(id, status);
        res.status(200).json({ message: `Ticket ${id} ${status}` });
    } catch (error) {
        res.status(500).json({ error: 'Error processing ticket' });
    }
});

// Employee views their submitted tickets
router.get('/history', authenticate, async (req, res) => {
    try {
        const tickets = await getTicketsByUsername(req.user.username);
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving tickets' });
    }
});

module.exports = router;
