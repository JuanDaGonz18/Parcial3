
const express = require('express');
const router = express.Router();
const db = require('../db');


router.post('/clear-messages', async (req, res) => {
  try {
    await db.query('DELETE FROM messages');
    res.json({ success: true, message: 'Tabla messages vaciada' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Error al vaciar tabla messages' });
  }
});

module.exports = router;
