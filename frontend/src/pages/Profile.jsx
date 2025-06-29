import React from 'react'
import { User, Edit, Trophy } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { getTierColor } from '../lib/utils'

export default function Profile() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-6 w-6" />
            <span>Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="text-2xl">
                {user?.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{user?.display_name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              
              <div className="flex items-center space-x-4 mt-3">
                <Badge className={`${getTierColor(user?.tier)}`}>
                  {user?.tier} {user?.level}
                </Badge>
                <span className="text-sm text-gray-500">
                  {user?.points} points
                </span>
              </div>
              
              <div className="mt-4">
                <Button variant="outline" size="sm">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-green-600">
              {user?.wins}
            </CardTitle>
            <CardDescription>Wins</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-red-600">
              {user?.losses}
            </CardTitle>
            <CardDescription>Losses</CardDescription>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-blue-600">
              {user?.wins + user?.losses > 0 
                ? Math.round((user?.wins / (user?.wins + user?.losses)) * 100)
                : 0}%
            </CardTitle>
            <CardDescription>Win Rate</CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Personal Info */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900">Fitness Level</h4>
              <p className="text-gray-600">{user?.fitness_level}</p>
            </div>
            
            {user?.height_cm && (
              <div>
                <h4 className="font-medium text-gray-900">Height</h4>
                <p className="text-gray-600">{user.height_cm} cm</p>
              </div>
            )}
            
            {user?.weight_kg && (
              <div>
                <h4 className="font-medium text-gray-900">Weight</h4>
                <p className="text-gray-600">{user.weight_kg} kg</p>
              </div>
            )}
            
            {user?.age && (
              <div>
                <h4 className="font-medium text-gray-900">Age</h4>
                <p className="text-gray-600">{user.age} years</p>
              </div>
            )}
            
            {user?.gender && (
              <div>
                <h4 className="font-medium text-gray-900">Gender</h4>
                <p className="text-gray-600">{user.gender}</p>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-900">Member Since</h4>
              <p className="text-gray-600">
                {new Date(user?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 