import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Restore authenticated session using GET /api/auth/me on initial mount
  useEffect(() => {
    const restoreSession = async () => {
      const existingToken = localStorage.getItem('token');
      if (!existingToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        if (response.success && response.data) {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } else {
          logout();
        }
      } catch (err) {
        // If token expired or invalid, clear state
        console.warn('Session restoration failed:', err.response?.data?.message || err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    // Listen for global auth:expired event from Axios interceptor
    const handleAuthExpired = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = (authToken, userData) => {
    setToken(authToken);
    setUser(userData);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
