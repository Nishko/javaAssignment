const express = require('express');
const cors = require('cors'); //Importing CORS library
const app = express();
const port = 3000;

app.use(cors());

app.get('/', (req, res) => {
    res.send('Testing');
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
