import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext(null);

const readUser = () => {
  try {
    const saved = localStorage.getItem('user');
    return saved && localStorage.getItem('token') ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readUser);
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');

  const login = (userData, authToken) => {
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setToken(authToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken('');
  };

  const isAdmin = user?.role?.toLowerCase() === 'admin';

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);