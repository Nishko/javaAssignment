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

// Endpoint for account creation
app.post('/create-account', async (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultRole = "1";
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

// Endpoint for login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) {
            res.status(500).send('Error while retrieving data');
            return;
        }

        if (!row || !await bcrypt.compare(password, row.password)) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

        res.status(200).json({ username: row.username, email: row.email });
    });
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
