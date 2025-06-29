import { create } from 'zustand'
import { authAPI } from '../lib/api'

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('auth_token'),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authAPI.login(credentials)
      const { token, user } = response.data
      
      localStorage.setItem('auth_token', token)
      set({ user, token, isLoading: false })
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authAPI.register(userData)
      const { token, user } = response.data
      
      localStorage.setItem('auth_token', token)
      set({ user, token, isLoading: false })
      
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed'
      set({ error: errorMessage, isLoading: false })
      return { success: false, error: errorMessage }
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    set({ user: null, token: null, error: null })
  },

  loadUser: async () => {
    const token = get().token
    if (!token) return

    set({ isLoading: true })
    try {
      const response = await authAPI.getProfile()
      set({ user: response.data.user, isLoading: false })
    } catch (error) {
      console.error('Failed to load user:', error)
      localStorage.removeItem('auth_token')
      set({ user: null, token: null, isLoading: false })
    }
  },

  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData }
    }))
  },

  clearError: () => {
    set({ error: null })
  },
}))

export default useAuthStore 