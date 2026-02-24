import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { setToken } from '../api/client';
import type { User } from '../api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (token: string, user: User) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });

  const signIn = useCallback((token: string, user: User) => {
    setToken(token);
    setState({ user, isAuthenticated: true });
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setState({ user: null, isAuthenticated: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
