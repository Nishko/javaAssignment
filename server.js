const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database('./mydatabase.db', (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to SQLite database.');
});

// Initialize users table
db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT UNIQUE, password TEXT, roles TEXT, groups TEXT)', (err) => {
    if (err) {
        console.error(err.message);
    }
});

// Initialize groups table (with channels and roles columns)
db.run('CREATE TABLE IF NOT EXISTS groups (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, channels TEXT, created_at TEXT, created_by INTEGER, roles TEXT)', (err) => {
    if (err) {
        console.error(err.message);
    }
});

// Initialize group_members table
db.run('CREATE TABLE IF NOT EXISTS group_members (group_id INTEGER, user_id INTEGER, joined_at TEXT, FOREIGN KEY(group_id) REFERENCES groups(id), FOREIGN KEY(user_id) REFERENCES users(id))', (err) => {
    if (err) {
        console.error(err.message);
    }
});

// Initialize channel_members table
db.run('CREATE TABLE IF NOT EXISTS channel_members (channel_id INTEGER, user_id INTEGER, joined_at TEXT, FOREIGN KEY(channel_id) REFERENCES channels(id), FOREIGN KEY(user_id) REFERENCES users(id))', (err) => {
    if (err) {
        console.error(err.message);
    }
});

// Initialize admin_requests table
db.run('CREATE TABLE IF NOT EXISTS admin_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, channel_id INTEGER, status TEXT)', (err) => {
    if (err) {
        console.error(err.message);
    }
});

// Initialize channels table
db.run('CREATE TABLE IF NOT EXISTS channels (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, group_id INTEGER, FOREIGN KEY(group_id) REFERENCES groups(id))', (err) => {
    if (err) {
        console.error(err.message);
    }
});

// Initialize subchannels table
db.run('CREATE TABLE IF NOT EXISTS subchannels (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, channel_id INTEGER, created_at TEXT, created_by INTEGER, FOREIGN KEY(channel_id) REFERENCES channels(id))', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('subchannels table created or already exists');
    }
});

// Initialize messages table
db.run('CREATE TABLE IF NOT EXISTS messages (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER, channel_id INTEGER, text TEXT, timestamp TEXT, FOREIGN KEY(user_id) REFERENCES users(id), FOREIGN KEY(channel_id) REFERENCES channels(id))', (err) => {
    if (err) {
        console.error(err.message);
    }
});

// Create a Super Admin if not exists
const createSuperAdmin = async () => {
    const superAdminEmail = "super@admin.com";
    const plainTextPassword = "123";

    db.get('SELECT email FROM users WHERE email = ?', [superAdminEmail], async (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }

        if (!row) {
            const hashedPassword = await bcrypt.hash(plainTextPassword, 10);
            const sql = 'INSERT INTO users (username, email, password, roles, groups) VALUES (?, ?, ?, ?, ?)';
            const params = ["super", superAdminEmail, hashedPassword, "Super Admin", ""];

            db.run(sql, params, (err) => {
                if (err) {
                    console.error(err.message);
                    return;
                }
                console.log("Super Admin created");
            });
        } else {
            console.log("Super Admin already exists");
        }
    });
};

createSuperAdmin();

const populateSampleGroups = () => {
    db.get('SELECT COUNT(*) as count FROM groups', (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }

        if (row.count === 0) {
            const sampleGroups = [
                { name: 'Group1', created_at: new Date().toISOString(), created_by: 1, channels: 'Channel 1,Channel 2', roles: 'Super Admin,Group Admin,User' },
                { name: 'Group2', created_at: new Date().toISOString(), created_by: 1, channels: 'Channel 1,Channel 2,Channel 3', roles: 'Super Admin,Group Admin,User' },
                { name: 'Group3', created_at: new Date().toISOString(), created_by: 1, channels: 'Channel 1,Channel 2', roles: 'Super Admin,Group Admin,User' },
                { name: 'Group4', created_at: new Date().toISOString(), created_by: 2, channels: 'Channel 1,Channel 2', roles: 'Super Admin,Group Admin,User' },
            ];

            const sql = 'INSERT INTO groups (name, created_at, created_by, channels, roles) VALUES (?, ?, ?, ?, ?)';

            sampleGroups.forEach(group => {
                db.run(sql, [group.name, group.created_at, group.created_by, group.channels, group.roles], (err) => {
                    if (err) {
                        console.error(err.message);
                    } else {
                        console.log(`Sample group '${group.name}' added`);
                    }
                });
            });
        }
    });
};

