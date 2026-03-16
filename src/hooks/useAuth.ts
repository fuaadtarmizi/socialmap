import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('lumina_token'));
  const [authLoading, setAuthLoading] = useState(true);

  // Auth: restore session on mount, keep in sync with Supabase
  useEffect(() => {
    // Restore existing session (survives page refresh)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) console.error('getSession error:', error);
      if (session) {
        const u = session.user;
        const username = u.user_metadata?.username || u.email?.split('@')[0] || 'User';
        setUser({ id: u.id, username, email: u.email! });
        setToken(session.access_token);
        localStorage.setItem('lumina_token', session.access_token);
      }
      setAuthLoading(false);
    });

    // Stay in sync: login, logout, token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        const u = session.user;
        const username = u.user_metadata?.username || u.email?.split('@')[0] || 'User';
        setUser({ id: u.id, username, email: u.email! });
        setToken(session.access_token);
        localStorage.setItem('lumina_token', session.access_token);
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('lumina_token');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = (userData: AuthUser, newToken: string) => {
    setToken(newToken);
    setUser(userData);
  };

  const handleLogout = () => {
    supabase.auth.signOut();
    localStorage.removeItem('lumina_token');
    setToken(null);
    setUser(null);
  };

  return { user, token, authLoading, handleAuthSuccess, handleLogout };
};
