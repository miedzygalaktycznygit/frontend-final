import React from 'react';
import { useAppData } from './AppContext';
import Dashboard from './Dashboard';
import LoginPage from './LoginPage';

export default function Main() {
  const { user, isLoading } = useAppData();

  if (isLoading) {
    return (
      <div className="login-page-container">
        <div className="login-form-container">
          <h2>Ładowanie danych...</h2>
        </div>
      </div>
    );
  }
  
  return user ? <Dashboard /> : <LoginPage />;
}