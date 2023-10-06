const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { MongoClient } = require('mongodb');

const app = express();
const uri = "mongodb+srv://rowanander7:assignment2@assignmentcluster.8jwajhd.mongodb.net/?retryWrites=true&w=majority";
const PORT = 3000;

let db;

// Middleware setup
app.use(cors());
app.use(express.json());

// Initialize connection to MongoDB Atlas
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Connect to MongoDB and start the server
client.connect()
    .then(() => {
        console.log("Connected to MongoDB Atlas");
        db = client.db("assignmentCluster");
        createSuperAdmin();

        // Start the server after MongoDB connection is established
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error("Failed to connect to MongoDB:", err);
        process.exit(1);
    });

const createSuperAdmin = async () => {
    const superAdminEmail = "super@admin.com";
    const plainTextPassword = "123";

    const user = await db.collection('users').findOne({ email: superAdminEmail });
    if (!user) {
        const hashedPassword = await bcrypt.hash(plainTextPassword, 10);
        await db.collection('users').insertOne({
            username: "super",
            email: superAdminEmail,
            password: hashedPassword,
            roles: "Super Admin",
            groups: ""
        });
        console.log("Super Admin created");
    } else {
        console.log("Super Admin already exists");
    }
};

// Long Polling Logic
let events = [];
let clients = [];

app.get('/subscribe', async (req, res, next) => {
    const { lastEventId } = req.query;
    const id = Number(lastEventId);

    if (id && events[id]) {
        return res.json(events[id]);
    }

    const removeClient = (client) => {
        const index = clients.indexOf(client);
        if (index !== -1) {
            clients.splice(index, 1);
        }
    };

    const client = { id, res };
    clients.push(client);

    req.on('close', () => {
        removeClient(client);
    });
});

app.post('/publish', (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).send('No message');
    }

    const id = events.push({ id: events.length, message }) - 1;

    clients.forEach((client) => {
        if (!client.id || client.id < id) {
            client.res.json(events[id]);
            client.res = null;
        }
    });

    clients = clients.filter(client => client.res);

    res.status(200).send('Message published');
});

app.get('/get-groups', async (req, res) => {
    try {
        const groups = await db.collection('groups').find({}).toArray();
        res.status(200).json(groups);
    } catch (err) {
        res.status(500).json({ message: 'Error querying the database' });
    }
});

// Endpoint for account creation
app.post('/create-account', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultRole = "User";
    const defaultGroups = "";

    try {
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: 'Email already exists. Redirecting to login page.' });
        }

        await db.collection('users').insertOne({
            username,
            email,
            password: hashedPassword,
            roles: defaultRole,
            groups: defaultGroups
        });

        res.status(200).json({ message: 'Account created successfully!' });
    } catch (err) {
        res.status(500).json({ message: 'Error inserting data' });
    }
});

// Endpoint for creating groups
app.post('/create-group', async (req, res) => {
    const { name, createdBy } = req.body;
    const createdAt = new Date();

    try {
        const result = await db.collection('groups').insertOne({ name, createdAt, createdBy });
        res.status(200).json({ message: 'Group created successfully!', groupId: result.insertedId });
    } catch (err) {
        res.status(500).json({ message: 'Error inserting data' });
    }
});

app.post('/add-channel-member', async (req, res) => {
    const { channelId, userId } = req.body;
    const joinedAt = new Date();

    try {
        await db.collection('channel_members').insertOne({ channelId, userId, joinedAt });
        res.status(201).json({ message: "Successfully added member to channel" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Endpoint for requesting admin permissions
app.post('/request-group-admin', async (req, res) => {
    const { userId, channelId } = req.body;

    if (!userId || !channelId) {
        return res.status(400).json({ message: 'userId and channelId are required.' });
    }

    try {
        const existingRequest = await db.collection('admin_requests').findOne({ userId, channelId });
        if (existingRequest) {
            return res.status(400).json({ message: 'Request already exists' });
        }

        const result = await db.collection('admin_requests').insertOne({ userId, channelId, status: 'pending' });
        res.json({ message: 'Admin request received', requestId: result.insertedId });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint for fetching all admin requests
app.get('/get-admin-requests', async (req, res) => {
    try {
        const adminRequests = await db.collection('admin_requests').find({}).toArray();
        res.json({ adminRequests });
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint for creating sub-channels
app.post('/api/subchannel/create', async (req, res) => {
    const { name, channelId, createdBy } = req.body;
    const createdAt = new Date();

    try {
        const result = await db.collection('subchannels').insertOne({ name, channelId, createdAt, createdBy });
        res.status(200).json({ message: 'Sub-channel created successfully!', subchannelId: result.insertedId });
    } catch (err) {
        res.status(500).json({ message: 'Error inserting data' });
    }
});

app.delete('/subchannels/:id', async (req, res) => {
    const subChannelId = req.params.id;
    try {
        await db.collection('messages').deleteMany({ channel_id: subChannelId });
        await db.collection('subchannels').deleteOne({ _id: new ObjectId(subChannelId) });
        res.status(200).send({ message: "Subchannel and related messages deleted successfully." });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Endpoint for fetching sub-channels by channel ID
app.get('/api/subchannels/:channelId', async (req, res) => {
    try {
        const subchannels = await db.collection('subchannels').find({ channel_id: req.params.channelId }).toArray();
        res.json({ message: "success", data: subchannels });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});

// Endpoint for fetching user by ID
app.get('/user/:id', async (req, res) => {
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
        if (user) {
            res.json({ user });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint for fetching channel by ID
app.get('/channel/:id', async (req, res) => {
    try {
        const channel = await db.collection('channels').findOne({ _id: new ObjectId(req.params.id) });
        if (channel) {
            res.status(200).json({ channel });
        } else {
            res.status(404).json({ message: 'Channel not found' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Endpoint for sending messages
app.post('/api/subChannels/:subChannelId/sendMessage', async (req, res) => {
    const { userId, channelId, text } = req.body;
    const timestamp = new Date();
    try {
        const result = await db.collection('messages').insertOne({ userId, channelId, text, timestamp });
        res.status(200).json({ message: 'Message sent successfully!', messageId: result.insertedId });
    } catch (err) {
        res.status(500).json({ message: 'Error inserting message' });
    }
});

// Endpoint for fetching messages
app.get('/api/subChannels/:subChannelId/messages', async (req, res) => {
    try {
        const messages = await db.collection('messages').find({ channel_id: req.params.subChannelId }).toArray();
        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching messages' });
    }
});

// Endpoint for deleting account
app.delete('/api/user/:userId', async (req, res) => {
    try {
        const result = await db.collection('users').deleteOne({ _id: new ObjectId(req.params.userId) });
        if (result.deletedCount === 0) {
            res.status(404).json({ error: "User not found" });
        } else {
            res.status(200).json({ message: 'Successfully deleted user' });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Endpoint for login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.collection('users').findOne({ email });
        if (!user || !await bcrypt.compare(password, user.password)) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }
        const roles = user.roles ? user.roles.split(',') : [];
        res.status(200).json({
            username: user.username,
            email: user.email,
            roles,
            id: user._id
        });
    } catch (err) {
        res.status(500).send('Error while retrieving data');
    }
});
