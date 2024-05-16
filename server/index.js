const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const axios = require('axios');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const port = 3000;

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'sirken'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1); // Exit the process if connection fails
    } else {
        console.log('Connected to MySQL database!');
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Add CORS configuration for WebSocket (Socket.IO)
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        allowedHeaders: ['Authorization'],
    }
});

// Your Socket.IO logic here
io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

    socket.on('authenticate', (token) => {
        jwt.verify(token, 'secretKey', (err, decoded) => {
            if (err) {
                console.error('Authentication failed:', err);
                return socket.disconnect(true);
            }
            socket.user = decoded;
            console.log(`User authenticated: ${socket.user.username}`);
        });
    });

    socket.on('chat message', (msg) => {
        const sender = socket.user ? socket.user.username : 'Anonymous'; // Default sender if not authenticated || awa ako tryan
        io.emit('chat message', { text: msg, sender });
    });
});

// Authentication Routes
app.post('/register', async (req, res) => {
    const { email, username, password } = req.body; // Include email field in request

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query('INSERT INTO users (email, username, password) VALUES (?, ?, ?)', [email, username, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error creating user:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            console.log('User registered:', result.insertId);
            res.json({ message: 'User registered successfully' });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    connection.query('SELECT * FROM users WHERE username = ?', [username], async (err, result) => {
        if (err) {
            console.error('Error retrieving user:', err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
        if (result.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const user = result[0];

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, username: user.username }, 'secretKey');
        res.json({ token });
    });
});

// Authentication Middleware
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }
    jwt.verify(token, 'secretKey', (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.user = decoded;
        next();
    });
}

// Protected Route
app.get('/dashboard', verifyToken, (req, res) => {
    res.json({ message: 'You are logged in' });
});

// User Routes
app.post('/users', (req, res) => {
    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
    }
    const query = 'INSERT INTO users (username, email) VALUES (?, ?)';
    connection.query(query, [username, email], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to Add User' });
        }
        res.json({ message: 'User Added Successfully' });
    });
});

app.get('/users', (req, res) => {
    const query = 'SELECT id, username, email FROM users'; // Select only necessary fields
    connection.query(query, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to Retrieve Users' });
        }
        res.json(rows);
    });
});

app.put('/users/:id', (req, res) => {
    const { id } = req.params;
    const { username, email } = req.body;
    if (!username || !email) {
        return res.status(400).json({ message: 'Username and email are required' });
    }
    const query = 'UPDATE users SET username=?, email=? WHERE id = ?';
    connection.query(query, [username, email, id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Failed to Update User' });
        }
        res.json({ message: 'User Updated Successfully' });
    });
});

// Spotify API credentials
const CLIENT_ID = 'd109e01fc4bb4ad8836d75db50eedd7c';
const CLIENT_SECRET = '165536612e534bbfb434d14f956178a4';

// Route to handle search
app.get('/search', async (req, res) => {
    try {
        // Get access token using client credentials
        const accessTokenResponse = await axios.post('https://accounts.spotify.com/api/token', null, {
            params: {
                grant_type: 'client_credentials'
            },
            auth: {
                username: CLIENT_ID,
                password: CLIENT_SECRET
            }
        });

        // Extract access token from response
        const accessToken = accessTokenResponse.data.access_token;

        // Make a GET request to the Spotify API using the obtained access token
        const response = await axios.get('https://api.spotify.com/v1/search', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            params: {
                q: req.query.q,
                type: 'track'
            }
        });

        // Send the response received from Spotify API back to the client
        res.json(response.data);
    } catch (error) {
        // If there's an error, log it and send an internal server error response
        console.error('Error searching tracks on Spotify:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}); 

// Start server
server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
