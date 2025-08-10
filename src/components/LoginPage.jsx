import React, { useState } from 'react';
import { useAppData } from './AppContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAppData();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const success = await login(username, password);
    if (!success) {
      setError('Nieprawidłowa nazwa użytkownika lub hasło.');
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <h2>Logowanie</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nazwa użytkownika</label>
            <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="input-field" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field" required />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="btn btn-primary submit-btn">Zaloguj</button>
        </form>
      </div>
    </div>
  );
}