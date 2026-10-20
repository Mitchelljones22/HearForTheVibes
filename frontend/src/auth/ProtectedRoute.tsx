import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

// Wrap signed-in pages with this route. Signed-out visitors are sent to /login,
// and returned to the page they wanted after signing in.
export default function ProtectedRoute() {
  const { auth } = useAuth();
  const location = useLocation();

  if (auth.status === 'loading') {
    return <p role="status" className="p-8 text-sm text-slate-500">Loading…</p>;
  }
  if (auth.status === 'signedOut') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
}
