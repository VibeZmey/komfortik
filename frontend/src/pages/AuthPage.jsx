import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { APP_NAME, ROUTES } from '../config';
import { registerUser, loginUser } from '../api/auth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import {useNavigate} from "react-router-dom";
import styles from './AuthPage.module.css';

const initialValues = {
  email: '',
  password: '',
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getErrorMessage(error) {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.response?.data ||
    error?.message ||
    '';

  if (status === 401) {
    return 'Неверный адрес электронной почты или пароль. Проверьте данные и попробуйте снова.';
  }

  if (status >= 500) {
    return 'Сервер временно недоступен. Попробуйте позже.';
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return 'Не удалось отправить письмо. Попробуйте позже.';
}

function validate(values, mode) {
  const nextErrors = {};
  const email = values.email.trim();
  const password = values.password;

  if (!email) {
    nextErrors.email = 'Введите электронную почту';
  } else if (!emailPattern.test(email)) {
    nextErrors.email = 'Введите корректный адрес электронной почты';
  }

  if (!password) {
    nextErrors.password = 'Введите пароль';
  } else if (mode === 'register' && password.length < 8) {
    nextErrors.password = 'Пароль должен содержать не менее 8 символов';
  }

  return nextErrors;
}

export function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('neutral');

  const heading = useMemo(
    () => (mode === 'register' ? 'Создайте аккаунт' : 'Вход'),
    [mode]
  );

  function handleModeChange(nextMode) {
    setMode(nextMode);
    setErrors({});
    setMessage('');
    setMessageType('neutral');
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validate(values, mode);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      if (mode === 'register') {
        await registerUser({
          email: values.email.trim(),
          password: values.password,
        });
        setMessage('Ссылка для подтверждения отправлена на вашу почту.');
        toast.success('Письмо для подтверждения отправлено');
      } else {
        await loginUser({
          email: values.email.trim(),
          password: values.password,
        });
        setMessage('Ссылка для входа отправлена на вашу почту.');
        toast.success('Письмо для входа отправлено');
      }

      setMessageType('success');
    } catch (error) {
      setMessageType('error');
      setMessage(getErrorMessage(error));
      toast.error('Не удалось отправить письмо. Попробуйте позже.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroBadge}>{APP_NAME}</div>
        <h1>Путешествуйте с комфортом</h1>
        <p>Простые поездки, удобное бронирование и спокойный путь к цели.</p>
        <div className={styles.heroList}>
          <div>
            <strong>Легко начать</strong>
            <span>Войдите или создайте аккаунт всего за несколько шагов.</span>
          </div>
          <div>
            <strong>Путешествия без лишнего</strong>
            <span>Бронируйте, управляйте заказами и ищите рейсы в одном месте.</span>
          </div>
          <div>
            <strong>Создано для комфорта</strong>
            <span>Уютный дизайн помогает сосредоточиться на путешествии.</span>
          </div>
        </div>
      </section>

      <section className={styles.card}>
        <div className={styles.cardTop}>
          <div>
            <span className={styles.cardEyebrow}>Аккаунт</span>
            <h2>{heading}</h2>
          </div>
          <img
            className={styles.logo}
            src="/logo.svg?v=2"
            alt={APP_NAME}
          />
        </div>

        <div className={styles.tabs} role="tablist" aria-label="Вход и регистрация">
          <button
            type="button"
            className={mode === 'login' ? styles.tabActive : styles.tab}
            onClick={() => handleModeChange('login')}
          >
            Войти
          </button>
          <button
            type="button"
            className={mode === 'register' ? styles.tabActive : styles.tab}
            onClick={() => handleModeChange('register')}
          >
            Создать аккаунт
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <Input
            label="Электронная почта"
            type="email"
            name="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="name@domain.com"
          />

          <Input
            label="Пароль"
            type="password"
            name="password"
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
            value={values.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Введите пароль"
            hint={mode === 'register' ? 'Пароль должен содержать не менее 8 символов.' : ''}
          />

          {message ? (
            <div
              className={
                messageType === 'success'
                  ? styles.successMessage
                  : messageType === 'error'
                    ? styles.errorMessage
                    : styles.neutralMessage
              }
              role={messageType === 'error' ? 'alert' : 'status'}
            >
              {message}
            </div>
          ) : null}

          <Button type="submit" fullWidth disabled={isSubmitting}>
            {isSubmitting ? <Spinner label="Отправка" /> : mode === 'register' ? 'Отправить ссылку для подтверждения' : 'Отправить ссылку для входа'}
          </Button>

          <p className={styles.bottomText}>
            Ссылка для подтверждения будет отправлена на вашу почту.
          </p>

          <p className={styles.bottomNote}>
            Продолжая, вы соглашаетесь получать письма от «Комфортика».
          </p>
        </form>

        <div className={styles.footerLink}>
          <button 
            onClick={() => navigate(ROUTES.home)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6d28d9',
              fontWeight: 700,
              textDecoration: 'none',
              cursor: 'pointer',
              padding: 0,
              font: 'inherit'
            }}
            onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
          >
            На главную
          </button>
        </div>
      </section>
    </div>
  );
}

