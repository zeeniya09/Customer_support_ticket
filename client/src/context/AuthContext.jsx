import { createContext, useState, useEffect } from 'react';
import API from '../api/axios';

const normalizeUser = (userData) => {
  if (!userData) return null;
  const role = typeof userData.role === 'string'
    ? userData.role.trim().replace(/^["']|["']+$/g, '').toLowerCase()
    : userData.role;
  return { ...userData, role };
};

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        return normalizeUser(JSON.parse(savedUser));
      } catch {
        return null;
      }
    }
    return null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Load user on mount / token change
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await API.get('/auth/me');
        const normalized = normalizeUser(data.user);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    const normalized = normalizeUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(normalized));
    setToken(data.token);
    setUser(normalized);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await API.post('/auth/register', { name, email, password });
    const normalized = normalizeUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(normalized));
    setToken(data.token);
    setUser(normalized);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
