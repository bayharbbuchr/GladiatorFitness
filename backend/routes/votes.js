const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const router = express.Router();

// Get battles available for voting
router.get('/pending', async (req, res) => {
  try {
    const userId = req.user.id;

    const pendingVotes = await pool.query(`
      SELECT DISTINCT b.id, b.challenge_id, b.status, b.started_at,
             b.user1_video_url, b.user2_video_url,
             c.title as challenge_title, c.description, c.duration_sec,
             u1.display_name as user1_name, u1.avatar_url as user1_avatar,
             u2.display_name as user2_name, u2.avatar_url as user2_avatar,
             vgm.group_id,
             CASE WHEN v.id IS NOT NULL THEN true ELSE false END as already_voted
      FROM voting_group_members vgm
      JOIN battles b ON vgm.battle_id = b.id
      JOIN challenges c ON b.challenge_id = c.id
      JOIN users u1 ON b.user1_id = u1.id
      JOIN users u2 ON b.user2_id = u2.id
      LEFT JOIN votes v ON (v.battle_id = b.id AND v.voter_id = $1)
      WHERE vgm.user_id = $1 
      AND vgm.role = 'voter'
      AND b.status = 'pending'
      AND b.user1_video_url IS NOT NULL 
      AND b.user2_video_url IS NOT NULL
      ORDER BY b.started_at ASC
    `, [userId]);

    res.json({
      success: true,
      pending_votes: pendingVotes.rows
    });
  } catch (error) {
    console.error('Get pending votes error:', error);
    res.status(500).json({ message: 'Server error fetching pending votes' });
  }
});

