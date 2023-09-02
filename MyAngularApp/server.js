const express = require('express');
const cors = require('cors'); //Importing CORS library
const session = require('express-session'); //Importing express-session library
const path = require('path');
const app = express();
const port = 3000;

app.use(cors({ credentials: true, origin: 'https://localhost:4200' }));
app.use(express.json());
app.use(session({ secret: 'super-secret-key', resave: false, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, '/MyAngularApp')));
app.use(express.static(path.join(__dirname, 'dist', 'my-angular-app')));


let users = [
    { username: 'rowan', email: 'rowan@gmail.com', password: 'rowan123', id: 1, roles: ['User'], groups: ['group1'] },
    { username: 'joseph', email: 'joseph@gmail.com', password: 'joseph123', id: 2, roles: ['Group Admin'], groups: ['group1'] },
    { username: 'super', email: 'admin@gmail.com', password: '123', id: 3, roles: ['Super Admin'], groups: [] }
]

userGroups = [
    { name: 'Group 1', channels: ['Channel 1', 'Channel 2'] },
    { name: 'Group 2', channels: ['Testing 1', 'Testing 2'] }
];

let groups = [
    { id: '1', name: 'Group 1', channels: ['Channel 1', 'Channel 2'], admins: ['Super Admin'] },
    { id: '2', name: 'Group 2', channels: ['Testing 1', 'Testing 2'], admins: ['Super Admin'] },
];

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        req.session.user = user;
        res.json({ authenticated: true, user });
    } else {
        res.json({ authenticated: false });
    }
});

//Entry point
app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'my-angular-app', 'index.html'));
});

/*app.get('/groups', (req, res) => {
    if (req.session.user) {
        res.json(groups.filter(g => req.session.user.groups.includes(g.name)));
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});
*/
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
