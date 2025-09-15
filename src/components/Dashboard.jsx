// Plik: src/pages/Dashboard.jsx

import React from 'react';
import { useAppData } from '../components/AppContext'; // Poprawiona ścieżka
import BossDashboard from './dashboards/BossDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';
// Nie potrzebujemy już importu z notification-manager
// import { requestNotificationPermission } from '../notification-manager'; 

export default function Dashboard() {
  // Pobieramy z kontekstu tylko to czego potrzebujemy
  const { user, logout } = useAppData();



  const renderDashboard = () => {
    switch (user.role) {
      case 'szef':
      case 'kierownik':
        return <BossDashboard />;
      case 'pracownik':
        return <EmployeeDashboard />;
      default:
        return <div>Nieznana rola użytkownika.</div>;
    }
  };

  return (
    <div>
      <nav className="navbar">
        <h1>System Zarządzania</h1>
        <div className="user-info">
          <span>Zalogowano jako: <span className="username">{user.username} ({user.role})</span></span>
          
          <button onClick={logout} className="btn btn-secondary">Wyloguj</button>
        </div>
      </nav>
      <main className="main-content">{renderDashboard()}</main>
    </div>
  );
}