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

// Endpoint for login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    console.log(`Received email: ${email}, password: ${password}`);  // Debug log here

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) {
            console.error(err);  // Log the error for debugging
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

