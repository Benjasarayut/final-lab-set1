require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const { pool } = require('./db/db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', service: 'auth-service' });
});

async function start() {
  let retries = 10;
  while (retries > 0) {
    try { await pool.query('SELECT 1'); break; }
    catch (e) {
      console.log(`[auth-service] Waiting for DB... (${retries} left)`);
      retries--;
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  app.listen(PORT, () => console.log(`[auth-service] Running on :${PORT}`));
}

start();
