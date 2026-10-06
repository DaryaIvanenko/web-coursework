import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');

  try {
    // Отправляем запрос с введенным логином/email
    const response = await fetch(`${API_URL}/users?email=${encodeURIComponent(username)}`);
    
    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`);
    }

    const users = await response.json();

    // Сверяем пароль
    const foundUser = users.find(
      (u) => u.email === username && u.passwordHash === password
    );

    if (foundUser) {
      login(foundUser, 'token-' + foundUser.id);
    } else {
      setError('Неверный логин или пароль');
    }
  } catch (err) {
    console.error('Ошибка входа:', err);
    setError('Не удалось связаться с сервером БД');
  }
};

  return (
    <div style={{ maxWidth: '360px', margin: '80px auto', padding: '24px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Вход в систему</h2>
      {error && <div style={{ color: 'red', marginBottom: '12px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Логин / Email:</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '4px' }}>Пароль:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px', background: '#28a745', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
          Войти
        </button>
      </form>
    </div>
  );
}