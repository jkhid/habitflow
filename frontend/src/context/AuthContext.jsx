import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, usersAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await usersAPI.getMe();
      setUser(response.data);
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (err) {
      let message = 'Login failed';

      if (err.response?.data) {
        const data = err.response.data;
        if (data.details && Array.isArray(data.details)) {
          message = data.details.map(d => d.msg).join('. ');
        } else if (data.error) {
          message = data.error;
        }
      } else if (err.message === 'Network Error') {
        message = 'Cannot connect to server. Please try again later.';
      }

      setError(message);
      return { success: false, error: message };
    }
  };

  const signup = async (email, username, password) => {
    setError(null);
    try {
      const response = await authAPI.signup({ email, username, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return { success: true };
    } catch (err) {
      let message = 'Signup failed';

      if (err.response?.data) {
        const data = err.response.data;
        // Handle validation errors with details
        if (data.details && Array.isArray(data.details)) {
          message = data.details.map(d => d.msg).join('. ');
        } else if (data.error) {
          message = data.error;
        }
      } else if (err.message === 'Network Error') {
        message = 'Cannot connect to server. Please try again later.';
      }

      setError(message);
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    updateUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
