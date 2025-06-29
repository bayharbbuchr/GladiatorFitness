const express = require('express');
const { pool } = require('../config/database');
const router = express.Router();

// Get all active challenges
router.get('/', async (req, res) => {
  try {
    const { difficulty, limit = 20 } = req.query;
    
    let query = 'SELECT * FROM challenges WHERE active = true';
    const values = [];
    
    if (difficulty) {
      query += ' AND difficulty = $1';
      values.push(difficulty);
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${values.length + 1}`;
    values.push(parseInt(limit));

    const result = await pool.query(query, values);

    res.json({
      success: true,
      challenges: result.rows
    });
  } catch (error) {
    console.error('Get challenges error:', error);
    res.status(500).json({ message: 'Server error fetching challenges' });
  }
});

// Get challenge by ID
router.get('/:challengeId', async (req, res) => {
  try {
    const { challengeId } = req.params;

    const result = await pool.query(`
      SELECT * FROM challenges WHERE id = $1 AND active = true
    `, [challengeId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Challenge not found' });
    }

    res.json({
      success: true,
      challenge: result.rows[0]
    });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ message: 'Server error fetching challenge' });
  }
});

// Get daily challenge pool (for matchmaking)
router.get('/daily/pool', async (req, res) => {
  try {
    const { fitness_level } = req.user;

    const result = await pool.query(`
      SELECT * FROM challenges 
      WHERE active = true AND difficulty = $1
      ORDER BY RANDOM()
      LIMIT 5
    `, [fitness_level]);

    res.json({
      success: true,
      daily_pool: result.rows
    });
  } catch (error) {
    console.error('Get daily pool error:', error);
    res.status(500).json({ message: 'Server error fetching daily challenge pool' });
  }
});

module.exports = router; 