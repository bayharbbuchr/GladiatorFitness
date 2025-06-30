const express = require('express');
const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const router = express.Router();

// Create a new battle (Battle Now functionality)
router.post('/battle-now', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.user.id;
    const { fitness_level } = req.user;

    // Check if user is already in an active battle
    const activeBattle = await client.query(`
      SELECT b.id, b.challenge_id, b.status, c.title, c.description, c.duration_sec,
             CASE WHEN b.user1_id = $1 THEN u2.display_name ELSE u1.display_name END as opponent_name
      FROM battles b
      JOIN challenges c ON b.challenge_id = c.id
      JOIN users u1 ON b.user1_id = u1.id
      JOIN users u2 ON b.user2_id = u2.id
      WHERE (b.user1_id = $1 OR b.user2_id = $1) 
      AND b.status IN ('pending', 'active')
    `, [userId]);

    if (activeBattle.rows.length > 0) {
      await client.query('COMMIT');
      return res.json({
        success: true,
        message: 'You have an active battle',
        battle: activeBattle.rows[0]
      });
    }

    // Check if user is already in a pending voting group
    const activeGroup = await client.query(`
      SELECT vg.group_id, COUNT(vgm.user_id) as member_count
      FROM voting_group_members vg
      LEFT JOIN voting_group_members vgm ON vg.group_id = vgm.group_id
      WHERE vg.user_id = $1 
      AND vg.group_id IN (SELECT id FROM voting_groups WHERE status = 'pending')
      GROUP BY vg.group_id
    `, [userId]);

    if (activeGroup.rows.length > 0) {
      await client.query('COMMIT');
      const waitingFor = 10 - activeGroup.rows[0].member_count;
      return res.json({
        success: true,
        message: 'You are in the matchmaking queue',
        battle: null,
        waiting_for_players: waitingFor
      });
    }

    // Find or create a voting group with available slots
    let votingGroup = await client.query(`
      SELECT vg.id, COUNT(vgm.user_id) as member_count
      FROM voting_groups vg
      LEFT JOIN voting_group_members vgm ON vg.id = vgm.group_id
      WHERE vg.status = 'pending'
      GROUP BY vg.id
      HAVING COUNT(vgm.user_id) < 10
      ORDER BY COUNT(vgm.user_id) DESC
      LIMIT 1
    `);

    let groupId;
    if (votingGroup.rows.length === 0) {
      // Create new voting group
      const newGroup = await client.query(`
        INSERT INTO voting_groups (id, status) 
        VALUES ($1, 'pending') 
        RETURNING id
      `, [uuidv4()]);
      groupId = newGroup.rows[0].id;
    } else {
      groupId = votingGroup.rows[0].id;
    }

    // Add user to voting group as competitor
    await client.query(`
      INSERT INTO voting_group_members (group_id, user_id, role)
      VALUES ($1, $2, 'competitor')
    `, [groupId, userId]);

    // Check if we have enough members to start battles
    const groupMembers = await client.query(`
      SELECT user_id FROM voting_group_members 
      WHERE group_id = $1 AND role = 'competitor'
    `, [groupId]);

    if (groupMembers.rows.length === 10) {
      // We have 10 users, create 5 battles
      const userIds = groupMembers.rows.map(row => row.user_id);
      
      // Shuffle users for random pairing
      for (let i = userIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [userIds[i], userIds[j]] = [userIds[j], userIds[i]];
      }

      // Get a random challenge based on fitness level
      const challengeQuery = await client.query(`
        SELECT id FROM challenges 
        WHERE active = true AND difficulty = $1
        ORDER BY RANDOM() 
        LIMIT 1
      `, [fitness_level]);

      if (challengeQuery.rows.length === 0) {
        throw new Error('No challenges available for your fitness level');
      }

      const challengeId = challengeQuery.rows[0].id;

      // Create 5 battles
      const battles = [];
      for (let i = 0; i < 10; i += 2) {
        const battleId = uuidv4();
        const user1Id = userIds[i];
        const user2Id = userIds[i + 1];

        await client.query(`
          INSERT INTO battles (id, challenge_id, user1_id, user2_id, status, started_at)
          VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP)
        `, [battleId, challengeId, user1Id, user2Id]);

        // Update voting group members with battle assignments
        await client.query(`
          UPDATE voting_group_members 
          SET battle_id = $1 
          WHERE group_id = $2 AND user_id IN ($3, $4)
        `, [battleId, groupId, user1Id, user2Id]);

        battles.push({
          id: battleId,
          user1_id: user1Id,
          user2_id: user2Id
        });
      }

      // Assign remaining users as voters
      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        // Find which battle this user is NOT competing in
        const userBattle = battles.find(b => b.user1_id === userId || b.user2_id === userId);
        
        // Add as voter for all other battles
        for (const battle of battles) {
          if (battle.id !== userBattle.id) {
            await client.query(`
              INSERT INTO voting_group_members (group_id, user_id, role, battle_id)
              VALUES ($1, $2, 'voter', $3)
            `, [groupId, userId, battle.id]);
          }
        }
      }

      // Update voting group status
      await client.query(`
        UPDATE voting_groups SET status = 'active' WHERE id = $1
      `, [groupId]);
    }

    await client.query('COMMIT');

    // Get user's current battle info
    const userBattle = await pool.query(`
      SELECT b.id, b.challenge_id, b.status, c.title, c.description, c.duration_sec,
             CASE WHEN b.user1_id = $1 THEN u2.display_name ELSE u1.display_name END as opponent_name
      FROM battles b
      JOIN challenges c ON b.challenge_id = c.id
      JOIN users u1 ON b.user1_id = u1.id
      JOIN users u2 ON b.user2_id = u2.id
      WHERE (b.user1_id = $1 OR b.user2_id = $1) AND b.status = 'active'
    `, [userId]);

    res.json({
      success: true,
      message: groupMembers.rows.length === 10 ? 'Battle started!' : 'Added to matchmaking queue',
      battle: userBattle.rows[0] || null,
      waiting_for_players: 10 - groupMembers.rows.length
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Battle creation error:', error);
    res.status(500).json({ message: 'Server error creating battle' });
  } finally {
    client.release();
  }
});

