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
          weight_kg: 75
        },
        {
          email: 'sarah@example.com',
          display_name: 'Sarah Fighter',
          fitness_level: 'Advanced',
          height_cm: 165,
          weight_kg: 60
        },
        {
          email: 'mike@example.com',
          display_name: 'Mike Champion',
          fitness_level: 'Beginner',
          height_cm: 175,
          weight_kg: 80
        }
      ];
      
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      for (const user of testUsers) {
        await client.query(`
          INSERT INTO users (email, password_hash, display_name, fitness_level, height_cm, weight_kg)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (email) DO NOTHING
        `, [user.email, hashedPassword, user.display_name, user.fitness_level, user.height_cm, user.weight_kg]);
      }
      
      console.log('✅ Test users created with password: password123');
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