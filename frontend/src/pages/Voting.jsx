import React, { useState, useEffect } from 'react'
import { Vote, Play, ThumbsUp } from 'lucide-react'
import { votesAPI } from '../lib/api'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { formatDuration } from '../lib/utils'

export default function Voting() {
  const [pendingVotes, setPendingVotes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [votingOn, setVotingOn] = useState(null)

  useEffect(() => {
    const loadPendingVotes = async () => {
      try {
        const response = await votesAPI.getPendingVotes()
        setPendingVotes(response.data.pending_votes)
      } catch (error) {
        console.error('Failed to load pending votes:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadPendingVotes()
  }, [])

  const handleVote = async (battleId, votedForId) => {
    setVotingOn(battleId)
    try {
      await votesAPI.submitVote(battleId, { voted_for_id: votedForId })
      // Remove the voted battle from the list
      setPendingVotes(prev => prev.filter(vote => vote.id !== battleId))
    } catch (error) {
      console.error('Failed to submit vote:', error)
      alert(error.response?.data?.message || 'Failed to submit vote')
    } finally {
      setVotingOn(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-500">Loading battles to vote on...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Vote className="h-6 w-6" />
            <span>Voting Center</span>
          </CardTitle>
          <CardDescription>
            Help determine the winners by voting on battle videos
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Pending Votes */}
      {pendingVotes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ThumbsUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No battles to vote on
            </h3>
            <p className="text-gray-500">
              Check back later when new battles are ready for voting
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingVotes.map((battle) => (
            <Card key={battle.id}>
              <CardHeader>
                <CardTitle className="text-lg">{battle.challenge_title}</CardTitle>
                <CardDescription>
                  {battle.description} • Duration: {formatDuration(battle.duration_sec)}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Fighter 1 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{battle.user1_name}</h4>
                      <Badge variant="outline">Fighter 1</Badge>
                    </div>
                    
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      {battle.user1_video_url ? (
                        <div className="text-center">
                          <Play className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Video Ready</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No video uploaded</p>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => handleVote(battle.id, battle.user1_id)}
                      disabled={votingOn === battle.id || battle.already_voted}
                      variant={battle.already_voted ? "outline" : "default"}
                    >
                      {battle.already_voted ? 'Already Voted' : 'Vote for ' + battle.user1_name}
                    </Button>
                  </div>
                  
                  {/* Fighter 2 */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{battle.user2_name}</h4>
                      <Badge variant="outline">Fighter 2</Badge>
                    </div>
                    
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      {battle.user2_video_url ? (
                        <div className="text-center">
                          <Play className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">Video Ready</p>
                        </div>
                      ) : (
                        <p className="text-gray-500">No video uploaded</p>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={() => handleVote(battle.id, battle.user2_id)}
                      disabled={votingOn === battle.id || battle.already_voted}
                      variant={battle.already_voted ? "outline" : "default"}
                    >
                      {battle.already_voted ? 'Already Voted' : 'Vote for ' + battle.user2_name}
                    </Button>
                  </div>
                </div>
                
                {battle.already_voted && (
                  <div className="mt-4 p-3 bg-green-50 rounded-md">
                    <p className="text-sm text-green-700">
                      ✅ You have already voted on this battle
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Voting Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Voting Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Vote based on form, technique, and completion of the challenge</li>
            <li>• Consider the difficulty level and effort shown</li>
            <li>• Be fair and objective in your voting</li>
            <li>• You cannot vote on battles you are participating in</li>
            <li>• Each vote helps maintain the integrity of the competition</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
} 