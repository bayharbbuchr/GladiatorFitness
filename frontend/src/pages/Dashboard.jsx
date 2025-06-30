import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Swords, Trophy, Target, Clock, Users, Skull, Flame, Shield, Crown, Zap } from 'lucide-react'
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
        console.error('Failed to load arena data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-400 font-bold animate-pulse">Loading the Arena...</div>
      </div>
    )
  }

  const winRate = user?.wins + user?.losses > 0 
    ? Math.round((user?.wins / (user?.wins + user?.losses)) * 100)
    : 0

  return (
    <div className="space-y-8">
      {/* Welcome Section - Arena Introduction */}
      <div className="arena-header rounded-lg p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/50 to-black/50"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <Skull className="h-8 w-8 text-red-400" />
            <h1 className="text-3xl font-bold arena-title">
              Welcome to the Arena, {user?.display_name}! 💀
            </h1>
          </div>
          <p className="text-red-200 text-lg font-semibold">
            The crowd thirsts for blood. Will you give them the spectacle they crave?
          </p>
          <div className="mt-4 flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold">CURRENT CHAMPION TIER: {user?.tier}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-orange-400 font-bold">GLORY POINTS: {user?.points}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Arena Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="arena-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-red-300 uppercase tracking-wider">Warrior Rank</CardTitle>
            <Crown className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{user?.tier}</div>
            <p className="text-xs text-red-400 font-semibold uppercase">
              Level {user?.level} • {user?.points} Glory Points
            </p>
          </CardContent>
        </Card>

        <Card className="arena-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-red-300 uppercase tracking-wider">Kill Rate</CardTitle>
            <Target className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">
              {winRate}%
            </div>
            <p className="text-xs text-gray-400 font-semibold uppercase">
              {user?.wins} Victories - {user?.losses} Defeats
            </p>
          </CardContent>
        </Card>

        <Card className="arena-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-red-300 uppercase tracking-wider">Active Battles</CardTitle>
            <Swords className="h-5 w-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-400">{activeBattles.length}</div>
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Blood spilled pending
            </p>
          </CardContent>
        </Card>

        <Card className="arena-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-bold text-red-300 uppercase tracking-wider">Kill Streak</CardTitle>
            <Flame className="h-5 w-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {stats?.recent_results?.slice(0, 3).join('') || 'N/A'}
            </div>
            <p className="text-xs text-gray-400 font-semibold uppercase">
              Last 3 battles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Arena Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="arena-card blood-glow">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-red-300">
              <Swords className="h-6 w-6 text-red-500" />
              <span className="text-lg font-bold uppercase tracking-wider">Enter the Arena</span>
            </CardTitle>
            <CardDescription className="text-gray-400 font-semibold">
              Face your enemies in mortal combat. Only the strongest survive.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full battle-button h-12 text-lg">
              <Link to="/battle">
                <Skull className="mr-3 h-5 w-5" />
                BATTLE TO THE DEATH
              </Link>
            </Button>
            <div className="mt-3 text-center">
              <span className="text-xs text-red-400 font-bold uppercase tracking-widest">
                "Death or Glory"
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="arena-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-red-300">
              <Shield className="h-6 w-6 text-gray-500" />
              <span className="text-lg font-bold uppercase tracking-wider">Judge the Fallen</span>
            </CardTitle>
            <CardDescription className="text-gray-400 font-semibold">
              Decide the fate of warriors. Your judgment shapes their destiny.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full voting-button h-12 text-lg">
              <Link to="/voting">
                <Users className="mr-3 h-5 w-5" />
                PASS JUDGMENT
              </Link>
            </Button>
            <div className="mt-3 text-center">
              <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                "You hold their fate"
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Bloodbaths */}
      {activeBattles.length > 0 && (
        <Card className="arena-card blood-border">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3 text-red-300">
              <Flame className="h-6 w-6 text-orange-500" />
              <span className="text-xl font-bold uppercase tracking-wider">Your Active Bloodbaths</span>
            </CardTitle>
            <CardDescription className="text-gray-400 font-semibold">
              Complete these battles by uploading proof of your victory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeBattles.map((battle) => (
                <div
                  key={battle.id}
                  className="flex items-center justify-between p-6 border-2 border-red-900/50 rounded-lg bg-black/30 hover:border-red-600/70 transition-all duration-300"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Swords className="h-5 w-5 text-red-500" />
                      <h4 className="font-bold text-white text-lg uppercase tracking-wide">
                        {battle.challenge_title}
                      </h4>
                    </div>
                    <p className="text-red-400 font-semibold">
                      VS {battle.opponent_name?.toUpperCase() || 'UNKNOWN WARRIOR'}
                    </p>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                      Battle commenced {formatDate(battle.started_at)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge 
                      variant={battle.my_video_url ? 'default' : 'outline'}
                      className={`font-bold uppercase tracking-wider ${
                        battle.my_video_url 
                          ? 'bg-green-900 text-green-300 border-green-700' 
                          : 'bg-red-900/20 text-red-400 border-red-700'
                      }`}
                    >
                      {battle.my_video_url ? 'VICTORY RECORDED' : 'AWAITING PROOF'}
                    </Badge>
                    
                    {!battle.my_video_url && (
                      <Button size="sm" asChild className="battle-button">
                        <Link to="/battle">
                          <Zap className="mr-2 h-4 w-4" />
                          Upload Proof
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Arena Status Banner */}
      <div className="arena-card blood-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-red-500" />
              <span className="text-lg font-bold text-red-300 uppercase tracking-wider">
                Season of Blood Status
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">73%</div>
              <div className="text-xs text-red-400 font-bold uppercase tracking-wider">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">#{user?.rank || '∞'}</div>
              <div className="text-xs text-red-400 font-bold uppercase tracking-wider">Arena Rank</div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <div className="arena-progress h-3 rounded-full">
            <div className="arena-progress-fill h-full rounded-full" style={{width: '73%'}}></div>
          </div>
        </div>
      </div>
    </div>
  )
} 