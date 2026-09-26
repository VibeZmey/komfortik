import { AppShell } from '../components/layout/AppShell';
import { useAuthStore } from '../store/authStore';
import styles from './HomePage.module.css';

export function HomePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <AppShell
      title="Добро пожаловать в «Комфортик»"
      subtitle="Ваш аккаунт готов. Здесь собраны рейсы, бронирования и планы путешествий."
    >
      <div className={styles.grid}>
        <section className={styles.card}>
          <span className={styles.cardLabel}>Профиль</span>
          <h2>{user?.login || 'Путешественник'}</h2>
          <div className={styles.list}>
            <div>
              <span>Почта</span>
              <strong>{user?.email || 'Не указана'}</strong>
            </div>
            <div>
              <span>Страна</span>
              <strong>{user?.country || 'Не указана'}</strong>
            </div>
            <div>
              <span>Гражданство</span>
              <strong>{user?.citizenship || 'Не указано'}</strong>
            </div>
            <div>
              <span>Валюта</span>
              <strong>{user?.currency || 'Не указана'}</strong>
            </div>
          </div>
        </section>

        <section className={styles.cardAccent}>
          <span className={styles.cardLabel}>Далее</span>
          <h2>Ищите рейсы, сравнивайте варианты и планируйте следующую поездку</h2>
          <p>Всё необходимое для комфортного путешествия — в одном месте.</p>
          <div className={styles.pillRow}>
            <span>Рейсы</span>
            <span>Бронирования</span>
            <span>Профиль</span>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
