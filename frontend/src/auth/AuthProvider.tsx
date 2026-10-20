import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getCurrentUser, login, logout } from '../api/users';
import { AuthContext, type AuthState } from './AuthContext';

// Keeps track of who is logged in. On page load it asks the backend (/api/auth/me),
// so refreshing the page keeps you signed in while the session cookie is valid.
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' });

  useEffect(() => {
    let ignore = false;
    getCurrentUser()
      .then((user) => { if (!ignore) setAuth(user ? { status: 'signedIn', user } : { status: 'signedOut' }); })
      .catch(() => { if (!ignore) setAuth({ status: 'signedOut' }); });
    return () => { ignore = true; };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const user = await login(email, password);
    setAuth({ status: 'signedIn', user });
    return user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await logout();
    } finally {
      setAuth({ status: 'signedOut' });
    }
  }, []);

  const value = useMemo(() => ({ auth, signIn, signOut }), [auth, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
