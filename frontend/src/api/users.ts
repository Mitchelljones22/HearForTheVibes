import type { CurrentUser } from '../types/subscription';

// Login always talks to the real backend, even when VITE_USE_MOCKS=true
// (that flag only covers subscription data).
//
// Backend contract:
//   POST /api/auth/login   body { email, password } -> 200 CurrentUser, 401 wrong credentials
//   GET  /api/auth/me      -> 200 CurrentUser, 401 not logged in
//   POST /api/auth/logout  -> 204
// The session lives in an HttpOnly cookie the browser sends automatically.

export class LoginError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function login(email: string, password: string): Promise<CurrentUser> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new LoginError(res.status, res.status === 401
      ? 'Incorrect email or password.'
      : 'Sign in failed. Try again.');
  }
  return res.json();
}

/** The logged-in user, or null when nobody is logged in. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const res = await fetch('/api/auth/me');
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Could not load user (${res.status}).`);
  return res.json();
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}
