import { Navigate, Outlet } from 'react-router-dom';
import { ROUTES } from '../config';
import { useAuthStore } from '../store/authStore';
import { Spinner } from '../components/ui/Spinner';

export function GuestRoute() {
  const status = useAuthStore((state) => state.status);
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken));

  if (status === 'restoring') {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner label="Checking session" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.home} replace />;
  }

  return <Outlet />;
}
