import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getMe } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setVerified(false);
      setLoading(false);
      return;
    }
    try {
      const data = await getMe();
      setUser(data.user);
      setVerified(data.verified);
    } catch {
      localStorage.removeItem('token');
      setUser(null);
      setVerified(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const loginSuccess = useCallback((userData, isVerified) => {
    setUser(userData);
    setVerified(!!isVerified);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setVerified(false);
  }, []);

  const refreshProfile = useCallback(() => {
    return loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        verified,
        loading,
        loginSuccess,
        logout,
        refreshProfile,
        isSuperAdmin: user?.role === 'super_admin',
        isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
