const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(bodyParser.json());

app.post('/create-account', (req, res) => {
    console.log('Account creation request:', req.body);
    // In a real-world scenario, you'd store these details in a database.
    res.status(200).send('Account created successfully!');
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
