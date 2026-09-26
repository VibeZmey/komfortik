import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ROUTES } from './config';
import { AuthPage } from './pages/AuthPage';
import { ConfirmEmailPage } from './pages/ConfirmEmailPage';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { BookingPage } from './pages/BookingPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { AdminPage } from './pages/AdminPage';
import { restoreSession } from './api/auth';
import { useAuthStore } from './store/authStore';
import { GuestRoute } from './routes/GuestRoute';
import { ProtectedRoute } from './routes/ProtectedRoute';

export default function App() {
  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const { refreshToken } = useAuthStore.getState();

      if (!refreshToken) {
        if (active) {
          useAuthStore.getState().setStatus('anonymous');
        }
        return;
      }

      try {
        await restoreSession();
      } catch {
        if (active) {
          useAuthStore.getState().clearAuth();
        }
      }
    }

    bootstrap();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '16px',
            background: '#ffffff',
            color: '#111827',
            boxShadow: '0 18px 40px rgba(91, 33, 182, 0.12)',
          },
        }}
      />

        <Routes>
          <Route element={<GuestRoute />}>
            <Route path={ROUTES.auth} element={<AuthPage />} />
          </Route>
          <Route path={ROUTES.authConfirm} element={<ConfirmEmailPage />} />
          <Route path={ROUTES.authConfirmAlias} element={<ConfirmEmailPage />} />
          <Route path={ROUTES.home} element={<SearchPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path={ROUTES.profile} element={<ProfilePage />} />
            <Route path="/booking/:flightId" element={<BookingPage />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
        </Routes>
    </>
  );
}












