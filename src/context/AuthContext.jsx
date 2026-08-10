import { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

function loadStoredUser() {
  const raw = localStorage.getItem('ttrm_user');
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);

  const login = useCallback(async (username, password) => {
    const response = await api.post('/auth/login', { username, password }, { auth: false });
    const loggedInUser = {
      userId: response.userId,
      username: response.username,
      fullName: response.fullName,
      role: response.role,
      mustChangePassword: response.mustChangePassword,
    };
    localStorage.setItem('ttrm_token', response.token);
    localStorage.setItem('ttrm_user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ttrm_token');
    localStorage.removeItem('ttrm_user');
    setUser(null);
  }, []);

  const markPasswordChanged = useCallback(() => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, mustChangePassword: false };
      localStorage.setItem('ttrm_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, logout, markPasswordChanged }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