// Get user's active battles - MUST come before /:battleId route
router.get('/active', async (req, res) => {
  try {
    const userId = req.user.id;

    const battles = await pool.query(`
      SELECT b.id, b.challenge_id, b.status, b.started_at,
             c.title as challenge_title, c.description, c.duration_sec,
             CASE WHEN b.user1_id = $1 THEN u2.display_name ELSE u1.display_name END as opponent_name,
             CASE WHEN b.user1_id = $1 THEN b.user1_video_url ELSE b.user2_video_url END as my_video_url,
             CASE WHEN b.user1_id = $1 THEN b.user2_video_url ELSE b.user1_video_url END as opponent_video_url
      FROM battles b
      JOIN challenges c ON b.challenge_id = c.id
      JOIN users u1 ON b.user1_id = u1.id
      JOIN users u2 ON b.user2_id = u2.id
      WHERE (b.user1_id = $1 OR b.user2_id = $1) 
      AND b.status IN ('active', 'pending')
      ORDER BY b.started_at DESC
    `, [userId]);

    res.json({
      success: true,
      battles: battles.rows
    });
  } catch (error) {
    console.error('Get active battles error:', error);
    res.status(500).json({ message: 'Server error fetching battles' });
  }
});

// Get battle details by ID
router.get('/:battleId', async (req, res) => {
  try {
    const { battleId } = req.params;
    const userId = req.user.id;

    // Get battle details with challenge and opponent info
    const battleQuery = await pool.query(`
      SELECT b.id, b.challenge_id, b.status, b.started_at, b.user1_video_url, b.user2_video_url,
             c.title as challenge_title, c.description, c.duration_sec, c.difficulty,
             u1.id as user1_id, u1.display_name as user1_name, u1.tier as user1_tier, 
             u1.level as user1_level, u1.points as user1_points, u1.wins as user1_wins, u1.losses as user1_losses,
             u2.id as user2_id, u2.display_name as user2_name, u2.tier as user2_tier,
             u2.level as user2_level, u2.points as user2_points, u2.wins as user2_wins, u2.losses as user2_losses
      FROM battles b
      JOIN challenges c ON b.challenge_id = c.id
      JOIN users u1 ON b.user1_id = u1.id
      JOIN users u2 ON b.user2_id = u2.id
      WHERE b.id = $1 AND (b.user1_id = $2 OR b.user2_id = $2)
    `, [battleId, userId]);

    if (battleQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Battle not found or you do not have access' });
    }

    const battle = battleQuery.rows[0];
    
    // Determine which user is the current user and which is the opponent
    const isUser1 = battle.user1_id === userId;
    const currentUser = {
      id: isUser1 ? battle.user1_id : battle.user2_id,
      display_name: isUser1 ? battle.user1_name : battle.user2_name,
      tier: isUser1 ? battle.user1_tier : battle.user2_tier,
      level: isUser1 ? battle.user1_level : battle.user2_level,
      points: isUser1 ? battle.user1_points : battle.user2_points,
      wins: isUser1 ? battle.user1_wins : battle.user2_wins,
      losses: isUser1 ? battle.user1_losses : battle.user2_losses
    };

    const opponent = {
      id: isUser1 ? battle.user2_id : battle.user1_id,
      display_name: isUser1 ? battle.user2_name : battle.user1_name,
      tier: isUser1 ? battle.user2_tier : battle.user1_tier,
      level: isUser1 ? battle.user2_level : battle.user1_level,
      points: isUser1 ? battle.user2_points : battle.user1_points,
      wins: isUser1 ? battle.user2_wins : battle.user1_wins,
      losses: isUser1 ? battle.user2_losses : battle.user1_losses
    };

    const response = {
      battle: {
        id: battle.id,
        challenge_id: battle.challenge_id,
        status: battle.status,
        started_at: battle.started_at,
        user1_video_url: battle.user1_video_url,
        user2_video_url: battle.user2_video_url,
        my_video_url: isUser1 ? battle.user1_video_url : battle.user2_video_url,
        opponent_video_url: isUser1 ? battle.user2_video_url : battle.user1_video_url
      },
      challenge: {
        id: battle.challenge_id,
        title: battle.challenge_title,
        description: battle.description,
        duration_sec: battle.duration_sec,
        difficulty: battle.difficulty
      },
      currentUser,
      opponent
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching battle details:', error);
    res.status(500).json({ message: 'Server error fetching battle details' });
  }
});

// Submit video for battle
router.post('/:battleId/submit-video', async (req, res) => {
  try {
    const { battleId } = req.params;
    const { video_url } = req.body;
    const userId = req.user.id;

    if (!video_url) {
      return res.status(400).json({ message: 'Video URL is required' });
    }

    // Verify user is part of this battle
    const battle = await pool.query(`
      SELECT user1_id, user2_id, status FROM battles WHERE id = $1
    `, [battleId]);

    if (battle.rows.length === 0) {
      return res.status(404).json({ message: 'Battle not found' });
    }

    const { user1_id, user2_id, status } = battle.rows[0];

    if (status !== 'active') {
      return res.status(400).json({ message: 'Battle is not active' });
    }

    if (user1_id !== userId && user2_id !== userId) {
      return res.status(403).json({ message: 'You are not part of this battle' });
    }

    // Update the appropriate video URL
    const videoField = user1_id === userId ? 'user1_video_url' : 'user2_video_url';
    
    await pool.query(`
      UPDATE battles SET ${videoField} = $1 WHERE id = $2
    `, [video_url, battleId]);

    // Record video upload
    await pool.query(`
      INSERT INTO video_uploads (user_id, battle_id, video_url)
      VALUES ($1, $2, $3)
    `, [userId, battleId, video_url]);

    // Check if both videos are submitted to enable voting
    const updatedBattle = await pool.query(`
      SELECT user1_video_url, user2_video_url FROM battles WHERE id = $1
    `, [battleId]);

    const { user1_video_url, user2_video_url } = updatedBattle.rows[0];

    if (user1_video_url && user2_video_url) {
      // Both videos submitted, battle ready for voting
      await pool.query(`
        UPDATE battles SET status = 'pending' WHERE id = $1
      `, [battleId]);
    }

    res.json({
      success: true,
      message: 'Video submitted successfully',
      ready_for_voting: !!(user1_video_url && user2_video_url)
    });

  } catch (error) {
    console.error('Submit video error:', error);
    res.status(500).json({ message: 'Server error submitting video' });
  }
});

module.exports = router; 