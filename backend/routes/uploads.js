const express = require('express');
const multer = require('multer');
const { pool } = require('../config/database');
const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// Cloudinary configuration (optional, for production use)
let cloudinary;
try {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} catch (error) {
  console.log('Cloudinary not configured - using local storage simulation');
}

// Upload video for battle
router.post('/video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const { battle_id } = req.body;
    const userId = req.user.id;

    if (!battle_id) {
      return res.status(400).json({ message: 'Battle ID is required' });
    }

    // Verify user is part of this battle
    const battle = await pool.query(`
      SELECT user1_id, user2_id, status FROM battles WHERE id = $1
    `, [battle_id]);

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

    let videoUrl;

    if (cloudinary && process.env.NODE_ENV === 'production') {
      // Upload to Cloudinary (production)
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              resource_type: 'video',
              folder: 'gladiator/battles',
              transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' }
              ]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(req.file.buffer);
        });

        videoUrl = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Video upload failed' });
      }
    } else {
      // Simulate local storage for development
      const timestamp = Date.now();
      const filename = `battle_${battle_id}_${userId}_${timestamp}.mp4`;
      videoUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${filename}`;
      
      // In a real implementation, you would save the file to disk here
      console.log(`Simulated upload: ${filename} (${req.file.size} bytes)`);
    }

    // Record the upload in the database
    await pool.query(`
      INSERT INTO video_uploads (user_id, battle_id, video_url, status)
      VALUES ($1, $2, $3, 'approved')
    `, [userId, battle_id, videoUrl]);

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      video_url: videoUrl
    });

  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ message: 'Server error uploading video' });
  }
});

// Get user's uploaded videos
router.get('/my-videos', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const videos = await pool.query(`
      SELECT vu.id, vu.video_url, vu.timestamp, vu.status,
             b.id as battle_id, c.title as challenge_title,
             CASE WHEN b.user1_id = $1 THEN u2.display_name ELSE u1.display_name END as opponent_name
      FROM video_uploads vu
      JOIN battles b ON vu.battle_id = b.id
      JOIN challenges c ON b.challenge_id = c.id
      JOIN users u1 ON b.user1_id = u1.id
      JOIN users u2 ON b.user2_id = u2.id
      WHERE vu.user_id = $1
      ORDER BY vu.timestamp DESC
      LIMIT $2
    `, [userId, parseInt(limit)]);

    res.json({
      success: true,
      videos: videos.rows
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Server error fetching videos' });
  }
});

// Delete uploaded video (if battle hasn't started voting)
router.delete('/video/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.id;

    // Get video info
    const video = await pool.query(`
      SELECT vu.*, b.status 
      FROM video_uploads vu
      JOIN battles b ON vu.battle_id = b.id
      WHERE vu.id = $1 AND vu.user_id = $2
    `, [videoId, userId]);

    if (video.rows.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }

    const { battle_id, video_url, status } = video.rows[0];

    if (status === 'pending') {
      return res.status(400).json({ message: 'Cannot delete video - battle is already in voting phase' });
    }

    // Delete from Cloudinary if using cloud storage
    if (cloudinary && process.env.NODE_ENV === 'production') {
      try {
        // Extract public_id from URL for Cloudinary deletion
        const urlParts = video_url.split('/');
        const publicIdWithExt = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExt.split('.')[0];
        await cloudinary.uploader.destroy(`gladiator/battles/${publicId}`, { resource_type: 'video' });
      } catch (deleteError) {
        console.error('Cloudinary delete error:', deleteError);
      }
    }

    // Remove from database
    await pool.query('DELETE FROM video_uploads WHERE id = $1', [videoId]);

    // Clear video URL from battle
    const videoField = userId === video.rows[0].user1_id ? 'user1_video_url' : 'user2_video_url';
    await pool.query(`UPDATE battles SET ${videoField} = NULL WHERE id = $1`, [battle_id]);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ message: 'Server error deleting video' });
  }
});

// Error handling for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large (max 100MB)' });
    }
  }
  next(error);
});

module.exports = router; 