// Submit a vote
router.post('/:battleId/vote', [
  body('voted_for_id').isUUID(),
  body('feedback').optional().isLength({ max: 500 })
], async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { battleId } = req.params;
    const { voted_for_id, feedback } = req.body;
    const voterId = req.user.id;

    // Verify user is eligible to vote on this battle
    const eligibility = await client.query(`
      SELECT vgm.group_id, b.user1_id, b.user2_id, b.status
      FROM voting_group_members vgm
      JOIN battles b ON vgm.battle_id = b.id
      WHERE vgm.user_id = $1 
      AND vgm.role = 'voter' 
      AND b.id = $2
    `, [voterId, battleId]);

    if (eligibility.rows.length === 0) {
      return res.status(403).json({ message: 'You are not eligible to vote on this battle' });
    }

    const { group_id, user1_id, user2_id, status } = eligibility.rows[0];

    if (status !== 'pending') {
      return res.status(400).json({ message: 'This battle is not ready for voting' });
    }

    // Verify voted_for_id is one of the battle participants
    if (voted_for_id !== user1_id && voted_for_id !== user2_id) {
      return res.status(400).json({ message: 'Invalid vote target' });
    }

    // Check if user already voted on this battle
    const existingVote = await client.query(`
      SELECT id FROM votes WHERE voter_id = $1 AND battle_id = $2
    `, [voterId, battleId]);

    if (existingVote.rows.length > 0) {
      return res.status(400).json({ message: 'You have already voted on this battle' });
    }

    // Submit the vote
    await client.query(`
      INSERT INTO votes (battle_id, voter_id, voted_for_id, group_id, feedback)
      VALUES ($1, $2, $3, $4, $5)
    `, [battleId, voterId, voted_for_id, group_id, feedback]);

    // Check if all votes are in (need 8 votes per battle)
    const voteCount = await client.query(`
      SELECT COUNT(*) as vote_count FROM votes WHERE battle_id = $1
    `, [battleId]);

    const currentVotes = parseInt(voteCount.rows[0].vote_count);

    if (currentVotes >= 8) {
      // All votes are in, determine winner
      const voteResults = await client.query(`
        SELECT voted_for_id, COUNT(*) as votes
        FROM votes 
        WHERE battle_id = $1 
        GROUP BY voted_for_id
        ORDER BY votes DESC
      `, [battleId]);

      const winner = voteResults.rows[0];
      const winnerId = winner.voted_for_id;

      // Update battle with winner
      await client.query(`
        UPDATE battles 
        SET winner_id = $1, status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [winnerId, battleId]);

      // Update user stats
      await client.query(`
        UPDATE users 
        SET wins = wins + 1, 
            points = points + 100,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [winnerId]);

      const loserId = winnerId === user1_id ? user2_id : user1_id;
      await client.query(`
        UPDATE users 
        SET losses = losses + 1,
            points = GREATEST(points - 50, 0),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [loserId]);

      // Check for tier/level progression
      await updateUserTier(client, winnerId);
      await updateUserTier(client, loserId);

      // Check if all battles in the group are completed
      const groupBattles = await client.query(`
        SELECT COUNT(*) as total, 
               COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
        FROM battles b
        JOIN voting_group_members vgm ON b.id = vgm.battle_id
        WHERE vgm.group_id = $1 AND vgm.role = 'competitor'
      `, [group_id]);

      const { total, completed } = groupBattles.rows[0];

      if (parseInt(total) === parseInt(completed)) {
        // All battles completed, close the voting group
        await client.query(`
          UPDATE voting_groups SET status = 'completed' WHERE id = $1
        `, [group_id]);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Vote submitted successfully',
      votes_remaining: Math.max(0, 8 - currentVotes - 1),
      battle_completed: currentVotes >= 7
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Submit vote error:', error);
    res.status(500).json({ message: 'Server error submitting vote' });
  } finally {
    client.release();
  }
});

// Helper function to update user tier based on points
async function updateUserTier(client, userId) {
  const user = await client.query(`
    SELECT tier, level, points FROM users WHERE id = $1
  `, [userId]);

  if (user.rows.length === 0) return;

  const { tier, level, points } = user.rows[0];
  
  // Define tier thresholds
  const tierLevels = {
    'Bronze': { min: 0, max: 499 },
    'Silver': { min: 500, max: 999 },
    'Gold': { min: 1000, max: 1999 },
    'Platinum': { min: 2000, max: 3499 },
    'Diamond': { min: 3500, max: 4999 },
    'Gladiator': { min: 5000, max: Infinity }
  };

  let newTier = tier;
  let newLevel = level;

  // Check for tier promotion (can only go up)
  for (const [tierName, range] of Object.entries(tierLevels)) {
    if (points >= range.min && points <= range.max) {
      newTier = tierName;
      break;
    }
  }

  // Level adjustments within tier
  if (newTier === tier) {
    // Same tier, adjust level based on recent performance
    const levelThreshold = 200; // Points needed to advance/drop a level
    
    if (points >= (level * levelThreshold)) {
      newLevel = Math.min(5, level + 1);
    } else if (points < ((level - 1) * levelThreshold)) {
      newLevel = Math.max(1, level - 1);
    }
  } else {
    // New tier, start at level 5
    newLevel = 5;
  }

  if (newTier !== tier || newLevel !== level) {
    await client.query(`
      UPDATE users 
      SET tier = $1, level = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [newTier, newLevel, userId]);
  }
}

// Get voting history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const history = await pool.query(`
      SELECT v.id, v.battle_id, v.feedback, v.created_at,
             b.status as battle_status, b.winner_id,
             c.title as challenge_title,
             u.display_name as voted_for_name,
             CASE WHEN b.winner_id = v.voted_for_id THEN true ELSE false END as vote_correct
      FROM votes v
      JOIN battles b ON v.battle_id = b.id
      JOIN challenges c ON b.challenge_id = c.id
      JOIN users u ON v.voted_for_id = u.id
      WHERE v.voter_id = $1
      ORDER BY v.created_at DESC
      LIMIT $2
    `, [userId, parseInt(limit)]);

    res.json({
      success: true,
      voting_history: history.rows
    });
  } catch (error) {
    console.error('Get voting history error:', error);
    res.status(500).json({ message: 'Server error fetching voting history' });
  }
});

module.exports = router; 