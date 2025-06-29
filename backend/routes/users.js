const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const router = express.Router();

// Update user profile
router.put('/profile', [
  body('display_name').optional().trim().isLength({ min: 2, max: 50 }),
  body('fitness_level').optional().isIn(['Beginner', 'Intermediate', 'Advanced']),
  body('height_cm').optional().isInt({ min: 100, max: 250 }),
  body('weight_kg').optional().isInt({ min: 30, max: 300 }),
  body('age').optional().isInt({ min: 13, max: 100 }),
  body('gender').optional().isIn(['Male', 'Female', 'Other', 'Prefer not to say'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { display_name, fitness_level, height_cm, weight_kg, age, gender, avatar_url } = req.body;
    const userId = req.user.id;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (display_name !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(display_name);
    }
    if (fitness_level !== undefined) {
      updates.push(`fitness_level = $${paramCount++}`);
      values.push(fitness_level);
    }
    if (height_cm !== undefined) {
      updates.push(`height_cm = $${paramCount++}`);
      values.push(height_cm);
    }
    if (weight_kg !== undefined) {
      updates.push(`weight_kg = $${paramCount++}`);
      values.push(weight_kg);
    }
    if (age !== undefined) {
      updates.push(`age = $${paramCount++}`);
      values.push(age);
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramCount++}`);
      values.push(gender);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatar_url);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, display_name, fitness_level, height_cm, weight_kg, age, gender, avatar_url, tier, level, points, wins, losses
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// Get user stats and battle history
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user basic stats
    const userStats = await pool.query(`
      SELECT tier, level, points, wins, losses, created_at
      FROM users WHERE id = $1
    `, [userId]);

    // Get recent battles
    const recentBattles = await pool.query(`
      SELECT b.id, b.status, b.completed_at, c.title as challenge_title,
             CASE 
               WHEN b.winner_id = $1 THEN 'won'
               WHEN b.winner_id IS NOT NULL THEN 'lost'
               ELSE 'pending'
             END as result,
             CASE 
               WHEN b.user1_id = $1 THEN u2.display_name
               ELSE u1.display_name
             END as opponent_name
      FROM battles b
      JOIN challenges c ON b.challenge_id = c.id
      JOIN users u1 ON b.user1_id = u1.id
      JOIN users u2 ON b.user2_id = u2.id
      WHERE b.user1_id = $1 OR b.user2_id = $1
      ORDER BY b.completed_at DESC NULLS LAST, b.started_at DESC
      LIMIT 10
    `, [userId]);

    // Get win/loss streak
    const streakQuery = await pool.query(`
      WITH recent_results AS (
        SELECT 
          CASE 
            WHEN winner_id = $1 THEN 'W'
            WHEN winner_id IS NOT NULL THEN 'L'
            ELSE NULL
          END as result
        FROM battles
        WHERE (user1_id = $1 OR user2_id = $1) AND winner_id IS NOT NULL
        ORDER BY completed_at DESC
        LIMIT 10
      )
      SELECT array_agg(result ORDER BY result) as results
      FROM recent_results
      WHERE result IS NOT NULL
    `, [userId]);

    res.json({
      success: true,
      stats: {
        ...userStats.rows[0],
        recent_battles: recentBattles.rows,
        recent_results: streakQuery.rows[0]?.results || []
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { tier, limit = 50 } = req.query;
    
    let query = `
      SELECT id, display_name, tier, level, points, wins, losses, avatar_url,
             ROW_NUMBER() OVER (ORDER BY 
               CASE tier 
                 WHEN 'Gladiator' THEN 6
                 WHEN 'Diamond' THEN 5
                 WHEN 'Platinum' THEN 4
                 WHEN 'Gold' THEN 3
                 WHEN 'Silver' THEN 2
                 WHEN 'Bronze' THEN 1
               END DESC,
               level ASC,
               points DESC
             ) as rank
      FROM users
    `;
    
    const values = [];
    
    if (tier) {
      query += ` WHERE tier = $1`;
      values.push(tier);
    }
    
    query += ` ORDER BY rank LIMIT $${values.length + 1}`;
    values.push(parseInt(limit));

    const result = await pool.query(query, values);

    res.json({
      success: true,
      leaderboard: result.rows
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

module.exports = router; 