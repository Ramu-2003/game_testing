import axios from 'axios';

// API base URL - automatically uses proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getApiErrorMessage = (error, fallback) => {
  const serverMessage = error?.response?.data?.message;
  if (serverMessage) return serverMessage;
  if (error?.code === 'ERR_NETWORK' || error?.request) {
    return 'The game service is unreachable. Check that the backend is running, then retry.';
  }
  return fallback;
};

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If we get a 401 Unauthorized, the token is invalid
    if (error.response && error.response.status === 401) {
      // Remove invalid token
      localStorage.removeItem('token');
      
      // Only redirect if we're not already on the auth page
      if (window.location.pathname !== '/' && window.location.pathname !== '/auth') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  forgotPassword: (data) => api.post('/forgot-password', data),
  validateResetToken: (token) => api.get(`/validate-reset-token/${token}`),
  resetPassword: (token, data) => api.post(`/reset-password/${token}`, data),
  test: () => api.get('/test'),
};

// Profile API calls
export const profileAPI = {
  getProfile: () => api.get('/profile'),
  setupProfile: (data) => api.post('/profile/setup', data),
  updateProfile: (data) => api.put('/profile', data),
  searchUserByUid: (uid) => api.get(`/user/${uid}`),
};

export default api;


// G-THUNDER Points API
export const pointsAPI = {
  getInfo: () => api.get('/points/info'),
  claimDaily: () => api.post('/points/claim-daily'),
  convertXp: (xpAmount, requestId) => api.post('/points/convert-xp', { xpAmount, requestId }),
  getHistory: (params) => api.get('/rewards/history', { params }),
};

// Level Progress API
export const levelsAPI = {
  getProgress: () => api.get('/levels/progress'),
  completeLevel: (data) => api.post('/levels/complete', data),
};

// Code Validation API
export const validationAPI = {
  validateHTML: (data) => api.post('/validate/html', data),
  validateCSS: (data) => api.post('/validate/css', data),
  validateJS: (data) => api.post('/validate/javascript', data),
  validatePython: (data) => api.post('/validate/python', data),
  validateJava: (data) => api.post('/validate/java', data),
};

// Isolated execution is separate from requirement validation and reward claims.
export const runtimeAPI = {
  run: (language, sourceCode) => api.post('/run/code', { language, sourceCode }),
};

// Computer Mode API
export const computerModeAPI = {
  createRoom: (data) => api.post('/computer-mode/create-room', data),
  joinRoom: (data) => api.post('/computer-mode/join-room', data),
  getRoomDetails: (roomId) => api.get(`/computer-mode/room/${roomId}`),
  updatePlayerStatus: (roomId, data) => api.post(`/computer-mode/room/${roomId}/player-status`, data),
  startGame: (roomId) => api.post(`/computer-mode/room/${roomId}/start`),
  submitProgress: (roomId, data) => api.post(`/computer-mode/room/${roomId}/progress`, data),
  validateCode: (data) => api.post('/computer-mode/validate', data),
  getChallenge: (language, difficulty, timeMinutes, t) => api.get('/computer-mode/challenge', { params: { language, difficulty, timeMinutes, _t: t } }),
};

// Competitive modes and persistent global rankings
export const leaderboardAPI = {
  get: (params) => api.get('/leaderboards', { params }),
};

export const tournamentAPI = {
  getState: () => api.get('/tournament/state'),
  getProfile: () => api.get('/tournament/profile'),
  enqueue: (data) => api.post('/tournament/queue', data),
  cancelQueue: () => api.delete('/tournament/queue'),
  getMatch: (matchId) => api.get(`/tournament/matches/${encodeURIComponent(matchId)}`),
  submit: (matchId, code) => api.post(`/tournament/matches/${encodeURIComponent(matchId)}/submit`, { code }),
};

export const bugHunterAPI = {
  getCatalog: () => api.get('/bug-hunter/catalog'),
  getActive: () => api.get('/bug-hunter/attempts/active'),
  start: (data) => api.post('/bug-hunter/attempts', data),
  hint: (attemptId) => api.post(`/bug-hunter/attempts/${encodeURIComponent(attemptId)}/hint`),
  submit: (attemptId, code) => api.post(`/bug-hunter/attempts/${encodeURIComponent(attemptId)}/submit`, { code }),
  getStats: () => api.get('/bug-hunter/stats'),
};