populateSampleGroups();

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

app.get('/get-groups', (req, res) => {
    const sql = 'SELECT * FROM groups';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error querying the database' });
        }
        res.status(200).json(rows);
    });
});

// Endpoint for account creation
app.post('/create-account', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultRole = "User";
    const defaultGroups = "";

    db.get('SELECT email FROM users WHERE email = ?', [email], (err, row) => {
        if (err) {
            return res.status(500).json({ message: 'Error querying the database' });
        }

        if (row) {
            return res.status(409).json({ message: 'Email already exists. Redirecting to login page.' });
        }

        const sql = 'INSERT INTO users (username, email, password, roles, groups) VALUES (?, ?, ?, ?, ?)';
        const params = [username, email, hashedPassword, defaultRole, defaultGroups];

        db.run(sql, params, function (err) {
            if (err) {
                return res.status(500).json({ message: 'Error inserting data' });
            }
            res.status(200).json({ message: 'Account created successfully!' });
        });
    });
});

// Endpoint for creating groups
app.post('/create-group', (req, res) => {
    const { name, createdBy } = req.body;
    const createdAt = new Date().toISOString();

    const sql = 'INSERT INTO groups (name, created_at, created_by) VALUES (?, ?, ?)';
    const params = [name, createdAt, createdBy];

    db.run(sql, params, function (err) {
        if (err) {
            return res.status(500).json({ message: 'Error inserting data' });
        }
        res.status(200).json({ message: 'Group created successfully!', groupId: this.lastID });
    });
});

app.post('/add-channel-member', (req, res) => {
    const { channelId, userId } = req.body;
    const joinedAt = new Date().toISOString();

    const sql = `INSERT INTO channel_members (channel_id, user_id, joined_at) VALUES (?, ?, ?)`;
    db.run(sql, [channelId, userId, joinedAt], (err) => {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        return res.status(201).json({ message: "Successfully added member to channel" });
    });
});


// Endpoint for requesting admin permissions
app.post('/request-group-admin', (req, res) => {
    const userId = req.body.userId;
    const channelId = req.body.channelId;

    if (!userId || !channelId) {
        return res.status(400).json({ message: 'userId and channelId are required.' });
    }

    // Check if request already exists
    const checkSql = 'SELECT * FROM admin_requests WHERE user_id = ? AND channel_id = ?';
    db.get(checkSql, [userId, channelId], (err, row) => {
        if (err) {
            console.error(err.message);  // Log the error message to the console
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        if (row) {
            return res.status(400).json({ message: 'Request already exists' });
        }

        // Insert new request into the admin_requests table
        const insertSql = 'INSERT INTO admin_requests (user_id, channel_id, status) VALUES (?, ?, ?)';
        db.run(insertSql, [userId, channelId, 'pending'], function (err) {
            if (err) {
                console.error(err.message);  // Log the error message to the console
                return res.status(500).json({ message: 'Internal Server Error' });
            }

            res.json({ message: 'Admin request received', requestId: this.lastID });
        });
    });
});

// Endpoint for fetching all admin requests
app.get('/get-admin-requests', (req, res) => {
    console.log('Received a GET request for /get-admin-requests');
    const sql = 'SELECT * FROM admin_requests';

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        res.json({ adminRequests: rows });
    });
});

// Endpoint for creating sub-channels
app.post('/api/subchannel/create', (req, res) => {
    const { name, channelId, createdBy } = req.body;
    const createdAt = new Date().toISOString();

    const sql = 'INSERT INTO subchannels (name, channel_id, created_at, created_by) VALUES (?, ?, ?, ?)';
    const params = [name, channelId, createdAt, createdBy];

    db.run(sql, params, function (err) {
        if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ message: 'Error inserting data' });
        }
        console.log(`Sub-channel created with ID: ${this.lastID}`);
        res.status(200).json({ message: 'Sub-channel created successfully!', subchannelId: this.lastID });
    });
});

