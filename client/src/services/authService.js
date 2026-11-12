import api from './api';

/**
 * Authentication Service
 * Communicates with /api/auth endpoints.
 */
export const authService = {
  /**
   * Register a new user
   * @param {{ name: string, email: string, password: string }} data
   */
  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  /**
   * Login user with credentials
   * @param {{ email: string, password: string }} credentials
   */
  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  /**
   * Get current authenticated user details
   */
  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  }
};
