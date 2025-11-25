// routes/rooms.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('./authMiddleware');
const bcrypt = require('bcryptjs');
const logger = require('../logger');

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { name, is_private, password } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({ error: 'room name must be at least 3 characters' });
    }

    if (is_private && (!password || password.trim().length < 4)) {
      return res.status(400).json({ error: 'private rooms must include a password of at least 4 characters' });
    }

    const exists = await db.query('SELECT 1 FROM rooms WHERE name = $1', [name.trim()]);
    if (exists.rowCount > 0) {
      return res.status(409).json({ error: 'a room with this name already exists' });
    }

    let hashedPassword = null;
    if (is_private && password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const result = await db.query(
      'INSERT INTO rooms (name, is_private, password, created_by) VALUES ($1, $2, $3, $4) RETURNING id, name, is_private, created_at',
      [name.trim(), !!is_private, hashedPassword, req.user.id]
    );

    res.status(201).json({ room: result.rows[0] });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

router.delete('/del/:id', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;

    // Verificar que la sala existe
    const roomRes = await db.query(
      'SELECT id, created_by FROM rooms WHERE id = $1',
      [roomId]
    );

    if (roomRes.rowCount === 0) {
      return res.status(404).json({ error: 'room not found' });
    }

    const room = roomRes.rows[0];

    // Verificar que el usuario que elimina es el creador
    if (room.created_by !== req.user.id) {
      return res.status(403).json({ error: 'only the creator can delete this room' });
    }

    // Borrar primero los mensajes y miembros (FK constraints)
    await db.query('DELETE FROM messages WHERE room_id = $1', [roomId]);
    await db.query('DELETE FROM room_members WHERE room_id = $1', [roomId]);

    // Borrar la sala
    await db.query('DELETE FROM rooms WHERE id = $1', [roomId]);

    res.json({ message: 'room deleted successfully', room_id: roomId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

router.post('/leave/:id', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;

    // Verificar que el usuario sea miembro
    const exists = await db.query(
      'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, req.user.id]
    );

    if (exists.rowCount === 0) {
      return res.status(400).json({ error: 'you are not a member of this room' });
    }

    // Borrar miembro
    await db.query(
      'DELETE FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, req.user.id]
    );

    return res.json({ message: 'left room successfully' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal error' });
  }
});


router.post('/join', authMiddleware, async (req, res) => {
  try {
    const { room_id, password } = req.body;

    if (!room_id) {
      return res.status(400).json({ error: 'room_id is required' });
    }

    const roomRes = await db.query('SELECT * FROM rooms WHERE id = $1', [room_id]);
    if (roomRes.rowCount === 0) {
      return res.status(404).json({ error: 'room not found' });
    }

    const room = roomRes.rows[0];

    // Check private room password
    if (room.is_private) {
      if (!password) return res.status(401).json({ error: 'password required' });

      const ok = await bcrypt.compare(password, room.password);
      if (!ok) return res.status(401).json({ error: 'invalid password' });
    }

    // Avoid duplicates
    const already = await db.query(
      'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
      [room_id, req.user.id]
    );

    if (already.rowCount > 0) {
      return res.status(409).json({ error: 'you are already a member of this room' });
    }

    await db.query(
      'INSERT INTO room_members (room_id, user_id) VALUES ($1, $2)',
      [room_id, req.user.id]
    );

    res.json({ message: 'joined successfully', room_id });

  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

router.get('/:id/is_member', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;

    const memberRes = await db.query(
      'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
      [roomId, req.user.id]
    );

    res.json({ is_member: memberRes.rowCount > 0 });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal error" });
  }
});

// Listar salas
// GET /rooms
// Retorna todas las salas (sin contraseñas)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, is_private, created_by, created_at
       FROM rooms
       ORDER BY created_at DESC`
    );

    res.json({
      total: result.rows.length,
      rooms: result.rows
    });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Enviar mensaje por REST (para pruebas)
// POST /rooms/:id/messages
// Body: { content: "Texto del mensaje" }
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const roomId = req.params.id;
    const { content } = req.body;
    if (!content || content.trim() === "") {
      return res.status(400).json({ error: 'content required' });
    }

    // Verificar si el cuarto existe
    const roomRes = await db.query('SELECT id, is_private FROM rooms WHERE id = $1', [roomId]);
    if (roomRes.rowCount === 0) {
      return res.status(404).json({ error: 'room not found' });
    }

    // Si es privada, verificar que el usuario pertenece a la sala
    if (roomRes.rows[0].is_private) {
      const memberRes = await db.query(
        'SELECT 1 FROM room_members WHERE room_id = $1 AND user_id = $2',
        [roomId, req.user.id]
      );
      if (memberRes.rowCount === 0) {
        return res.status(403).json({ error: 'not a member of this private room' });
      }
    }

    // Guardar mensaje
    const insertRes = await db.query(
      `INSERT INTO messages (room_id, user_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, room_id, user_id, content, created_at`,
      [roomId, req.user.id, content]
    );

    res.status(201).json({
      message: 'message sent (REST test)',
      data: insertRes.rows[0]
    });
  } catch (err) {
    logger.error(err);
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
    logger.error(err);
    res.status(500).json({ error: 'internal error' });
  }
});

module.exports = router;
