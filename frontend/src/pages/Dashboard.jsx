import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Swords, Trophy, Target, Clock, Users } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import { battlesAPI, usersAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { getTierColor, formatDate } from '../lib/utils'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [activeBattles, setActiveBattles] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [statsResponse, battlesResponse] = await Promise.all([
          usersAPI.getStats(),
          battlesAPI.getActiveBattles()
        ])
        
        setStats(statsResponse.data.stats)
        setActiveBattles(battlesResponse.data.battles)
      } catch (error) {
        console.error('Failed to load dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {user?.display_name}! 💪
        </h1>
        <p className="text-purple-100">
          Ready to take on new challenges and climb the leaderboard?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user?.tier}</div>
            <p className="text-xs text-muted-foreground">
              Level {user?.level} • {user?.points} points
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {user?.wins + user?.losses > 0 
                ? Math.round((user?.wins / (user?.wins + user?.losses)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {user?.wins}W - {user?.losses}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Battles</CardTitle>
            <Swords className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBattles.length}</div>
            <p className="text-xs text-muted-foreground">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Streak</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.recent_results?.slice(0, 3).join('') || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 3 battles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Swords className="h-5 w-5" />
              <span>Battle Arena</span>
            </CardTitle>
            <CardDescription>
              Join the battle queue and compete against other gladiators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="gladiator">
              <Link to="/battle">
                <Swords className="mr-2 h-4 w-4" />
                Battle Now
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Voting Center</span>
            </CardTitle>
            <CardDescription>
              Vote on battles and help determine the winners
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full" variant="outline">
              <Link to="/voting">
                <Users className="mr-2 h-4 w-4" />
                Vote on Battles
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Battles */}
      {activeBattles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Active Battles</CardTitle>
            <CardDescription>
              Complete these battles by uploading your videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeBattles.map((battle) => (
                <div
                  key={battle.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{battle.challenge_title}</h4>
                    <p className="text-sm text-gray-500">
                      vs {battle.opponent_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      Started {formatDate(battle.started_at)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge variant={battle.my_video_url ? 'default' : 'outline'}>
                      {battle.my_video_url ? 'Video Submitted' : 'Upload Pending'}
                    </Badge>
                    
                    {!battle.my_video_url && (
                      <Button size="sm" asChild>
                        <Link to="/battle">Upload Video</Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Battle History */}
      {stats?.recent_battles && stats.recent_battles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Battle History</CardTitle>
            <CardDescription>
              Your last few battle results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recent_battles.slice(0, 5).map((battle) => (
                <div
                  key={battle.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <h4 className="font-medium text-sm">{battle.challenge_title}</h4>
                    <p className="text-xs text-gray-500">
                      vs {battle.opponent_name}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={
                        battle.result === 'won' ? 'default' : 
                        battle.result === 'lost' ? 'destructive' : 'secondary'
                      }
                    >
                      {battle.result.toUpperCase()}
                    </Badge>
                    
                    {battle.completed_at && (
                      <span className="text-xs text-gray-400">
                        {formatDate(battle.completed_at)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 