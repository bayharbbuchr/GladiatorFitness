import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  Swords, 
  Trophy, 
  User, 
  Vote, 
  Home,
  LogOut,
  Skull,
  Flame,
  Shield
} from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { getTierColor } from '../lib/utils'

const navigation = [
  { name: 'Arena', href: '/dashboard', icon: Home },
  { name: 'Battle', href: '/battle', icon: Swords },
  { name: 'Judgement', href: '/voting', icon: Vote },
  { name: 'Hall of Fame', href: '/leaderboard', icon: Trophy },
  { name: 'Warrior Profile', href: '/profile', icon: User },
]

export default function Layout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar - Arena Command Center */}
      <div className="flex flex-col w-64 arena-sidebar">
        {/* Logo - GLADIATOR ARENA OF DEATH */}
        <div className="flex items-center justify-center h-20 px-4 arena-header">
          <div className="flex flex-col items-center space-y-1">
            <div className="flex items-center space-x-2">
              <Skull className="h-8 w-8 text-white" />
              <span className="text-xl font-bold text-white arena-title">GLADIATOR</span>
            </div>
            <span className="text-xs text-red-300 font-semibold tracking-widest">ARENA OF DEATH</span>
          </div>
        </div>

        {/* Warrior Info */}
        <div className="flex items-center space-x-3 p-4 border-b border-red-900/50 bg-black/30">
          <Avatar className="h-12 w-12 border-2 border-red-700">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="bg-red-900 text-red-100 font-bold">
              {user?.display_name?.charAt(0)?.toUpperCase() || 'W'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-red-300 truncate uppercase tracking-wide">
              {user?.display_name}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <Badge className={`text-xs font-bold ${getTierColor(user?.tier)}`}>
                {user?.tier} {user?.level}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-xs text-red-400 font-semibold">
                {user?.points} BLOOD POINTS
              </span>
            </div>
            <div className="flex items-center space-x-1 mt-1">
              <Flame className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-gray-400">
                {user?.wins}W - {user?.losses}L
              </span>
            </div>
          </div>
        </div>

        {/* Navigation - Arena Sections */}
        <nav className="flex-1 px-2 py-6 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-3 text-sm font-bold rounded-md transition-all duration-300 uppercase tracking-wide ${
                  isActive
                    ? 'arena-nav-item active text-red-400 bg-red-900/20 border-l-4 border-red-500'
                    : 'arena-nav-item text-gray-400 hover:text-red-400 hover:bg-red-900/10'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Season Info */}
        <div className="p-4 border-t border-red-900/50 bg-black/30">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-red-500" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Season of Blood
              </span>
            </div>
            <div className="arena-progress h-2 rounded-full mb-2">
              <div className="arena-progress-fill h-full rounded-full" style={{width: '73%'}}></div>
            </div>
            <span className="text-xs text-gray-500">73% Complete</span>
          </div>
        </div>

        {/* Exit Arena button */}
        <div className="p-4 border-t border-red-900/50">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-red-400 hover:bg-red-900/10 font-bold uppercase tracking-wide"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Exit Arena
          </Button>
        </div>
      </div>

      {/* Main content - Battle Ground */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header - Arena Status */}
        <header className="arena-header">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-white uppercase tracking-wide">
                  {navigation.find(item => item.href === location.pathname)?.name || 'GLADIATOR ARENA'}
                </h1>
                <span className="text-red-300 text-sm font-semibold tracking-widest">
                  WHERE LEGENDS ARE FORGED IN BLOOD
                </span>
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {user?.wins || 0}
                  </div>
                  <div className="text-xs text-red-300 font-bold uppercase tracking-wider">
                    Victories
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {user?.losses || 0}
                  </div>
                  <div className="text-xs text-red-300 font-bold uppercase tracking-wider">
                    Defeats
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-400">
                    #{user?.rank || '---'}
                  </div>
                  <div className="text-xs text-red-300 font-bold uppercase tracking-wider">
                    Arena Rank
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content - The Arena Floor */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-black/90 to-red-950/20">
          <div className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 