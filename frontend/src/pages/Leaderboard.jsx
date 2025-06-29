import React, { useState, useEffect } from 'react'
import { Trophy, Medal, Crown } from 'lucide-react'
import { usersAPI } from '../lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { getTierColor } from '../lib/utils'

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTier, setSelectedTier] = useState('all')

  const tiers = ['all', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Gladiator']

  useEffect(() => {
    const loadLeaderboard = async () => {
      setIsLoading(true)
      try {
        const params = selectedTier !== 'all' ? { tier: selectedTier } : {}
        const response = await usersAPI.getLeaderboard(params)
        setLeaderboard(response.data.leaderboard)
      } catch (error) {
        console.error('Failed to load leaderboard:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLeaderboard()
  }, [selectedTier])

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-bold text-gray-500">#{rank}</span>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6" />
            <span>Leaderboard</span>
          </CardTitle>
          <CardDescription>
            See how you rank against other gladiators
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Tier Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            {tiers.map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTier === tier
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tier === 'all' ? 'All Tiers' : tier}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-500">Loading leaderboard...</div>
            </div>
          ) : (
            <div className="divide-y">
              {leaderboard.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center space-x-4 p-4 ${
                    user.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                  }`}
                >
                  <div className="flex items-center justify-center w-12">
                    {getRankIcon(user.rank)}
                  </div>
                  
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>
                      {user.display_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h3 className="font-semibold">{user.display_name}</h3>
                    <div className="flex items-center space-x-2">
                      <Badge className={`text-xs ${getTierColor(user.tier)}`}>
                        {user.tier} {user.level}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {user.wins}W - {user.losses}L
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold">{user.points}</div>
                    <div className="text-sm text-gray-500">points</div>
                  </div>
                </div>
              ))}
              
              {leaderboard.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No gladiators found in this tier
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 