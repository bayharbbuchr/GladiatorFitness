import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Skull, Swords, Flame } from 'lucide-react'
import useAuthStore from '../store/useAuthStore'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'

export default function Login() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (error) clearError()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await login(formData)
    if (result.success) {
      navigate('/dashboard')
    }
  }

  return (
    <div className="max-w-md w-full space-y-8">
      {/* Arena Logo */}
      <div className="text-center">
        <div className="flex justify-center items-center space-x-3 mb-6">
          <div className="p-4 arena-header rounded-full">
            <Skull className="h-10 w-10 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold arena-title mb-2">GLADIATOR</h1>
        <h2 className="text-lg font-bold text-red-300 uppercase tracking-widest mb-4">ARENA OF DEATH</h2>
        <p className="text-red-200 font-semibold">
          Enter the Arena. Prove your worth. Spill blood for glory.
        </p>
      </div>

      {/* Login Form - Arena Entry */}
      <Card className="arena-card blood-border">
        <CardHeader className="text-center">
          <CardTitle className="text-red-300 text-xl font-bold uppercase tracking-wider">
            ENTER THE ARENA
          </CardTitle>
          <CardDescription className="text-gray-400 font-semibold">
            Only warriors with proven credentials may enter
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-4 text-sm text-red-200 bg-red-900/50 border border-red-700 rounded-md blood-glow">
                <div className="flex items-center space-x-2">
                  <Flame className="h-4 w-4" />
                  <span className="font-bold">ARENA ENTRY DENIED:</span>
                </div>
                <div className="mt-1">{error}</div>
              </div>
            )}
            
            <div className="space-y-3">
              <Label htmlFor="email" className="text-red-300 font-bold uppercase tracking-wide">
                Warrior Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="Enter your warrior email"
                value={formData.email}
                onChange={handleChange}
                className="bg-black/50 border-red-900/50 text-white placeholder-gray-500 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="password" className="text-red-300 font-bold uppercase tracking-wide">
                Blood Oath
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="Enter your blood oath"
                value={formData.password}
                onChange={handleChange}
                className="bg-black/50 border-red-900/50 text-white placeholder-gray-500 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-6">
            <Button 
              type="submit" 
              className="w-full battle-button h-12 text-lg" 
              disabled={isLoading}
            >
              <Swords className="mr-3 h-5 w-5" />
              {isLoading ? 'ENTERING ARENA...' : 'ENTER THE ARENA'}
            </Button>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="h-px bg-red-900/50 flex-1"></div>
                <Skull className="h-4 w-4 text-red-500" />
                <div className="h-px bg-red-900/50 flex-1"></div>
              </div>
              <div className="text-sm">
                <span className="text-gray-400">New to the Arena? </span>
                <Link 
                  to="/register" 
                  className="font-bold text-red-400 hover:text-red-300 uppercase tracking-wider transition-colors"
                >
                  Forge Your Legend
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Arena Warning */}
      <div className="text-center">
        <div className="arena-card p-4 border border-red-900/30">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-widest">
              Arena Warning
            </span>
            <Flame className="h-4 w-4 text-orange-500" />
          </div>
          <p className="text-xs text-gray-500 font-semibold">
            Only the strongest survive. Enter at your own risk.
          </p>
        </div>
      </div>
    </div>
  )
} 