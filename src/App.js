import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import ExpenseTracker from './components/ExpenseTracker';
import OfflineNotice from './components/OfflineNotice';
import ErrorBoundary from './components/ErrorBoundary';
import { useBackendStatus } from './hooks/useBackendStatus';

const AuthenticatedApp = () => {
  const { user, isLoading } = useAuth();
  const { isOnline } = useBackendStatus();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <OfflineNotice isOnline={isOnline} />
      {!user ? <AuthFlow /> : <ExpenseTracker />}
    </>
  );
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
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
