import React, { useState, useEffect } from 'react'
import { Swords, Upload, Users } from 'lucide-react'
import { battlesAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { formatDuration } from '../lib/utils'

export default function Battle() {
  const [activeBattles, setActiveBattles] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [battleState, setBattleState] = useState('ready') // ready, waiting, active

  const handleBattleNow = async () => {
    setIsLoading(true)
    try {
      const response = await battlesAPI.battleNow()
      if (response.data.success) {
        setBattleState(response.data.battle ? 'active' : 'waiting')
        loadActiveBattles()
      }
    } catch (error) {
      console.error('Battle creation failed:', error)
      alert(error.response?.data?.message || 'Failed to join battle')
    } finally {
      setIsLoading(false)
    }
  }

  const loadActiveBattles = async () => {
    try {
      const response = await battlesAPI.getActiveBattles()
      setActiveBattles(response.data.battles)
    } catch (error) {
      console.error('Failed to load battles:', error)
    }
  }

  useEffect(() => {
    loadActiveBattles()
  }, [])

  return (
    <div className="space-y-6">
      {/* Battle Now Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Swords className="h-6 w-6" />
            <span>Battle Arena</span>
          </CardTitle>
          <CardDescription>
            Join the queue and compete against other gladiators in real-time challenges
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {battleState === 'ready' && (
              <div className="space-y-4">
                <div className="text-lg text-gray-600">
                  Ready to prove your strength?
                </div>
                <Button 
                  size="lg" 
                  variant="gladiator"
                  onClick={handleBattleNow}
                  disabled={isLoading}
                  className="px-8 py-4 text-lg"
                >
                  {isLoading ? 'Joining Battle...' : 'Battle Now!'}
                  <Swords className="ml-2 h-5 w-5" />
                </Button>
              </div>
            )}
            
            {battleState === 'waiting' && (
              <div className="space-y-4">
                <Users className="h-12 w-12 mx-auto text-blue-500" />
                <div className="text-lg font-medium">Waiting for opponents...</div>
                <div className="text-gray-600">
                  You're in the matchmaking queue. We'll find you worthy opponents shortly.
                </div>
                <div className="animate-pulse">
                  <div className="h-2 bg-blue-200 rounded-full max-w-xs mx-auto">
                    <div className="h-2 bg-blue-500 rounded-full" style={{ width: '60%' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Battles */}
      {activeBattles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Active Battles</CardTitle>
            <CardDescription>
              Complete these challenges by uploading your videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeBattles.map((battle) => (
                <div key={battle.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{battle.challenge_title}</h3>
                      <p className="text-gray-600 mt-1">{battle.description}</p>
                      <div className="flex items-center space-x-4 mt-3">
                        <Badge variant="outline">
                          vs {battle.opponent_name}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Duration: {formatDuration(battle.duration_sec)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      {battle.my_video_url ? (
                        <Badge variant="default">Video Submitted</Badge>
                      ) : (
                        <div className="space-y-2">
                          <Badge variant="outline">Upload Pending</Badge>
                          <div>
                            <Button size="sm">
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Video
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {battle.opponent_video_url && battle.my_video_url && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm text-blue-700">
                        Both videos submitted! Waiting for community votes...
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Battles Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium mb-2">Join Queue</h4>
              <p className="text-sm text-gray-600">
                Click "Battle Now" to join the matchmaking queue with 9 other fighters
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h4 className="font-medium mb-2">Complete Challenge</h4>
              <p className="text-sm text-gray-600">
                Record yourself completing the assigned fitness challenge
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h4 className="font-medium mb-2">Community Votes</h4>
              <p className="text-sm text-gray-600">
                Other users vote on your performance to determine the winner
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 