const express = require('express');
const {
    createTicket, getPendingTickets, attemptProcessTicket,
    getPreviousTickets, getPreviousSubmissions,
    processTicket
} = require('../services/dynamoDB');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const authorizeRole = require('../middleware/authorizeRole');

require('dotenv').config();

const router = express.Router();

// Middleware to authenticate users
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(decoded);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Employee submits a new ticket
router.post('/submit', authenticate, async (req, res) => {
    const { amount, description } = req.body;

    if (!amount) {
        return res.status(400).json({ error: 'Amount is required' });
    }

    if (!description) {
        return res.status(400).json({ error: 'Description is required' });
    }

    const ticket = {
        ticketId: uuidv4(),  // Generate a unique ticket ID
        username: req.user.username,
        amount,
        description,
        status: 'Pending',  // Adding default status
        createdAt: new Date().toISOString()
    };

    try {
        await createTicket(ticket);
        res.status(201).json({ message: 'Ticket submitted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error submitting ticket' });
    }
});

// View pending tickets
router.get('/pending', authenticate, async (req, res) => {
    try {
        const pendingTickets = await getPendingTickets(req.user.username);
        res.status(200).json(pendingTickets);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving pending tickets' });
    }
});

// Employee process attempt
router.put('/attempt-process', authenticate, async (req, res) => {
    const { ticketId } = req.body;

    if (!ticketId) {
        return res.status(400).json({ error: 'Ticket ID is required' });
    }

    try {
        const result = await attemptProcessTicket(ticketId, req.user.username);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error attempting to process the ticket' });
    }
});

// Approve ticket (only Managers)
router.put('/approve', authenticate, authorizeRole(['Manager']), async (req, res) => {
    const { ticketId } = req.body;

    if (!ticketId) {
        return res.status(400).json({ error: 'Ticket ID is required' });
    }

    try {
       //  const result = await approveTicket(ticketId, req.user.username);
       const result = await processTicket(ticketId,"Approved");
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error approving the ticket' });
    }
});

// Deny ticket (only Managers)
router.put('/deny', authenticate, authorizeRole(['Manager']), async (req, res) => {
    const { ticketId } = req.body;

    if (!ticketId) {
        return res.status(400).json({ error: 'Ticket ID is required' });
    }

    try {
        //const result = await denyTicket(ticketId, req.user.username);
        const result = await processTicket(ticketId,"Deny");
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Error denying the ticket' });
    }
});

// View previous tickets
router.get('/previous', authenticate, async (req, res) => {
    try {
        const previousTickets = await getPreviousTickets(req.user.username);
        res.status(200).json(previousTickets);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving previous tickets' });
    }
});

// View previous submissions
router.get('/submissions', authenticate, async (req, res) => {
    try {
        const previousSubmissions = await getPreviousSubmissions(req.user.username);
        res.status(200).json(previousSubmissions);
    } catch (error) {
        res.status(500).json({ error: 'Error retrieving previous submissions' });
    }
});

module.exports = router;


