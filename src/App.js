import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ExpenseTracker from './components/ExpenseTracker';

const AuthenticatedApp = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthFlow />;
  }

  return <ExpenseTracker />;
};

const AuthFlow = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useAuth();

  const handleLogin = (userData) => {
    login(userData);
  };

  const handleRegister = (userData) => {
    register(userData);
  };

  return isLogin ? (
    <Login 
      onLogin={handleLogin}
      onSwitchToRegister={() => setIsLogin(false)}
    />
  ) : (
    <Register 
      onRegister={handleRegister}
      onSwitchToLogin={() => setIsLogin(true)}
    />
  );
};

function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}

export default App;
