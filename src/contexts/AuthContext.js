import React, { createContext, useContext, useState, useEffect } from 'react';

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

  // Initialize authentication state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const savedUser = localStorage.getItem('expense-tracker-current-user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        localStorage.removeItem('expense-tracker-current-user');
      } finally {
        setIsLoading(false);
      }
    };

    // Create demo user if it doesn't exist
    const users = JSON.parse(localStorage.getItem('expense-tracker-users') || '[]');
    if (!users.find(u => u.email === 'demo@example.com')) {
      const demoUser = {
        id: 'demo-user',
        name: 'Demo User',
        email: 'demo@example.com',
        password: 'demo123',
        createdAt: new Date().toISOString()
      };
      users.push(demoUser);
      localStorage.setItem('expense-tracker-users', JSON.stringify(users));
    }

    initializeAuth();
  }, []);

  const login = (userData) => {
    const userToStore = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      createdAt: userData.createdAt
    };
    
    setUser(userToStore);
    localStorage.setItem('expense-tracker-current-user', JSON.stringify(userToStore));
    
    return Promise.resolve(userToStore);
  };

  const register = (userData) => {
    const userToStore = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      createdAt: userData.createdAt
    };
    
    setUser(userToStore);
    localStorage.setItem('expense-tracker-current-user', JSON.stringify(userToStore));
    
    return Promise.resolve(userToStore);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('expense-tracker-current-user');
    return Promise.resolve();
  };

  const updateProfile = (updatedData) => {
    const updatedUser = { ...user, ...updatedData };
    setUser(updatedUser);
    localStorage.setItem('expense-tracker-current-user', JSON.stringify(updatedUser));
    
    // Update in users list as well
    const users = JSON.parse(localStorage.getItem('expense-tracker-users') || '[]');
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updatedData };
      localStorage.setItem('expense-tracker-users', JSON.stringify(users));
    }
    
    return Promise.resolve(updatedUser);
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