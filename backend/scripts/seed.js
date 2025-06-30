require('dotenv').config();
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Seed sample challenges
    const challenges = [
      {
        title: 'Maximum Push-ups in 1 Minute',
        description: 'Complete as many push-ups as possible in 60 seconds with proper form',
        duration_sec: 60,
        difficulty: 'Beginner'
      },
      {
        title: 'Wall Sit Challenge',
        description: 'Hold a wall sit position for as long as possible',
        duration_sec: 300,
        difficulty: 'Intermediate'
      },
      {
        title: '20 Burpees Speed Challenge',
        description: 'Complete 20 burpees as fast as possible',
        duration_sec: 180,
        difficulty: 'Advanced'
      },
      {
        title: 'Plank Hold Challenge',
        description: 'Hold a plank position for maximum time',
        duration_sec: 300,
        difficulty: 'Intermediate'
      },
      {
        title: 'Jump Squats in 30 Seconds',
        description: 'Complete as many jump squats as possible in 30 seconds',
        duration_sec: 30,
        difficulty: 'Beginner'
      },
      {
        title: 'Mountain Climbers Sprint',
        description: 'Complete 50 mountain climbers as fast as possible',
        duration_sec: 120,
        difficulty: 'Advanced'
      }
    ];
    
    for (const challenge of challenges) {
      await client.query(`
        INSERT INTO challenges (title, description, duration_sec, difficulty)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [challenge.title, challenge.description, challenge.duration_sec, challenge.difficulty]);
    }
    
    // Seed test users (for development only)
    if (process.env.NODE_ENV === 'development') {
      const testUsers = [
        {
          email: 'john@example.com',
          display_name: 'John Warrior',
          fitness_level: 'Intermediate',
          height_cm: 180,
          weight_kg: 75,
          points: 1250,
          wins: 8,
          losses: 3
        },
        {
          email: 'sarah@example.com',
          display_name: 'Sarah Fighter',
          fitness_level: 'Advanced',
          height_cm: 165,
          weight_kg: 60,
          points: 1850,
          wins: 12,
          losses: 2
        },
        {
          email: 'mike@example.com',
          display_name: 'Mike Champion',
          fitness_level: 'Beginner',
          height_cm: 175,
          weight_kg: 80,
          points: 650,
          wins: 4,
          losses: 7
        },
        {
          email: 'alex@example.com',
          display_name: 'Alex Destroyer',
          fitness_level: 'Advanced',
          height_cm: 185,
          weight_kg: 85,
          points: 2100,
          wins: 15,
          losses: 1
        },
        {
          email: 'emma@example.com',
          display_name: 'Emma Storm',
          fitness_level: 'Intermediate',
          height_cm: 170,
          weight_kg: 65,
          points: 1400,
          wins: 9,
          losses: 4
        },
        {
          email: 'david@example.com',
          display_name: 'David Thunder',
          fitness_level: 'Advanced',
          height_cm: 178,
          weight_kg: 72,
          points: 1750,
          wins: 11,
          losses: 3
        },
        {
          email: 'lisa@example.com',
          display_name: 'Lisa Viper',
          fitness_level: 'Intermediate',
          height_cm: 162,
          weight_kg: 58,
          points: 1100,
          wins: 7,
          losses: 5
        },
        {
          email: 'ryan@example.com',
          display_name: 'Ryan Beast',
          fitness_level: 'Beginner',
          height_cm: 182,
          weight_kg: 90,
          points: 450,
          wins: 2,
          losses: 8
        }
      ];
      
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      // Insert users and store their IDs
      const userIds = [];
      for (const user of testUsers) {
        const result = await client.query(`
          INSERT INTO users (email, password_hash, display_name, fitness_level, height_cm, weight_kg, points, wins, losses)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (email) DO UPDATE SET 
            points = EXCLUDED.points,
            wins = EXCLUDED.wins,
            losses = EXCLUDED.losses
          RETURNING id
        `, [user.email, hashedPassword, user.display_name, user.fitness_level, user.height_cm, user.weight_kg, user.points, user.wins, user.losses]);
        
        if (result.rows.length > 0) {
          userIds.push(result.rows[0].id);
        }
      }
      
      // Get challenge IDs
      const challengeResult = await client.query('SELECT id, title FROM challenges ORDER BY id');
      const challenges = challengeResult.rows;
      
      if (userIds.length >= 2 && challenges.length > 0) {
        // Create sample battles
        const sampleBattles = [
          {
            user1_id: userIds[0], // John Warrior
            user2_id: userIds[1], // Sarah Fighter
            challenge_id: challenges[0].id, // Push-ups
            user1_video_url: 'https://sample-videos.com/zip/10/mp4/mp4-15.mp4',
            user2_video_url: 'https://sample-videos.com/zip/10/mp4/mp4-20.mp4',
            status: 'completed', // Ready for voting
            started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
          },
          {
            user1_id: userIds[2], // Mike Champion
            user2_id: userIds[3], // Alex Destroyer
            challenge_id: challenges[1].id, // Wall Sit
            user1_video_url: 'https://sample-videos.com/zip/10/mp4/mp4-25.mp4',
            user2_video_url: 'https://sample-videos.com/zip/10/mp4/mp4-30.mp4',
            status: 'completed', // Ready for voting
            started_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            completed_at: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
          },
          {
            user1_id: userIds[4], // Emma Storm
            user2_id: userIds[5], // David Thunder
            challenge_id: challenges[2].id, // Burpees
            user1_video_url: 'https://sample-videos.com/zip/10/mp4/mp4-35.mp4',
            user2_video_url: null,
            status: 'active', // Emma uploaded but David hasn't
            started_at: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          },
          {
            user1_id: userIds[6], // Lisa Viper
            user2_id: userIds[7], // Ryan Beast
            challenge_id: challenges[3].id, // Plank Hold
            user1_video_url: null,
            user2_video_url: null,
            status: 'active', // Just started, no uploads yet
            started_at: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          },
          {
            user1_id: userIds[1], // Sarah Fighter
            user2_id: userIds[4], // Emma Storm
            challenge_id: challenges[5].id, // Mountain Climbers
            user1_video_url: null,
            user2_video_url: null,
            status: 'pending', // Battle created but not started
            started_at: null,
          },
          {
            user1_id: userIds[0], // John Warrior
            user2_id: userIds[3], // Alex Destroyer
            challenge_id: challenges[4].id, // Jump Squats
            user1_video_url: 'https://sample-videos.com/zip/10/mp4/mp4-40.mp4',
            user2_video_url: 'https://sample-videos.com/zip/10/mp4/mp4-45.mp4',
            status: 'completed',
            started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            winner_id: userIds[3] // Alex won
          }
        ];
        
        const battleIds = [];
        for (const battle of sampleBattles) {
          const battleResult = await client.query(`
            INSERT INTO battles (user1_id, user2_id, challenge_id, user1_video_url, user2_video_url, status, started_at, completed_at, winner_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT DO NOTHING
            RETURNING id
          `, [battle.user1_id, battle.user2_id, battle.challenge_id, battle.user1_video_url, battle.user2_video_url, battle.status, battle.started_at, battle.completed_at || null, battle.winner_id || null]);
          
          if (battleResult.rows.length > 0) {
            battleIds.push(battleResult.rows[0].id);
          }
        }
        
        // Create sample votes for battles ready for voting (completed status)
        if (battleIds.length >= 2) {
          const sampleVotes = [
            // Votes for first battle (John vs Sarah)
            { battle_id: battleIds[0], voter_id: userIds[2], voted_for_id: userIds[1] }, // Mike votes for Sarah
            { battle_id: battleIds[0], voter_id: userIds[3], voted_for_id: userIds[1] }, // Alex votes for Sarah
            { battle_id: battleIds[0], voter_id: userIds[4], voted_for_id: userIds[0] }, // Emma votes for John
            { battle_id: battleIds[0], voter_id: userIds[5], voted_for_id: userIds[1] }, // David votes for Sarah
            
            // Votes for second battle (Mike vs Alex)
            { battle_id: battleIds[1], voter_id: userIds[0], voted_for_id: userIds[3] }, // John votes for Alex
            { battle_id: battleIds[1], voter_id: userIds[1], voted_for_id: userIds[3] }, // Sarah votes for Alex
            { battle_id: battleIds[1], voter_id: userIds[4], voted_for_id: userIds[2] }, // Emma votes for Mike
          ];
          
          for (const vote of sampleVotes) {
            await client.query(`
              INSERT INTO votes (battle_id, voter_id, voted_for_id)
              VALUES ($1, $2, $3)
              ON CONFLICT (voter_id, battle_id) DO NOTHING
            `, [vote.battle_id, vote.voter_id, vote.voted_for_id]);
          }
        }
        
        console.log('✅ Sample battles and votes created');
      }
      
      console.log('✅ Test users created with password: password123');
      console.log('✅ Test data includes:');
      console.log('   - 8 gladiator warriors with battle stats');
      console.log('   - 5 sample battles (active, voting, completed)');
      console.log('   - Sample votes for battle judging');
      console.log('   - Ready for arena combat! ⚔️');
    }
    
    await client.query('COMMIT');
    console.log('✅ Database seeded successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

seedData(); 