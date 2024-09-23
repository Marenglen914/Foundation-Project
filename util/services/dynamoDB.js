const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB clients
const dynamoDB = new DynamoDBClient({ region: 'us-east-1' });
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDB);

// Create a new user
const createUser = async (user) => {
    const params = {
        TableName: 'Users',  // Ensure this table exists
        Item: {
            username: user.username,
            password: user.password,
            role: user.role
        }
    };

    try {
        await ddbDocClient.send(new PutCommand(params));
        console.log('User created successfully');
    } catch (err) {
        console.error('Error creating user:', err);
        throw new Error('Could not create user in DynamoDB');  // Throw a more detailed error
    }
};

// Get a user by username
const getUserByUsername = async (username) => {
    const params = {
        TableName: 'Users',  // Ensure this table exists
        Key: {
            username: username
        }
    };

    try {
        const data = await ddbDocClient.send(new GetCommand(params));
        return data.Item;
    } catch (err) {
        console.error('Error getting user by username:', err);
        throw new Error('Could not retrieve user from DynamoDB');
    }
};

// Create a new ticket
const createTicket = async (ticket) => {
    const params = {
        TableName: 'Tickets',
        Item: {
            ticketId: ticket.ticketId,
            username: ticket.username,
            amount: ticket.amount,
            description: ticket.description,
            status: 'Pending',  // Default status
            createdAt: new Date().toISOString()
        }
    };

    try {
        await ddbDocClient.send(new PutCommand(params));
        console.log('Ticket created successfully');
    } catch (err) {
        console.error('Error creating ticket:', err);
        throw new Error('Could not create ticket in DynamoDB');
    }
};

// Get all pending tickets (for managers)
const getPendingTickets = async () => {
    const params = {
        TableName: 'Tickets',
        FilterExpression: '#status = :statusVal',
        ExpressionAttributeNames: {
            '#status': 'status'
        },
        ExpressionAttributeValues: {
            ':statusVal': 'Pending'
        }
    };

    try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        return data.Items;
    } catch (err) {
        console.error('Error getting tickets:', err);
        throw new Error('Could not retrieve pending tickets from DynamoDB');
    }
};

// Process (approve/deny) a ticket
const processTicket = async (ticketId, status) => {
    const params = {
        TableName: 'Tickets',
        Key: {
            ticketId: ticketId
        },
        UpdateExpression: 'SET #status = :statusVal',
        ExpressionAttributeNames: {
            '#status': 'status'
        },
        ExpressionAttributeValues: {
            ':statusVal': status
        },
        ConditionExpression: '#status = :pendingVal',  // Ensure the ticket is still pending
        ExpressionAttributeValues: {
            ':pendingVal': 'Pending'
        }
    };

    try {
        await ddbDocClient.send(new UpdateCommand(params));
        console.log(`Ticket ${ticketId} processed as ${status}`);
    } catch (err) {
        console.error('Error processing ticket:', err);
        throw new Error('Could not process ticket in DynamoDB');
    }
};

// Get tickets by username (for viewing submitted tickets)
const getTicketsByUsername = async (username) => {
    const params = {
        TableName: 'Tickets',
        FilterExpression: 'username = :usernameVal',
        ExpressionAttributeValues: {
            ':usernameVal': username
        }
    };

    try {
        const data = await ddbDocClient.send(new ScanCommand(params));
        return data.Items;
    } catch (err) {
        console.error('Error getting tickets by username:', err);
        throw new Error('Could not retrieve tickets from DynamoDB');
    }
};

// Export all the functions for use in other files
module.exports = { createUser, getUserByUsername, createTicket, getPendingTickets, processTicket, getTicketsByUsername };
