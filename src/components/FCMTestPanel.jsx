import React, { useState } from 'react';
import { useAppData } from './AppContext';
import { requestNotificationPermission, registerToken, unregisterToken } from '../notification-manager';

const FCMTestPanel = () => {
  const { user } = useAppData();
  const [testResults, setTestResults] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  const addTestResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { message, type, timestamp }]);
  };

  const clearResults = () => setTestResults([]);

  // Test 1: Podstawowy test tokenu FCM
  const testFCMToken = async () => {
    try {
      addTestResult('🧪 TEST: Pobieranie tokenu FCM...', 'info');
      const token = await requestNotificationPermission();
      
      if (token) {
        addTestResult(`✅ Token uzyskany: ${token.substring(0, 20)}...`, 'success');
      } else {
        addTestResult('❌ Nie udało się uzyskać tokenu', 'error');
      }
    } catch (error) {
      addTestResult(`❌ Błąd: ${error.message}`, 'error');
    }
  };

  // Test 2: Rejestracja tokenu na serwerze
  const testRegisterToken = async () => {
    if (!user) {
      addTestResult('❌ Musisz być zalogowany!', 'error');
      return;
    }

    try {
      addTestResult('🧪 TEST: Rejestracja tokenu na serwerze...', 'info');
      const token = await requestNotificationPermission();
      
      if (token) {
        const success = await registerToken(user.id, token);
        if (success) {
          addTestResult('✅ Token zarejestrowany na serwerze', 'success');
        } else {
          addTestResult('❌ Błąd rejestracji na serwerze', 'error');
        }
      }
    } catch (error) {
      addTestResult(`❌ Błąd: ${error.message}`, 'error');
    }
  };

  // Test 3: Usuwanie tokenu z serwera
  const testUnregisterToken = async () => {
    if (!user) {
      addTestResult('❌ Musisz być zalogowany!', 'error');
      return;
    }

    try {
      addTestResult('🧪 TEST: Usuwanie tokenu z serwera...', 'info');
      const token = await requestNotificationPermission();
      
      if (token) {
        const success = await unregisterToken(user.id, token);
        if (success) {
          addTestResult('✅ Token usunięty z serwera', 'success');
        } else {
          addTestResult('❌ Błąd usuwania z serwera', 'error');
        }
      }
    } catch (error) {
      addTestResult(`❌ Błąd: ${error.message}`, 'error');
    }
  };

  // Test 4: Symulacja wielu urządzeń
  const testMultiDevice = async () => {
    if (!user) {
      addTestResult('❌ Musisz być zalogowany!', 'error');
      return;
    }

    try {
      addTestResult('🧪 TEST: Symulacja wielu urządzeń...', 'info');
      
      // Symulacja 3 różnych tokenów
      const fakeTokens = [
        'fake_token_device_1_' + Date.now(),
        'fake_token_device_2_' + Date.now(),
        'fake_token_device_3_' + Date.now()
      ];

      for (let i = 0; i < fakeTokens.length; i++) {
        const success = await registerToken(user.id, fakeTokens[i]);
        if (success) {
          addTestResult(`✅ Urządzenie ${i + 1} zarejestrowane`, 'success');
        } else {
          addTestResult(`❌ Błąd rejestracji urządzenia ${i + 1}`, 'error');
        }
      }

      addTestResult('ℹ️ Sprawdź w bazie danych czy wszystkie 3 tokeny zostały dodane', 'info');
    } catch (error) {
      addTestResult(`❌ Błąd: ${error.message}`, 'error');
    }
  };

  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          padding: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        🧪 FCM Test Panel
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '500px',
      backgroundColor: 'white',
      border: '1px solid #ccc',
      borderRadius: '10px',
      padding: '20px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 1000,
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0 }}>🧪 FCM Test Panel</h3>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}
        >
          ❌
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <p><strong>Użytkownik:</strong> {user ? user.username : 'Niezalogowany'}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
        <button onClick={testFCMToken} style={buttonStyle}>
          1. Test tokenu FCM
        </button>
        <button onClick={testRegisterToken} style={buttonStyle}>
          2. Test rejestracji
        </button>
        <button onClick={testUnregisterToken} style={buttonStyle}>
          3. Test usuwania
        </button>
        <button onClick={testMultiDevice} style={buttonStyle}>
          4. Test wielu urządzeń
        </button>
        <button onClick={clearResults} style={{...buttonStyle, backgroundColor: '#dc3545'}}>
          Wyczyść wyniki
        </button>
      </div>

      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '10px', 
        borderRadius: '5px',
        maxHeight: '200px',
        overflow: 'auto'
      }}>
        <strong>Wyniki testów:</strong>
        {testResults.length === 0 ? (
          <p style={{ margin: '5px 0', color: '#666' }}>Brak wyników</p>
        ) : (
          testResults.map((result, index) => (
            <div key={index} style={{ 
              margin: '5px 0', 
              color: result.type === 'error' ? '#dc3545' : result.type === 'success' ? '#28a745' : '#007bff',
              fontSize: '12px'
            }}>
              <span style={{ color: '#666' }}>[{result.timestamp}]</span> {result.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const buttonStyle = {
  padding: '8px 12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '14px'
};

export default FCMTestPanel;
