// routes/rooms.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('./authMiddleware');
const bcrypt = require('bcrypt');

// Create a room
// body: { name, is_private (bool), password (optional) }
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name, is_private, password } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });

    let hashedPassword = null;
    if (is_private && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const result = await db.query(
      'INSERT INTO rooms (name, is_private, password, created_by) VALUES ($1, $2, $3, $4) RETURNING id, name, is_private, created_at',
      [name, !!is_private, hashedPassword, req.user.id]
    );

    res.status(201).json({ room: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Join a room
// body: { room_id, password (if required) }
router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { room_id, password } = req.body;
    if (!room_id) return res.status(400).json({ error: 'room_id required' });

    const roomRes = await db.query('SELECT id, is_private, password FROM rooms WHERE id = $1', [room_id]);
    if (roomRes.rowCount === 0) return res.status(404).json({ error: 'room not found' });
    const room = roomRes.rows[0];

    if (room.is_private) {
      if (!password) return res.status(401).json({ error: 'password required for private room' });
      const match = await bcrypt.compare(password, room.password);
      if (!match) return res.status(401).json({ error: 'invalid password' });
    }

    // Add to room_members if not already
    await db.query(
      'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2) ON CONFLICT (room_id, user_id) DO NOTHING',
      [room_id, req.user.id]
    );

    res.json({ message: 'joined', room_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Get history (paginated)
// query params: ?page=1&page_size=20
router.get('/:id/history', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const pageSize = Math.min(100, Math.max(5, parseInt(req.query.page_size || '20', 10)));
    const offset = (page - 1) * pageSize;

    // Optional: verify user is member OR room is public
    const roomRes = await db.query('SELECT is_private FROM rooms WHERE id = $1', [roomId]);
    if (roomRes.rowCount === 0) return res.status(404).json({ error: 'room not found' });
    const isPrivate = roomRes.rows[0].is_private;

    if (isPrivate) {
      const memberRes = await db.query(
        'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, req.user.id]
      );
      if (memberRes.rowCount === 0) return res.status(403).json({ error: 'not a member of this private room' });
    }

    // fetch messages
    const messagesRes = await db.query(
      `SELECT m.id, m.content, m.created_at, m.user_id, u.username
       FROM messages m
       LEFT JOIN users u ON u.id = m.user_id
       WHERE m.room_id = $1
       ORDER BY m.created_at DESC
       LIMIT $2 OFFSET $3`,
      [roomId, pageSize, offset]
    );

    // total count (optional)
    const countRes = await db.query('SELECT COUNT(*) FROM messages WHERE room_id = $1', [roomId]);
    const total = parseInt(countRes.rows[0].count, 10);

    res.json({
      page,
      page_size: pageSize,
      total,
      messages: messagesRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
