// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../logger');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || username.trim().length < 3) {
      return res.status(400).json({ error: 'username must be at least 3 characters' });
    }

    if (!password || password.trim().length < 4) {
      return res.status(400).json({ error: 'password must be at least 4 characters' });
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    const result = await db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, created_at',
      [username.trim(), hash]
    );

    res.status(201).json({ user: result.rows[0] });

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'username already taken' });
    }
    logger.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Login -> returns JWT
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    const result = await db.query('SELECT id, username, password_hash FROM users WHERE username = $1', [username]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'invalid credentials' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'invalid credentials' });

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
