import { Link, useNavigate } from 'react-router-dom';
import { APP_NAME, ROUTES } from '../../config';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { NotificationsPanel } from './NotificationsPanel';
import styles from './AppShell.module.css';

export function AppShell({ title, subtitle, children }) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  function handleLogout() {
    clearAuth();
    navigate(ROUTES.auth, { replace: true });
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link to={ROUTES.home} className={styles.brand}>
          <img
            className={styles.logo}
            src="/logo.svg?v=2"
            alt={APP_NAME}
          />
          <div>
            <div className={styles.brandName}>{APP_NAME}</div>
            <div className={styles.brandCaption}>Авиабилеты и путешествия</div>
          </div>
        </Link>

        <div className={styles.headerMeta}>
          <button className={styles.iconButton} aria-label="Поддержка" title="Поддержка">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
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
               <button className={styles.iconButton} aria-label="Профиль" title="Профиль" onClick={() => navigate(ROUTES.profile)}>
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
              <Button onClick={() => navigate(ROUTES.auth)}>
                Войти
              </Button>
            </>
          )}
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>{APP_NAME}</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
        </section>

        <section className={styles.content}>{children}</section>
      </main>
    </div>
  );
}







