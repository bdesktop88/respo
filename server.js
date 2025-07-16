require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('./db'); // Now using MongoDB via Mongoose

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_strong_secret_key';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(JWT_SECRET).digest();
const IV_LENGTH = 16;

// Middleware
app.use(express.static('public'));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Too many requests. Please try again later.',
});
app.use(limiter);

// Helper functions
function generateUniqueKey() {
    return crypto.randomBytes(8).toString('hex');
}

function generateToken(key) {
    return jwt.sign({ key }, JWT_SECRET);
}

// POST /add-redirect
app.post('/add-redirect', async (req, res) => {
    const { destination } = req.body;

    if (!destination || !/^https?:\/\//.test(destination)) {
        console.log('Invalid destination:', destination);
        return res.status(400).json({ message: 'Invalid destination URL.' });
    }

    const key = generateUniqueKey();
    const token = generateToken(key);

    try {
        await db.addRedirect(key, destination, token);
        const baseUrl = req.protocol + '://' + req.get('host');
        res.json({
            message: 'Redirect added successfully!',
            redirectUrl: `${baseUrl}/${key}?token=${token}`,
            pathRedirectUrl: `${baseUrl}/${key}/${token}`,
        });
    } catch (err) {
        console.error('DB error on addRedirect:', err);
        res.status(500).json({ message: 'Failed to save redirect.' });
    }
});

// GET /:key/:token
app.get('/:key/:token', async (req, res) => {
    const { key, token } = req.params;
    const email = req.query.email || null;
    const userAgent = req.headers['user-agent'] || '';

    if (/bot|crawl|spider|preview/i.test(userAgent)) {
        return res.status(403).send('Access denied.');
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).send('Invalid email format.');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const row = await db.getRedirect(key);

        if (!row) {
            console.log('Redirect not found for key:', key);
            return res.status(404).send('Redirect not found.');
        }

        if (row.token !== token) {
            console.log('Invalid token for key:', key);
            return res.status(403).send('Invalid token.');
        }

        let destination = row.destination;
        if (email) {
            destination = destination.endsWith('/') ? destination + email : `${destination}/${email}`;
        }

        console.log('Redirecting to:', destination);
        res.redirect(destination);
    } catch (err) {
        console.log('JWT verification or DB error:', err.message);
        res.status(403).send('Invalid or expired token.');
    }
});
// GET /redirects - list all redirects
app.get('/redirects', async (req, res) => {
  try {
    const redirects = await db.getAllRedirects();
    res.json(redirects);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch redirects' });
  }
});

// PUT /redirects/:key - edit redirect destination
app.put('/redirects/:key', async (req, res) => {
  const { key } = req.params;
  const { destination } = req.body;
  if (!destination || !/^https?:\/\//.test(destination)) {
    return res.status(400).json({ message: 'Invalid destination URL.' });
  }
  try {
    await db.updateRedirect(key, destination);
    res.json({ message: 'Redirect updated.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update redirect.' });
  }
});

// DELETE /redirects/:key - delete redirect
app.delete('/redirects/:key', async (req, res) => {
  const { key } = req.params;
  try {
    await db.deleteRedirect(key);
    res.json({ message: 'Redirect deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete redirect.' });
  }
});

// 404 fallback
app.use((req, res) => {
    res.status(404).send('Error: Invalid request.');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on https://localhost:${PORT}`);
});