// Endpoint for fetching sub-channels by channel ID
app.get('/api/subchannels/:channelId', (req, res) => {
    const sql = "SELECT * FROM subchannels WHERE channel_id = ?";
    const params = [req.params.channelId];
    db.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});


// Endpoint for fetching user by ID
app.get('/user/:id', (req, res) => {
    console.log('Received a GET request for /user/:id');
    const userId = req.params.id;

    // SQL Query to get user by ID
    const sql = 'SELECT * FROM users WHERE id = ?';

    db.get(sql, [userId], (err, row) => {
        console.log("Query Result:", row);
        if (err) {
            console.error(err.message);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        if (row) {
            console.log("User found:", row);
            res.json({ user: row });
        } else {
            console.log("User not found");
            res.status(404).json({ message: 'User not found' });
        }
    });
});

// Endpoint for fetching channel by ID
app.get('/channel/:id', (req, res) => {
    console.log(`Received a GET request for /channel/${req.params.id}`);

    const channelId = req.params.id;
    console.log(`Channel ID: ${channelId}`);

    const sql = 'SELECT * FROM channels WHERE id = ?';
    console.log(`Executing SQL query: ${sql} with ID: ${channelId}`);

    console.log("DB configuration:", JSON.stringify(db, null, 2));

    db.get(sql, [channelId], (err, row) => {
        if (err) {
            console.error("SQL Error:", err);
            return res.status(500).json({ message: 'Internal Server Error' });
        }

        console.log("Query Result:", row);

        if (row) {
            console.log("Query Result:", row);
            res.status(200).json({ channel: row });
        } else {
            console.log("Channel not found");
            res.status(404).json({ message: 'Channel not found' });
        }
    });
});

// Endpoint for sending messages
app.post('/api/subChannels/:subChannelId/sendMessage', (req, res) => {
    console.log('Request received for sending message');
    const { userId, channelId, text } = req.body;
    const timestamp = new Date().toISOString();

    // Validate channelId and userId (assuming they should be integers)
    if (!Number.isInteger(Number(channelId)) || !Number.isInteger(Number(userId))) {
        return res.status(400).json({ message: 'Invalid channelId or userId' });
    }

    // Validate text
    if (typeof text !== 'string' || text.length === 0) {
        return res.status(400).json({ message: 'Invalid message text' });
    }

    const sql = 'INSERT INTO messages (user_id, channel_id, text, timestamp) VALUES (?, ?, ?, ?)';
    const params = [userId, channelId, text, timestamp];

    db.run(sql, params, function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error inserting message' });
        }
        res.status(200).json({ message: 'Message sent successfully!', messageId: this.lastID });
    });
});

// Endpoint for fetching messages
app.get('/api/subChannels/:subChannelId/messages', (req, res) => {
    console.log('Request received for fetching messages');
    const channelId = req.params.subChannelId;

    const sql = 'SELECT * FROM messages WHERE channel_id = ?';
    const params = [channelId];

    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error fetching messages' });
        }
        res.status(200).json(rows);
    });
});

// Endpoint for deleting account
app.delete('/api/user/:userId', (req, res) => {
    const userId = req.params.userId;

    db.run(`DELETE FROM users WHERE id = ?`, userId, function (err) {
        if (err) {
            return res.status(400).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: "User not found" });
        } else {
            return res.status(200).json({ message: 'Successfully deleted user' });
        }
    });
});

// Endpoint for login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Received email: ${email}, password: ${password}`);  // Debug log here

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) {
            console.error(err);  // error for debugging
            res.status(500).send('Error while retrieving data');
            return;
        }
        console.log(`Query Result: ${JSON.stringify(row)}`);  // Debug log here

        if (!row || !await bcrypt.compare(password, row.password)) {
            console.log('Failed bcrypt comparison or no such user.');  // Debug log here
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        const roles = row.roles ? row.roles.split(',') : [];  // Convert comma-separated roles into an array
        const userId = row.id;

        console.log('Successful login.');  // Debug log here
        res.status(200).json({
            username: row.username,
            email: row.email,
            roles,  // Send roles
            id: userId  // Send user ID
        });
    });
});


app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

