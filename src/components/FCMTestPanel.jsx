import React, { useState, useEffect } from 'react';
import { useAppData } from './AppContext';
import { requestNotificationPermission, registerToken, unregisterToken } from '../notification-manager';

const NotificationControlPanel = () => {
  const { user } = useAppData();
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('unknown'); // 'enabled', 'disabled', 'unknown'

  // Sprawdź status powiadomień przy załadowaniu
  useEffect(() => {
    checkNotificationStatus();
  }, [user]);

  const checkNotificationStatus = () => {
    if (!user) {
      setNotificationStatus('disabled');
      return;
    }

    // Sprawdź czy przeglądarka obsługuje powiadomienia i czy są włączone
    if ('Notification' in window) {
      const permission = Notification.permission;
      if (permission === 'granted') {
        setNotificationStatus('enabled');
      } else if (permission === 'denied') {
        setNotificationStatus('disabled');
      } else {
        setNotificationStatus('unknown');
      }
    } else {
      setNotificationStatus('disabled');
    }
  };

  const addNotification = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    const newNotification = { message, type, timestamp, id: Date.now() };
    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Zachowaj tylko 5 najnowszych

    // Automatycznie usuń powiadomienie po 5 sekundach
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 5000);
  };

  const enableNotifications = async () => {
    if (!user) {
      addNotification('❌ Musisz być zalogowany aby włączyć powiadomienia!', 'error');
      return;
    }

    try {
      addNotification('🔄 Włączanie powiadomień...', 'info');
      const token = await requestNotificationPermission();
      
      if (token) {
        const success = await registerToken(user.id, token);
        if (success) {
          setNotificationStatus('enabled');
          addNotification('✅ Powiadomienia zostały włączone!', 'success');
        } else {
          addNotification('❌ Błąd podczas włączania powiadomień', 'error');
        }
      } else {
        setNotificationStatus('disabled');
        addNotification('❌ Brak zgody na powiadomienia', 'error');
      }
    } catch (error) {
      addNotification(`❌ Błąd: ${error.message}`, 'error');
    }
  };

  const disableNotifications = async () => {
    if (!user) {
      addNotification('❌ Musisz być zalogowany!', 'error');
      return;
    }

    try {
      addNotification('🔄 Wyłączanie powiadomień...', 'info');
      const token = await requestNotificationPermission();
      
      if (token) {
        const success = await unregisterToken(user.id, token);
        if (success) {
          setNotificationStatus('disabled');
          addNotification('✅ Powiadomienia zostały wyłączone!', 'success');
        } else {
          addNotification('❌ Błąd podczas wyłączania powiadomień', 'error');
        }
      } else {
        addNotification('⚠️ Nie można uzyskać tokenu do wyłączenia', 'warning');
      }
    } catch (error) {
      addNotification(`❌ Błąd: ${error.message}`, 'error');
    }
  };

  const clearNotifications = () => setNotifications([]);

  const getStatusInfo = () => {
    switch (notificationStatus) {
      case 'enabled':
        return { text: 'Włączone', color: '#28a745', icon: '🔔' };
      case 'disabled':
        return { text: 'Wyłączone', color: '#dc3545', icon: '🔕' };
      default:
        return { text: 'Nieznany', color: '#ffc107', icon: '❓' };
    }
  };

  if (!isVisible) {
    const statusInfo = getStatusInfo();
    return (
      <button 
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '12px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 2px 8px rgba(0,123,255,0.3)'
        }}
      >
        <span style={{ fontSize: '16px' }}>{statusInfo.icon}</span>
        Powiadomienia
      </button>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '380px',
      maxHeight: '500px',
      backgroundColor: 'white',
      border: '1px solid #e1e5e9',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px',
        borderBottom: '1px solid #f1f3f4',
        paddingBottom: '15px'
      }}>
        <h3 style={{ margin: 0, color: '#202124', fontSize: '18px' }}>
          🔔 Panel Powiadomień
        </h3>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ 
            background: 'none', 
            border: 'none', 
            fontSize: '20px', 
            cursor: 'pointer',
            color: '#5f6368',
            padding: '4px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Status powiadomień */}
      <div style={{ 
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <span style={{ fontSize: '18px' }}>{statusInfo.icon}</span>
        <div>
          <strong>Status:</strong>
          <span style={{ color: statusInfo.color, marginLeft: '8px', fontWeight: '500' }}>
            {statusInfo.text}
          </span>
        </div>
      </div>

      {/* Informacje o użytkowniku */}
      <div style={{ marginBottom: '20px', fontSize: '14px', color: '#5f6368' }}>
        <strong>Użytkownik:</strong> {user ? user.username : 'Niezalogowany'}
      </div>

      {/* Przyciski sterowania */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
        <button 
          onClick={enableNotifications} 
          disabled={!user || notificationStatus === 'enabled'}
          style={{
            ...buttonStyle,
            backgroundColor: notificationStatus === 'enabled' ? '#6c757d' : '#28a745',
            cursor: (!user || notificationStatus === 'enabled') ? 'not-allowed' : 'pointer',
            opacity: (!user || notificationStatus === 'enabled') ? 0.6 : 1
          }}
        >
          🔔 Włącz powiadomienia
        </button>
        
        <button 
          onClick={disableNotifications} 
          disabled={!user || notificationStatus === 'disabled'}
          style={{
            ...buttonStyle,
            backgroundColor: notificationStatus === 'disabled' ? '#6c757d' : '#dc3545',
            cursor: (!user || notificationStatus === 'disabled') ? 'not-allowed' : 'pointer',
            opacity: (!user || notificationStatus === 'disabled') ? 0.6 : 1
          }}
        >
          🔕 Wyłącz powiadomienia
        </button>

        {notifications.length > 0 && (
          <button 
            onClick={clearNotifications} 
            style={{...buttonStyle, backgroundColor: '#6c757d', fontSize: '12px', padding: '6px 12px'}}
          >
            Wyczyść komunikaty
          </button>
        )}
      </div>

      {/* Komunikaty */}
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '12px', 
        borderRadius: '8px',
        maxHeight: '150px',
        overflow: 'auto'
      }}>
        <div style={{ 
          fontSize: '14px', 
          fontWeight: '500', 
          marginBottom: '8px',
          color: '#202124'
        }}>
          Komunikaty:
        </div>
        {notifications.length === 0 ? (
          <div style={{ 
            fontSize: '12px', 
            color: '#5f6368',
            textAlign: 'center',
            padding: '8px'
          }}>
            Brak nowych komunikatów
          </div>
        ) : (
          notifications.map((notification) => (
            <div 
              key={notification.id} 
              style={{ 
                margin: '4px 0', 
                padding: '6px 8px',
                backgroundColor: 'white',
                borderRadius: '4px',
                fontSize: '12px',
                color: notification.type === 'error' ? '#dc3545' : 
                       notification.type === 'success' ? '#28a745' : 
                       notification.type === 'warning' ? '#ffc107' : '#007bff',
                border: `1px solid ${notification.type === 'error' ? '#f5c6cb' : 
                                     notification.type === 'success' ? '#c3e6cb' : 
                                     notification.type === 'warning' ? '#ffeaa7' : '#bee5eb'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{notification.message}</span>
                <span style={{ color: '#6c757d', fontSize: '10px' }}>
                  {notification.timestamp}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Informacja pomocnicza */}
      <div style={{ 
        marginTop: '15px', 
        fontSize: '11px', 
        color: '#5f6368',
        textAlign: 'center',
        fontStyle: 'italic'
      }}>
        Powiadomienia działają na wszystkich Twoich urządzeniach
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '10px 16px',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px'
};

export default NotificationControlPanel;
