import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Users API
export const usersAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data) => api.patch('/users/me', data),
  getUser: (userId) => api.get(`/users/${userId}`),
  searchUsers: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
};

// Habits API
export const habitsAPI = {
  getAll: (params = {}) => api.get('/habits', { params }),
  getOne: (habitId) => api.get(`/habits/${habitId}`),
  create: (data) => api.post('/habits', data),
  update: (habitId, data) => api.patch(`/habits/${habitId}`, data),
  delete: (habitId) => api.delete(`/habits/${habitId}`),
  checkIn: (habitId, data = {}) => api.post(`/habits/${habitId}/checkin`, data),
  removeCheckIn: (habitId, checkInId) => api.delete(`/habits/${habitId}/checkin/${checkInId}`),
  getCheckIns: (habitId, params = {}) => api.get(`/habits/${habitId}/checkins`, { params }),
};

// Friends API
export const friendsAPI = {
  getAll: (params = {}) => api.get('/friends', { params }),
  getRequests: () => api.get('/friends/requests'),
  sendRequest: (userId) => api.post(`/friends/request/${userId}`),
  acceptRequest: (friendshipId) => api.post(`/friends/accept/${friendshipId}`),
  declineRequest: (friendshipId) => api.post(`/friends/decline/${friendshipId}`),
  removeFriend: (friendshipId) => api.delete(`/friends/${friendshipId}`),
};

// Social API
export const socialAPI = {
  getFeed: (params = {}) => api.get('/social/feed', { params }),
  cheer: (checkInId, data = {}) => api.post(`/social/cheer/${checkInId}`, data),
  removeCheer: (checkInId) => api.delete(`/social/cheer/${checkInId}`),
  getLeaderboard: (params = {}) => api.get('/social/leaderboard', { params }),
  getCheers: (params = {}) => api.get('/social/cheers', { params }),
};

export default api;
