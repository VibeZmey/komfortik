import { useState, useEffect } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import {useNavigate} from "react-router-dom";
import styles from './AdminPage.module.css';

const TABS = {
  orders: 'orders',
  users: 'users',
};

const ORDER_STATUS = {
  0: 'Ожидает подтверждения',
  1: 'Подтверждён',
  3: 'Истёк',
  2: 'Отменён',
};

const ORDER_STATUS_ENUM = {
  Pending: 0,
  Confirmed: 1,
  Expired: 3,
  Cancelled: 2,
};

function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchAllOrders();
  }, []);

  async function fetchAllOrders() {
    try {
      const response = await apiClient.get('/orders');
      setOrders(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      setError('Не удалось загрузить заказы');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    setUpdatingStatus(orderId);
    try {
      if (newStatus === 'confirm') {
        await apiClient.post(`/orders/${orderId}/confirm`);
      } else if (newStatus === 'cancel') {
        await apiClient.post(`/orders/${orderId}/cancel`);
      }
      await fetchAllOrders();
    } catch (err) {
      setError(`Не удалось изменить статус заказа: ${err.response?.data?.message || err.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery) return true;
    const orderId = order.orderId || order.id || '';
    const userEmail = order.userEmail || '';
    return orderId.toLowerCase().includes(searchQuery.toLowerCase()) || 
           userEmail.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={styles.tab}>
      <div className={styles.tabHeader}>
        <h3>Все заказы</h3>
        <input
          type="text"
          placeholder="Поиск по номеру заказа или почте..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Загрузка заказов...</div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.empty}>Заказы не найдены.</div>
      ) : (
        <div className={styles.ordersList}>
           {filteredOrders.map((order) => {
            const orderId = order.orderId || order.id;
            const status = ORDER_STATUS[order.status] || 'Неизвестно';
            const totalPrice = order.totalPrice || 0;
            const createdAt = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              : 'Неизвестно';
            
            // Extract flight and passenger info from bookings
            const firstBooking = order.bookings && order.bookings.length > 0 ? order.bookings[0] : null;
            const flightInfo = firstBooking?.flight;
            const departureCity = flightInfo?.fromAirport?.city || 'Неизвестно';
            const arrivalCity = flightInfo?.toAirport?.city || 'Неизвестно';
            const passengersCount = order.bookings?.length || 0;

            return (
              <div key={orderId} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderId}>Заказ №{orderId.substring(0, 8)}</div>
                    <div className={styles.flightRoute}>
                      {departureCity} → {arrivalCity} • пассажиров: {passengersCount}
                    </div>
                  </div>
                  <div className={styles.orderMeta}>
                    <span className={`${styles.status} ${styles['status' + status]}`}>{status}</span>
                    <span className={styles.totalPrice}>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className={styles.orderFooter}>
                  <span className={styles.date}>{createdAt}</span>
                  <div className={styles.actions}>
                    {status === 'Pending' && (
                      <>
                        <button
                          className={styles.confirmBtn}
                          onClick={() => updateOrderStatus(orderId, 'confirm')}
                          disabled={updatingStatus === orderId}
                        >
                          {updatingStatus === orderId ? 'Обновление...' : 'Подтвердить'}
                        </button>
                        <button
                          className={styles.cancelBtn}
                          onClick={() => updateOrderStatus(orderId, 'cancel')}
                          disabled={updatingStatus === orderId}
                        >
                          {updatingStatus === orderId ? 'Обновление...' : 'Отменить'}
                        </button>
                      </>
                    )}
                    {status === 'Confirmed' && (
                      <button
                        className={styles.cancelBtn}
                        onClick={() => updateOrderStatus(orderId, 'cancel')}
                        disabled={updatingStatus === orderId}
                      >
                        {updatingStatus === orderId ? 'Обновление...' : 'Отменить'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [blockingUserId, setBlockingUserId] = useState(null);

  useEffect(() => {
    fetchAllUsers();
  }, []);

  async function fetchAllUsers() {
    try {
      const response = await apiClient.get('/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      setError('Не удалось загрузить пользователей');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function toggleBlockUser(userId, currentBlocked) {
    setBlockingUserId(userId);
    try {
      await apiClient.post(`/users/${userId}/block`, {
        isBlocked: !currentBlocked,
      });
      await fetchAllUsers();
    } catch (err) {
      setError(`Не удалось изменить статус пользователя: ${err.response?.data?.message || err.message}`);
    } finally {
      setBlockingUserId(null);
    }
  }

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const email = user.email || '';
    return email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={styles.tab}>
      <div className={styles.tabHeader}>
        <h3>Управление пользователями</h3>
        <input
          type="text"
          placeholder="Поиск по электронной почте..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Загрузка пользователей...</div>
      ) : filteredUsers.length === 0 ? (
        <div className={styles.empty}>Пользователи не найдены.</div>
      ) : (
        <div className={styles.usersList}>
          <div className={styles.usersTable}>
            <div className={styles.usersHeader}>
              <div className={styles.colEmail}>Почта</div>
              <div className={styles.colCreatedAt}>Дата регистрации</div>
              <div className={styles.colStatus}>Статус</div>
              <div className={styles.colActions}>Действия</div>
            </div>

            {filteredUsers.map((user) => {
              const userId = user.id || user.Id;
              const isBlocked = user.isBlocked || false;
              const createdAt = user.createdAt
                ? new Date(user.createdAt).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })
                : 'Неизвестно';

              return (
                <div key={userId} className={styles.usersRow}>
                  <div className={styles.colEmail}>{user.email}</div>
                  <div className={styles.colCreatedAt}>{createdAt}</div>
                  <div className={styles.colStatus}>
                    <span className={`${styles.statusBadge} ${isBlocked ? styles.blocked : styles.active}`}>
                      {isBlocked ? 'Заблокирован' : 'Активен'}
                    </span>
                  </div>
                  <div className={styles.colActions}>
                    <button
                      className={`${styles.actionBtn} ${isBlocked ? styles.unblockBtn : styles.blockBtn}`}
                      onClick={() => toggleBlockUser(userId, isBlocked)}
                      disabled={blockingUserId === userId}
                    >
                      {blockingUserId === userId ? 'Обновление...' : isBlocked ? 'Разблокировать' : 'Заблокировать'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState(TABS.orders);

  // Check if user is admin
  useEffect(() => {
    if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
      navigate('/search', { replace: true });
    }
  }, [user, navigate]);

  // Don't render if not admin
  if (!user || !user.role || user.role.toLowerCase() !== 'admin') {
    return null;
  }

  return (
    <AppShell title="Панель администратора" subtitle="Управление заказами и пользователями">
      <div className={styles.container}>
        <nav className={styles.tabsNav}>
          <button
            className={`${styles.tabBtn} ${activeTab === TABS.orders ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(TABS.orders)}
          >
            Заказы
          </button>
          <button
            className={`${styles.tabBtn} ${activeTab === TABS.users ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab(TABS.users)}
          >
            Пользователи
          </button>
        </nav>

        <div className={styles.content}>
          {activeTab === TABS.orders && <OrdersTab />}
          {activeTab === TABS.users && <UsersTab />}
        </div>
      </div>
    </AppShell>
  );
}
