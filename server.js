const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const http = require('http');
const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true
    }
});

const uri = "mongodb+srv://rowanander7:assignment2@assignmentcluster.8jwajhd.mongodb.net/?retryWrites=true&w=majority";
const PORT = 3000;

let db;

// Check if 'uploads' directory exists, and create it if not
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

const CHAT_IMAGE_DIR = './uploads';

// Middleware setup
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());
app.use(express.json());
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

io.on('connection', (socket) => {
    console.log('A user connected');

    // Socket event for login
    socket.on('login', async (data) => {
        const { email, password } = data;
        try {
            const user = await db.collection('users').findOne({ email });
            if (!user || !await bcrypt.compare(password, user.password)) {
                socket.emit('loginResponse', { error: 'Invalid email or password' });
                return;
            }
            const roles = user.roles ? user.roles.split(',') : [];
            socket.emit('loginResponse', {
                username: user.username,
                email: user.email,
                roles,
                id: user._id,
                avatarPath: user.avatarPath
            });
        } catch (err) {
            socket.emit('loginResponse', { error: 'Error while retrieving data' });
        }
    });

    // Socket event for fetching admin requests
    socket.on('getAdminRequests', async () => {
        try {
            const adminRequests = await db.collection('admin_requests').find({}).toArray();
            socket.emit('adminRequestsData', { adminRequests });
        } catch (err) {
            socket.emit('adminRequestsData', { error: 'Internal Server Error' });
        }
    });

    // Socket event for sending and broadcasting messages
    socket.on('send-message', async (message) => {
        console.log('Received message:', message);
        try {
            // Ensure channelId is provided
            if (!message.channelId) {
                return socket.emit('messageResponse', { error: 'channelId is required' });
            }

            // Save the message to the database
            await db.collection('messages').insertOne(message);

            // Broadcast the message to all connected clients
            io.emit('new-message', message);
        } catch (err) {
            console.error('Error handling send-message:', err);
            socket.emit('messageResponse', { error: 'Error while processing the message' });
        }
    });

    // Socket event for sending images to messages
    socket.on('send-image', (base64Image) => {
        const imageBuffer = Buffer.from(base64Image.split(",")[1], "base64");
        const imagePath = `${CHAT_IMAGE_DIR}/${uuidv4()}.jpg`;
        fs.writeFileSync(imagePath, imageBuffer);
        io.emit('new-image', imagePath.replace('./', '/'));
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Initialize connection to MongoDB Atlas
const client = new MongoClient(uri);

// Migrate and add avatarPath to existing users
async function migrateAddAvatarPath() {
    const DEFAULT_AVATAR_PATH = "/assets/image.jpg";
    const updateResult = await db.collection('users').updateMany(
        { avatarPath: { $exists: false } },
        {
            $set: { avatarPath: DEFAULT_AVATAR_PATH }
        }
    );
    console.log(`Updated ${updateResult.modifiedCount} user(s) with default avatar path.`);
}

// Connect to MongoDB and start the server
client.connect()
    .then(async () => {
        console.log("Connected to MongoDB Atlas");
        db = client.db("assignmentCluster");
        await migrateAddAvatarPath();
        createSuperAdmin();

        // Start the server after MongoDB connection is established
        server.listen(PORT, () => {
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
    console.log("Received request to create sub-channel");
    console.log("Request Body:", req.body);

    const { name, channelId, createdBy } = req.body;
    const createdAt = new Date();

    try {
        const newSubchannel = {
            _id: uuidv4(), // Explicitly set the _id using a UUID
            name,
            channelId,
            createdAt,
            createdBy
        };
        const result = await db.collection('subchannels').insertOne(newSubchannel);
        console.log("Sub-channel inserted successfully:", result);
        res.status(200).json({ message: 'Sub-channel created successfully!', subchannelId: result.insertedId });
    } catch (err) {
        console.error("Error occurred during sub-channel creation:", err);
        if (err.code === 11000) {
            res.status(500).json({ message: 'Duplicate key error. Try again.' });
        } else {
            res.status(500).json({ message: 'Error inserting data' });
        }
    }
});

app.delete('/subchannels/:id', async (req, res) => {
    const subChannelId = req.params.id;
    try {
        const messagesDeleteResult = await db.collection('messages').deleteMany({ channelId: subChannelId });
        const subchannelDeleteResult = await db.collection('subchannels').deleteOne({ _id: subChannelId });


        if (subchannelDeleteResult.deletedCount === 0) {
            return res.status(404).send({ message: "Subchannel not found." });
        }

        res.status(200).send({ message: "Subchannel and related messages deleted successfully." });
    } catch (err) {
        console.error("Error deleting subchannel:", err);
        res.status(500).send(err.message);
    }
});


// Endpoint for fetching sub-channels by channel ID
app.get('/api/subchannel/:channelId', async (req, res) => {
    // Check if channelId is provided
    if (!req.params.channelId) {
        return res.status(400).json({ message: "Channel ID is missing." });
    }

    try {
        // Fetch subchannels without converting channelId to ObjectId
        const subchannels = await db.collection('subchannels').find({ channelId: req.params.channelId }).toArray();
        res.json({ message: "success", data: subchannels });
    } catch (err) {
        res.status(400).json({ "error": err.message });
    }
});



// Endpoint for fetching user by ID
app.get('/user/:id', async (req, res) => {
    try {
        const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
        console.log("Fetched user data:", user);  // Log the entire user data

        if (user) {
            // Check and log if avatarPath exists
            if (user.avatarPath) {
                console.log("avatarPath:", user.avatarPath);
            } else {
                console.log("avatarPath not found for user:", req.params.id);
            }

            res.json({ user });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        console.error("Error fetching user:", err.message);  // More descriptive error logging
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
app.post('/api/subchannel/:subChannelId/sendMessage', async (req, res) => {
    const { userId, text } = req.body;
    const channelId = req.params.subChannelId; // Get the channelId from the URL
    const timestamp = new Date();
    try {
        const result = await db.collection('messages').insertOne({ userId, channelId, text, timestamp });
        res.status(200).json({ message: 'Message sent successfully!', messageId: result.insertedId });
    } catch (err) {
        res.status(500).json({ message: 'Error inserting message' });
    }
});

// Endpoint for fetching messages
app.get('/api/subchannel/:subChannelId/messages', async (req, res) => {
    try {
        // Use the string subChannelId directly in the MongoDB query
        const messages = await db.collection('messages').find({ channelId: req.params.subChannelId }).toArray();
        res.status(200).json(messages);
    } catch (err) {
        console.error("Error fetching messages:", err);  // Log the error for better debugging
        res.status(500).json({ message: 'Error fetching messages' });
    }
})

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

// Endpoint for uploading display image
app.post('/upload-avatar', async (req, res) => {
    console.log("Inside /upload-avatar");
    let uploadedFile = req.files.avatar;
    let userId = req.body.userId;

    // Sanitize the filename: replace spaces with underscores
    let sanitizedFileName = `${userId}_${uploadedFile.name}`.replace(/\s+/g, '_');
    let filePath = `/uploads/${sanitizedFileName}`;

    uploadedFile.mv(`./uploads/${sanitizedFileName}`, async (err) => { // Using the sanitized filename
        if (err) {
            console.error("Error uploading file:", err); // Log the error for debugging
            return res.status(500).send("Server error during file upload."); // Send a generic message
        }

        await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { avatarPath: filePath } });
        res.json({ message: 'File uploaded!', filePath });
    });
});

app.post('/upload-image', async (req, res) => {
    console.log("Received upload-image request");
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let uploadedFile = req.files.image;
    let uniqueFilename = uuidv4() + '-' + uploadedFile.name;
    let filePath = './uploads/' + uniqueFilename;

    uploadedFile.mv(filePath, function (err) {
        if (err) return res.status(500).send(err);
        res.send({ imagePath: '/uploads/' + uniqueFilename }); // Return the path to the client
    });
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
            id: user._id,
            avatarPath: user.avatarPath
        });
    } catch (err) {
        res.status(500).send('Error while retrieving data');
    }
});


