import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/me'),
}

// Users API
export const usersAPI = {
  updateProfile: (data) => api.put('/users/profile', data),
  getStats: () => api.get('/users/stats'),
  getLeaderboard: (params) => api.get('/users/leaderboard', { params }),
}

// Battles API
export const battlesAPI = {
  battleNow: () => api.post('/battles/battle-now'),
  getActiveBattles: () => api.get('/battles/active'),
  submitVideo: (battleId, videoUrl) => api.post(`/battles/${battleId}/submit-video`, { video_url: videoUrl }),
  getBattleDetails: (battleId) => api.get(`/battles/${battleId}`),
}

// Challenges API
export const challengesAPI = {
  getChallenges: (params) => api.get('/challenges', { params }),
  getChallenge: (challengeId) => api.get(`/challenges/${challengeId}`),
  getDailyPool: () => api.get('/challenges/daily/pool'),
}

// Votes API
export const votesAPI = {
  getPendingVotes: () => api.get('/votes/pending'),
  submitVote: (battleId, voteData) => api.post(`/votes/${battleId}/vote`, voteData),
  getVotingHistory: (params) => api.get('/votes/history', { params }),
}

// Uploads API
export const uploadsAPI = {
  uploadVideo: (formData) => api.post('/uploads/video', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  getMyVideos: (params) => api.get('/uploads/my-videos', { params }),
  deleteVideo: (videoId) => api.delete(`/uploads/video/${videoId}`),
}

export default api 