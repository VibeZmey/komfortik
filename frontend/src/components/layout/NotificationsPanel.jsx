import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { ROUTES } from '../../config';
import styles from './NotificationsPanel.module.css';

const NOTIFICATION_TYPE = {
  0: 'OrderConfirmed',
  1: 'OrderCancelled',
  2: 'OrderCreated',
  3: 'OrderExpired',
  4: 'CheckInOpened',
  OrderConfirmed: 0,
  OrderCancelled: 1,
  OrderCreated: 2,
  OrderExpired: 3,
  CheckInOpened: 4,
};

function getNotificationIcon(type) {
  switch (type) {
    case 0:
    case 'OrderConfirmed':
      return '✓';
    case 1:
    case 'OrderCancelled':
      return '✕';
    case 2:
    case 'OrderCreated':
      return '+';
    case 3:
    case 'OrderExpired':
      return '⏱';
    case 4:
    case 'CheckInOpened':
      return '🚪';
    default:
      return 'ℹ';
  }
}

function getNotificationTitle(notification) {
  const { type, Payload } = notification;
  const payload = Payload || notification.payload;

  switch (type) {
    case 0:
    case 'OrderConfirmed':
      return 'Заказ подтверждён';
    case 1:
    case 'OrderCancelled':
      return 'Заказ отменён';
    case 2:
    case 'OrderCreated':
      return 'Заказ создан';
    case 3:
    case 'OrderExpired':
      return 'Срок заказа истёк';
    case 4:
    case 'CheckInOpened':
      return payload?.FlightNumber ? `Регистрация открыта — ${payload.FlightNumber}` : 'Регистрация открыта';
    default:
      return 'Notification';
  }
}

function getNotificationDescription(notification) {
  const { type, Payload } = notification;
  const payload = Payload || notification.payload;

  switch (type) {
    case 0:
    case 'OrderConfirmed':
      return payload?.TotalPrice
        ? `Заказ подтверждён. Сумма: ${payload.Currency || 'USD'} ${payload.TotalPrice}`
        : 'Ваш заказ подтверждён.';
    case 1:
    case 'OrderCancelled':
      return 'Ваш заказ отменён.';
    case 2:
    case 'OrderCreated':
      return 'Ваш заказ успешно создан.';
    case 3:
    case 'OrderExpired':
      return 'Срок действия заказа истёк.';
    case 4:
    case 'CheckInOpened':
      const departureTime = payload?.DepartureTime
        ? new Date(payload.DepartureTime).toLocaleDateString('ru-RU', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'время неизвестно';
      return `Регистрация на рейс ${payload?.FlightNumber || ''} открыта. Вылет: ${departureTime}`;
    default:
      return 'У вас новое уведомление.';
  }
}

export function NotificationsPanel() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchNotifications() {
    try {
      const response = await apiClient.get('/notifications/me');
      const notifs = Array.isArray(response.data) ? response.data : [];
      setNotifications(notifs);
      setHasUnread(notifs.some(n => !n.isRead && !n.IsRead));
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId) {
    try {
      await apiClient.post(`/notifications/${notificationId}/markasread`);
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  async function handleNotificationClick(notification) {
    const notifId = notification.id || notification.Id;
    const isRead = notification.isRead || notification.IsRead;
    const type = notification.type || notification.Type;
    const payload = notification.Payload || notification.payload;

    if (!isRead) {
      await markAsRead(notifId);
    }

    switch (type) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 'OrderConfirmed':
      case 'OrderCancelled':
      case 'OrderCreated':
      case 'OrderExpired':
        setIsOpen(false);
        navigate(ROUTES.profile, { state: { tab: 'orders' } });
        break;
      case 4:
      case 'CheckInOpened':
        setIsOpen(false);
        navigate(ROUTES.profile, { state: { tab: 'orders' } });
        break;
      default:
        break;
    }
  }

  return (
    <div className={styles.container} ref={panelRef}>
      <button
        className={`${styles.bellButton} ${hasUnread ? styles.bellButtonActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Уведомления"
        title="Уведомления"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {hasUnread && <span className={styles.badge}></span>}
      </button>

      {isOpen && (
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <h3>Уведомления</h3>
            <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          {loading ? (
            <div className={styles.panelContent}>
              <div className={styles.loading}>Загрузка...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className={styles.panelContent}>
              <div className={styles.empty}>Нет уведомлений</div>
            </div>
          ) : (
            <div className={styles.notificationsList}>
              {notifications
                .sort((a, b) => {
                  // Unread notifications first
                  const aIsRead = a.isRead || a.IsRead;
                  const bIsRead = b.isRead || b.IsRead;
                  if (aIsRead === bIsRead) {
                    // If same read status, sort by creation time (newest first)
                    const aTime = new Date(a.createdAt || a.CreatedAt).getTime();
                    const bTime = new Date(b.createdAt || b.CreatedAt).getTime();
                    return bTime - aTime;
                  }
                  return aIsRead ? 1 : -1;
                })
                .map((notification) => {
                const notifId = notification.id || notification.Id;
                const isRead = notification.isRead || notification.IsRead;
                const createdAt = notification.createdAt || notification.CreatedAt;
                const type = notification.type || notification.Type;

                return (
                  <div
                    key={notifId}
                    className={`${styles.notificationItem} ${isRead ? styles.notificationRead : styles.notificationUnread}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={styles.notificationIndicator}>
                      <span className={`${styles.indicator} ${isRead ? styles.indicatorRead : styles.indicatorUnread}`}></span>
                    </div>

                    <div className={styles.notificationContent}>
                      <div className={styles.notificationIcon}>{getNotificationIcon(type)}</div>
                      <div className={styles.notificationText}>
                        <h4>{getNotificationTitle(notification)}</h4>
                        <p>{getNotificationDescription(notification)}</p>
                        <small className={styles.timestamp}>
                          {new Date(createdAt).toLocaleDateString('ru-RU', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                      </div>
                    </div>

                    {!isRead && (
                      <button
                        className={styles.markReadBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(notification);
                        }}
                        title="Отметить как прочитанное и открыть"
                      >
                        →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}






