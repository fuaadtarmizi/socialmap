import { useState, useEffect } from 'react';
import { logout } from '../lib/api';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

const getStorage = () =>
  localStorage.getItem('lumina_token')
    ? localStorage
    : sessionStorage;

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('lumina_token') || sessionStorage.getItem('lumina_token')
  );
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const storage = getStorage();
    const storedToken = storage.getItem('lumina_token');
    const storedUser = storage.getItem('lumina_user');
    if (storedToken && storedUser) {
      try {
        const parsed = JSON.parse(storedUser) as AuthUser;
        setUser(parsed);
        setToken(storedToken);
      } catch {
        storage.removeItem('lumina_token');
        storage.removeItem('lumina_user');
      }
    }
    setAuthLoading(false);
  }, []);

  const handleAuthSuccess = (userData: AuthUser, newToken: string) => {
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    const storage = getStorage();
    const currentToken = storage.getItem('lumina_token');
    if (currentToken) logout(currentToken);
    localStorage.removeItem('lumina_token');
    localStorage.removeItem('lumina_user');
    sessionStorage.removeItem('lumina_token');
    sessionStorage.removeItem('lumina_user');
    setToken(null);
    setUser(null);
  };

  return { user, token, authLoading, handleAuthSuccess, handleLogout };
};
