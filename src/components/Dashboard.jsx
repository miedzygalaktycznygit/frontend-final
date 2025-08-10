import React from 'react';
import { useAppData } from './AppContext';
import BossDashboard from './dashboards/BossDashboard';
import EmployeeDashboard from './dashboards/EmployeeDashboard';
// Import naszej nowej funkcji
import { requestNotificationPermission } from '../notification-manager'; 

export default function Dashboard() {
  const { user, logout } = useAppData();

  const handleNotificationClick = () => {
    // Prosimy o zgodę i pobieramy token po kliknięciu
    requestNotificationPermission();
  };

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
          {/* Nowy przycisk do testowania powiadomień */}
          <button onClick={handleNotificationClick} className="btn btn-primary" style={{marginRight: '10px'}}>
            Włącz Powiadomienia
          </button>
          <button onClick={logout} className="btn btn-secondary">Wyloguj</button>
        </div>
      </nav>
      <main className="main-content">{renderDashboard()}</main>
    </div>
  );
}