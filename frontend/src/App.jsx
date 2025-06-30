import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/useAuthStore'

// Components
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Battle from './pages/Battle'
import BattleArena from './pages/BattleArena'
import Profile from './pages/Profile'
import Leaderboard from './pages/Leaderboard'
import Voting from './pages/Voting'

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" />
}

// Public Route component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { token } = useAuthStore()
  return token ? <Navigate to="/dashboard" /> : children
}

function App() {
  const { loadUser, token } = useAuthStore()

  useEffect(() => {
    // Apply dark theme to the document
    document.documentElement.classList.add('dark')
    
    if (token) {
      loadUser()
    }
  }, [token, loadUser])

  return (
    <Router>
      <div className="min-h-screen bg-black dark">
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <div className="min-h-screen bg-black flex items-center justify-center">
                  <Login />
                </div>
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <div className="min-h-screen bg-black flex items-center justify-center">
                  <Register />
                </div>
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="battle" element={<Battle />} />
            <Route path="battle/:battleId" element={<BattleArena />} />
            <Route path="profile" element={<Profile />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="voting" element={<Voting />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App 