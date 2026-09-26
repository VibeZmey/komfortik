import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { APP_NAME, ROUTES } from '../config';
import { confirmEmail, getMe } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import styles from './ConfirmEmailPage.module.css';

function getErrorMessage(error) {
  const status = error?.response?.status;

  if (status === 401) {
    return 'Ссылка недействительна или устарела. Запросите новое письмо и попробуйте снова.';
  }

  if (status >= 500) {
    return 'Сервер временно недоступен. Попробуйте позже.';
  }

  return 'Не удалось подтвердить почту. Попробуйте позже.';
}

export function ConfirmEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('Подтверждаем вашу почту...');

  useEffect(() => {
    let active = true;

    async function run() {
      const token = params.get('token');

      if (!token) {
        if (active) {
          setState('error');
          setMessage('В ссылке нет токена подтверждения. Откройте письмо ещё раз.');
        }
        return;
      }

      try {
        const response = await confirmEmail(token);
        useAuthStore.getState().setUser({
          login: response.data.login,
          email: null,
        });

        try {
          await getMe();
        } catch (profileError) {
          void profileError;
        }

        if (!active) {
          return;
        }

        useAuthStore.getState().setStatus('authenticated');
        setState('success');
        setMessage('Почта подтверждена. Перенаправляем на главную...');
        toast.success('Почта подтверждена');

        window.setTimeout(() => {
          if (active) {
            navigate(ROUTES.home, { replace: true });
          }
        }, 900);
      } catch (error) {
        if (!active) {
          return;
        }

        setState('error');
        setMessage(getErrorMessage(error));
        toast.error('Не удалось подтвердить почту. Попробуйте позже.');
      }
    }

    run();

    return () => {
      active = false;
    };
  }, [navigate, params]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <img className={styles.logo} src="/logo.svg" alt={APP_NAME} />
        <h1>Подтверждение почты</h1>
        <p>{message}</p>

        {state === 'loading' ? <Spinner label="Подтверждение почты" /> : null}

        {state === 'error' ? (
          <div className={styles.actions}>
            <Link to={ROUTES.auth} className={styles.linkButton}>
              Вернуться ко входу
            </Link>
            <Button variant="secondary" onClick={() => navigate(ROUTES.auth, { replace: true })}>
              Попробовать снова
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
