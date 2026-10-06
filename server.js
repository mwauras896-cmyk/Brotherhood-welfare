const express = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Test connection route
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'Connected successfully!', time: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database connection failed', details: err.message });
  }
});

// ==========================================
// MEMBERS API ROUTES
// ==========================================

// Get all members
app.get('/api/members', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY joined_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch members', details: err.message });
  }
});

// Add a new member
app.post('/api/members', async (req, res) => {
  const { name, phone_number, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO members (name, phone_number, email) VALUES ($1, $2, $3) RETURNING *',
      [name, phone_number, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create member', details: err.message });
  }
});

// ==========================================
// CONTRIBUTIONS API ROUTES
// ==========================================

// Get all contributions
app.get('/api/contributions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT contributions.*, members.name AS member_name 
      FROM contributions 
      JOIN members ON contributions.member_id = members.id 
      ORDER BY contribution_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch contributions', details: err.message });
  }
});

// Add a new contribution
app.post('/api/contributions', async (req, res) => {
  const { member_id, amount, payment_method } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO contributions (member_id, amount, payment_method) VALUES ($1, $2, $3) RETURNING *',
      [member_id, amount, payment_method || 'M-Pesa']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record contribution', details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Brotherhood Welfare server running on port ${PORT}`);
});

