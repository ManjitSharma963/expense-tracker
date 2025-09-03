import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, userAPI, setAuthToken, setRefreshToken, getAuthToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getAuthToken();
        const savedUser = localStorage.getItem('expense-tracker-current-user');
        
        if (token && savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          
          // Verify token is still valid by fetching user profile
          try {
            const response = await userAPI.getProfile();
            if (response.success) {
              setUser(response.data);
              localStorage.setItem('expense-tracker-current-user', JSON.stringify(response.data));
            }
          } catch (error) {
            // Handle different types of errors
            if (error.isNetworkError) {
              console.warn('Cannot validate token - backend not available. Using cached user data.');
              // Keep the cached user data when backend is not available
            } else {
              // Token is invalid, clear auth data
              console.error('Token validation failed:', error);
              clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const clearAuthData = () => {
    setUser(null);
    setAuthToken(null);
    setRefreshToken(null);
    localStorage.removeItem('expense-tracker-current-user');
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      
      if (response.success) {
        const { user: userData, token, refreshToken } = response.data;
        
        // Store auth data
        setAuthToken(token);
        setRefreshToken(refreshToken);
        setUser(userData);
        localStorage.setItem('expense-tracker-current-user', JSON.stringify(userData));
        
        return userData;
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      
      if (response.success) {
        const { user: newUser, token, refreshToken } = response.data;
        
        // Store auth data
        setAuthToken(token);
        setRefreshToken(refreshToken);
        setUser(newUser);
        localStorage.setItem('expense-tracker-current-user', JSON.stringify(newUser));
        
        return newUser;
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      const response = await userAPI.updateProfile(updatedData);
      
      if (response.success) {
        const updatedUser = response.data;
        setUser(updatedUser);
        localStorage.setItem('expense-tracker-current-user', JSON.stringify(updatedUser));
        return updatedUser;
      } else {
        throw new Error(response.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 