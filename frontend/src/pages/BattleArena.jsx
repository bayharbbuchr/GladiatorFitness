import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Swords, Upload, Play, Trophy, Target, Clock, Users } from 'lucide-react'
import { battlesAPI, uploadsAPI } from '../lib/api'
import useAuthStore from '../store/useAuthStore'
import { getTierColor } from '../lib/utils'

export default function BattleArena() {
  const { battleId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  
  const [battle, setBattle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [videoFile, setVideoFile] = useState(null)

  const loadBattleDetails = async () => {
    try {
      setLoading(true)
      
      // Check if this is a test battle
      if (battleId === 'test-battle-123') {
        // Use mock data for test
        setBattle({
          id: 'test-battle-123',
          challenge_id: 'test-challenge',
          status: 'active',
          started_at: new Date(),
          my_video_url: null,
          opponent_video_url: null
        })
        return
      }

      const response = await battlesAPI.getBattleDetails(battleId)
      setBattle(response.data.battle)
    } catch (error) {
      console.error('Error loading battle details:', error)
      // Show error message but don't crash
      alert('Could not load battle details. This might be a test battle or the battle no longer exists.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadBattleDetails()
  }, [battleId])

  const handleVideoUpload = async () => {
    if (!videoFile || !battle) return
    
    try {
      setUploading(true)
      
      // For test battle, just simulate upload
      if (battleId === 'test-battle-123') {
        await new Promise(resolve => setTimeout(resolve, 2000))
        setBattle(prev => ({
          ...prev,
          my_video_url: 'test-video-url'
        }))
        alert('Test video uploaded successfully!')
        return
      }

      // Step 1: Upload video file to get URL
      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('battle_id', battle.id)
      
      const uploadResponse = await uploadsAPI.uploadVideo(formData)
      const videoUrl = uploadResponse.data.video_url
      
      // Step 2: Submit video URL to battle
      await battlesAPI.submitVideo(battle.id, videoUrl)
      
      // Reload battle details to get updated status
      await loadBattleDetails()
      
      alert('Video uploaded successfully! Your proof of victory has been recorded.')
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Error uploading video. Please try again.')
    } finally {
      setUploading(false)
      setVideoFile(null)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file)
    } else {
      alert('Please select a valid video file')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Swords className="h-12 w-12 mx-auto mb-4 animate-spin text-red-500" />
          <p className="text-lg">Loading battle arena...</p>
        </div>
      </div>
    )
  }

  if (!battle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Swords className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <p className="text-lg mb-4">Battle not found</p>
          <Button onClick={() => navigate('/battle')}>
            Return to Battle Page
          </Button>
        </div>
      </div>
    )
  }

  // Mock data for test battle
  const mockOpponent = {
    id: 'opponent-123',
    display_name: 'Sarah Fighter',
    tier: 'Gold',
    level: 3,
    points: 1850,
    wins: 12,
    losses: 2
  }

  const mockChallenge = {
    id: 'test-challenge',
    title: 'Maximum Push-ups in 1 Minute',
    description: 'Complete as many push-ups as possible in 60 seconds with proper form. Record your entire performance from start to finish.',
    duration_sec: 60,
    difficulty: 'Beginner'
  }

  const hasUploadedVideo = battle.my_video_url
  const opponentUploaded = battle.opponent_video_url

  return (
    <div className="space-y-6">
      {/* Arena Header */}
      <div className="arena-header p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              ⚔️ BATTLE ARENA ⚔️
            </h1>
            <p className="text-red-200">
              Battle ID: {battle.id}
            </p>
          </div>
          <div className="text-right">
            <Badge variant="outline" className="text-white border-white">
              {battle.status.toUpperCase()}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Arena League Status */}
        <Card className="arena-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Arena League Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getTierColor('Gold')}`}>
                Gold Tier
              </div>
              <p className="text-2xl font-bold mt-2">Level 3</p>
              <p className="text-gray-400">1,850 Glory Points</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Battle Record</span>
                <span className="font-medium">12 Wins - 2 Losses</span>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-gray-400">85% Win Rate</p>
            </div>
          </CardContent>
        </Card>

        {/* Opponent Information */}
        <Card className="arena-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Opponent</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold">{mockOpponent.display_name}</h3>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getTierColor(mockOpponent.tier)}`}>
                {mockOpponent.tier} Tier
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400">Level</p>
                <p className="font-medium">{mockOpponent.level}</p>
              </div>
              <div>
                <p className="text-gray-400">Points</p>
                <p className="font-medium">{mockOpponent.points}</p>
              </div>
              <div>
                <p className="text-gray-400">Wins</p>
                <p className="font-medium text-green-400">{mockOpponent.wins}</p>
              </div>
              <div>
                <p className="text-gray-400">Losses</p>
                <p className="font-medium text-red-400">{mockOpponent.losses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Challenge Details */}
        <Card className="arena-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Challenge</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">{mockChallenge.title}</h3>
              <p className="text-sm text-gray-400 mb-3">{mockChallenge.description}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Time Limit: {Math.floor(mockChallenge.duration_sec / 60)}:{String(mockChallenge.duration_sec % 60).padStart(2, '0')}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Target className="h-4 w-4" />
                <span>Difficulty: {mockChallenge.difficulty}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Upload Section */}
      <Card className="arena-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Submit Your Victory Proof</span>
          </CardTitle>
          <CardDescription>
            Record yourself completing the challenge and upload the video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!hasUploadedVideo ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-red-500 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <p className="text-lg font-medium mb-2">Upload Your Battle Video</p>
                <p className="text-gray-400 mb-4">
                  Record yourself completing the challenge and upload the video file
                </p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload">
                  <Button asChild>
                    <span>Choose Video File</span>
                  </Button>
                </label>
                {videoFile && (
                  <p className="mt-2 text-sm text-green-400">
                    Selected: {videoFile.name}
                  </p>
                )}
              </div>
              
              {videoFile && (
                <Button 
                  onClick={handleVideoUpload}
                  disabled={uploading}
                  className="w-full battle-button"
                >
                  {uploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Submit Video
                    </>
                  )}
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center p-6 bg-green-900/20 border border-green-700 rounded-lg">
              <Play className="h-12 w-12 mx-auto mb-4 text-green-400" />
              <p className="text-lg font-medium text-green-400 mb-2">Video Submitted!</p>
              <p className="text-gray-400">Your proof of victory has been recorded</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Battle Status */}
      <Card className="arena-card">
        <CardHeader>
          <CardTitle>Battle Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium mb-2">You</h4>
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${hasUploadedVideo ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <p className="text-sm">{hasUploadedVideo ? 'Video Submitted' : 'Pending Upload'}</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Opponent</h4>
              <div className={`w-4 h-4 rounded-full mx-auto mb-2 ${opponentUploaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
              <p className="text-sm">{opponentUploaded ? 'Video Submitted' : 'Pending Upload'}</p>
            </div>
          </div>
          
          {hasUploadedVideo && opponentUploaded && (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg text-center">
              <p className="text-blue-400 font-medium">Both videos submitted! Battle ready for community voting.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-center space-x-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/battle')}
        >
          ← Back to Battle Page
        </Button>
        <Button 
          onClick={() => navigate('/voting')}
        >
          Go to Voting →
        </Button>
      </div>
    </div>
  )
} 