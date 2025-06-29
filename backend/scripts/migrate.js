require('dotenv').config();
const { pool } = require('../config/database');

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Enable UUID extension
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        display_name TEXT NOT NULL,
        fitness_level TEXT CHECK (fitness_level IN ('Beginner', 'Intermediate', 'Advanced')),
        height_cm INTEGER,
        weight_kg INTEGER,
        age INTEGER,
        gender TEXT,
        avatar_url TEXT,
        tier TEXT CHECK (tier IN ('Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Gladiator')) DEFAULT 'Bronze',
        level INTEGER CHECK (level BETWEEN 1 AND 5) DEFAULT 5,
        points INTEGER DEFAULT 0,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Challenges table
    await client.query(`
      CREATE TABLE IF NOT EXISTS challenges (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title TEXT NOT NULL,
        description TEXT,
        duration_sec INTEGER,
        difficulty TEXT CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')),
        active BOOLEAN DEFAULT TRUE
      )
    `);
    
    // Voting groups table
    await client.query(`
      CREATE TABLE IF NOT EXISTS voting_groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT CHECK (status IN ('pending', 'active', 'completed')) DEFAULT 'pending'
      )
    `);
    
    // Battles table
    await client.query(`
      CREATE TABLE IF NOT EXISTS battles (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        challenge_id UUID REFERENCES challenges(id),
        user1_id UUID REFERENCES users(id),
        user2_id UUID REFERENCES users(id),
        user1_video_url TEXT,
        user2_video_url TEXT,
        winner_id UUID REFERENCES users(id),
        status TEXT CHECK (status IN ('pending', 'active', 'completed', 'canceled')) DEFAULT 'pending',
        started_at TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);
    
    // Voting group members table
    await client.query(`
      CREATE TABLE IF NOT EXISTS voting_group_members (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        group_id UUID REFERENCES voting_groups(id),
        user_id UUID REFERENCES users(id),
        role TEXT CHECK (role IN ('competitor', 'voter')) NOT NULL,
        battle_id UUID REFERENCES battles(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Votes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        battle_id UUID REFERENCES battles(id),
        voter_id UUID REFERENCES users(id),
        voted_for_id UUID REFERENCES users(id),
        group_id UUID REFERENCES voting_groups(id),
        feedback TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (voter_id, battle_id)
      )
    `);
    
    // Video uploads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS video_uploads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        battle_id UUID REFERENCES battles(id),
        video_url TEXT NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status TEXT CHECK (status IN ('pending', 'approved', 'flagged')) DEFAULT 'pending'
      )
    `);
    
    // Leaderboards table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leaderboards (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        rank INTEGER,
        tier TEXT,
        level INTEGER,
        period TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Flags table
    await client.query(`
      CREATE TABLE IF NOT EXISTS flags (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        battle_id UUID REFERENCES battles(id),
        reason TEXT,
        status TEXT CHECK (status IN ('open', 'resolved', 'dismissed')) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create indexes
    await client.query('CREATE UNIQUE INDEX IF NOT EXISTS one_vote_per_battle ON votes (voter_id, battle_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_leaderboard_period ON leaderboards (period)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_tier_level ON users (tier, level)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_battles_status ON battles (status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_voting_groups_status ON voting_groups (status)');
    
    await client.query('COMMIT');
    console.log('✅ Database tables created successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

createTables(); 