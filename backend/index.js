// index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const logger = require('./logger');
const authRoutes = require('./routes/auth');
const roomsRoutes = require('./routes/rooms');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/rooms', roomsRoutes);

const port = process.env.PORT || 4000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
}

module.exports = app; // para tests