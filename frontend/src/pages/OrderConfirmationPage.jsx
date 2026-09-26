import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import styles from './OrderConfirmationPage.module.css';

export function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setError('Идентификатор заказа не указан');
        return;
      }

      try {
        // Fetch order details
        const response = await apiClient.get(`/orders/${orderId}`);
        setOrder(response.data);
      } catch (err) {
        setError('Не удалось загрузить данные заказа');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  async function handleConfirm() {
    setProcessing(true);
    setError('');
    
    try {
      await apiClient.post(`/orders/${orderId}/confirm`);
      setSuccess('Заказ успешно подтверждён!');
      setTimeout(() => {
        navigate('/profile', { state: { tab: 'orders' } });
      }, 2000);
    } catch (err) {
      setError(`Не удалось подтвердить заказ: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessing(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm('Вы уверены, что хотите отменить этот заказ?')) {
      return;
    }

    setProcessing(true);
    setError('');
    
    try {
      await apiClient.post(`/orders/${orderId}/cancel`);
      navigate('/profile', { state: { tab: 'orders' } });
    } catch (err) {
      setError(`Не удалось отменить заказ: ${err.response?.data?.message || err.message}`);
    } finally {
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Подтверждение заказа" subtitle="Проверьте бронирование перед подтверждением">
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка данных заказа...</div>
        </div>
      </AppShell>
    );
  }

  if (!order) {
    return (
      <AppShell title="Подтверждение заказа" subtitle="Проверьте бронирование перед подтверждением">
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Заказ не найден'}</div>
          <button onClick={() => navigate('/profile')} className={styles.backBtn}>
            Назад
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Подтверждение заказа" subtitle="Подтвердите или отмените бронирование">
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.confirmationBox}>
            <div className={styles.checkmark}>✓</div>
            <h1>Бронирование создано!</h1>
            <p>Бронирование создано. Проверьте данные ниже и подтвердите его.</p>

            <div className={styles.orderDetails}>
              <div className={styles.detailRow}>
                <span className={styles.label}>Номер заказа:</span>
                <span className={styles.value}>{orderId}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Статус:</span>
                <span className={`${styles.value} ${styles.statusPending}`}>Ожидает подтверждения</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Итого:</span>
                <span className={styles.value}>₽{order.totalPrice?.toFixed(2) || '0.00'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.label}>Пассажиры:</span>
                <span className={styles.value}>{order.bookings?.length || 0}</span>
              </div>
            </div>

            {order.bookings && order.bookings.length > 0 && (
              <div className={styles.bookingsList}>
                <h2>Пассажиры</h2>
                {order.bookings.map((booking, i) => (
                  <div key={i} className={styles.bookingCard}>
                    <div className={styles.bookingInfo}>
                      <p className={styles.passengerName}>
                        {booking.passengerName || booking.PassengerName || `Пассажир ${i + 1}`}
                      </p>
                      <p className={styles.seatInfo}>
                        Место: {booking.seatNumber || booking.SeatNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}

            <div className={styles.actions}>
              <button
                className={styles.cancelBtn}
                onClick={handleCancel}
                disabled={processing}
              >
                {processing ? 'Обработка...' : 'Отменить заказ'}
              </button>
              <button
                className={styles.confirmBtn}
                onClick={handleConfirm}
                disabled={processing}
              >
                {processing ? 'Подтверждение...' : 'Подтвердить заказ'}
              </button>
            </div>

            <p className={styles.note}>
              Подтвердите бронирование, чтобы завершить покупку. При необходимости его можно отменить.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
