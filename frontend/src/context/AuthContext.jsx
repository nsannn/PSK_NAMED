import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { logger } from '../utils/logger';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMe();
  }, []);

  async function fetchMe() {
    try {
      const data = await apiFetch('/api/auth/me');
      setUser(data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setUser(data.user);
    // refresh the page so all parts of the app reflect the authenticated state
    try {
      window.location.reload();
    } catch (err) {
      // ignore - non-browser environments
    }
    return data;
  }

  async function register(firstName, lastName, email, password, confirmPassword, role) {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ firstName, lastName, email, password, confirmPassword, role }),
    });

    setUser(data.user);
    try {
      window.location.reload();
    } catch (err) {
      // ignore
    }
    return data;
  }

  async function logout() {
    try {
      await apiFetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (err) {
      logger.warn('Logout request failed', err);
    } finally {
      setUser(null);
      try {
        window.location.reload();
      } catch (err) {
        // ignore
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
