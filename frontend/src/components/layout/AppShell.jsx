import { useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { APP_NAME, ROUTES } from '../../config';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { NotificationsPanel } from './NotificationsPanel';
import styles from './AppShell.module.css';

export function AppShell({ title, subtitle, children }) {
  const navigate = useNavigate();
  const supportRef = useRef(null);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  function handleLogout() {
    clearAuth();
    navigate(ROUTES.auth, { replace: true });
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.navigation}>
        <Link to={ROUTES.home} className={styles.railBrand}>
          <img src="/logo.svg?v=3" alt="" />
          {APP_NAME}
        </Link>
        <span className={styles.navCaption}>ВАШИ ПУТЕШЕСТВИЯ</span>
        <nav className={styles.navLinks} aria-label="Основная навигация">
          <NavLink
            to="/search"
            aria-label="Найти рейс"
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navActive : ''}`
            }
          >
            <span aria-hidden="true">↗</span>
            <span className={styles.navText}>Найти рейс</span>
          </NavLink>
          <NavLink
            to={user ? ROUTES.profile : ROUTES.auth}
            aria-label={user ? 'Мой аккаунт' : 'Войти в аккаунт'}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navActive : ''}`
            }
          >
            <span aria-hidden="true">◎</span>
            <span className={styles.navText}>
              {user ? 'Мой аккаунт' : 'Войти в аккаунт'}
            </span>
          </NavLink>
          {user?.role?.toLowerCase() === 'admin' && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navActive : ''}`
              }
            >
              <span aria-hidden="true">▦</span>
              <span className={styles.navText}>Управление</span>
            </NavLink>
          )}
        </nav>
        <div className={styles.railNote}>
          <span aria-hidden="true">✳</span>
          <strong>Всё для вашей поездки</strong>
          <p>Маршрут, пассажиры и билеты — под рукой.</p>
          <button onClick={() => supportRef.current.showModal()}>
            Открыть справку ↗
          </button>
        </div>
      </aside>
      <header className={styles.header}>
        <div className={styles.headerMeta}>
          <NotificationsPanel />
          {user ? (
            <>
              {user.role && user.role.toLowerCase() === 'admin' && (
                <button
                  className={styles.adminButton}
                  aria-label="Панель администратора"
                  title="Панель администратора"
                  onClick={() => navigate('/admin')}
                >
                  Админ
                </button>
              )}
              <button
                className={styles.iconButton}
                aria-label="Профиль"
                title="Профиль"
                onClick={() => navigate(ROUTES.profile)}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              <Button variant="secondary" onClick={handleLogout}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate(ROUTES.auth)}>Войти</Button>
            </>
          )}
        </div>
      </header>

      <dialog
        ref={supportRef}
        className={styles.supportDialog}
        aria-labelledby="support-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            )
              supportRef.current.close();
          }
        }}
      >
        <div className={styles.supportHeader}>
          <h2 id="support-title">Помощь с бронированием</h2>
          <button
            className={styles.iconButton}
            aria-label="Закрыть справку"
            onClick={() => supportRef.current.close()}
          >
            ✕
          </button>
        </div>
        <p>Ответы на частые вопросы о поездке.</p>
        <details open>
          <summary>Как оформить билет?</summary>
          <p>
            Найдите рейс, заполните данные пассажиров, выберите места и услуги.
            После создания заказа подтвердите его на странице бронирования.
          </p>
        </details>
        <details>
          <summary>Какие данные документа нужны?</summary>
          <p>
            Введите имя и фамилию как в документе. Для паспорта РФ нужны серия
            из 4 цифр и номер из 6 цифр. Для загранпаспорта — серия из 2 цифр и
            номер из 8 цифр. Дата рождения должна быть в прошлом.
          </p>
        </details>
        <details>
          <summary>Где найти и отменить заказ?</summary>
          <p>
            Откройте профиль и вкладку «Заказы». Там доступны детали
            бронирования и отмена, если она разрешена для текущего статуса.
          </p>
        </details>
        <div className={styles.supportActions}>
          <Button
            onClick={() => {
              supportRef.current.close();
              navigate(user ? ROUTES.profile : ROUTES.auth);
            }}
          >
            {user ? 'Открыть профиль' : 'Войти в аккаунт'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => supportRef.current.close()}
          >
            Понятно
          </Button>
        </div>
      </dialog>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </section>

        <section className={styles.content}>{children}</section>
      </main>
    </div>
  );
}
