import { createContext } from 'react';
import type { CurrentUser } from '../types/subscription';

export type AuthState =
  | { status: 'loading' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; user: CurrentUser };

export interface AuthContextValue {
  auth: AuthState;
  /** Throws LoginError on wrong credentials. */
  signIn: (email: string, password: string) => Promise<CurrentUser>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
