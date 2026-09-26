import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import styles from './ProfilePage.module.css';

const TABS = {
  personal: 'personal',
  passengers: 'passengers',
  orders: 'orders',
};

// Enum mappings from backend
const PASSENGER_TYPE = {
  Adult: 0,
  Kid: 1,
  Baby: 2,
  None: 3,
};

const PASSENGER_TYPE_NAMES = {
  0: 'Взрослый',
  1: 'Ребёнок',
  2: 'Младенец',
  3: 'Не указан',
};

const DOCUMENT_TYPE = {
  Passport: 0,
  ForeignPassport: 1,
  BirthCertificate: 2,
  Other: 3,
};

const DOCUMENT_TYPE_NAMES = {
  0: 'Паспорт',
  1: 'Заграничный паспорт',
  2: 'Свидетельство о рождении',
  3: 'Другое',
};

const GENDER = {
  Male: 0,
  Female: 1,
};

const GENDER_NAMES = {
  0: 'Мужской',
  1: 'Женский',
};

const ORDER_STATUS = {
  0: 'Ожидает подтверждения',
  1: 'Подтверждён',
  3: 'Отменён',
  2: 'Истёк',
};

function PersonalTab({ user, onUserUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    country: user?.country || '',
    citizenship: user?.citizenship || '',
    currency: user?.currency || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    currentPasswordConfirm: '',
    newPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.currentPassword !== passwordData.currentPasswordConfirm) {
      setError('Текущие пароли не совпадают');
      return;
    }

    if (!passwordData.newPassword || passwordData.newPassword.length < 8) {
      setError('Новый пароль должен содержать не менее 8 символов');
      return;
    }

    setLoadingPassword(true);
    try {
      await apiClient.post('/users/change/password', {
        oldPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccess('Password changed successfully');
      setPasswordData({ currentPassword: '', currentPasswordConfirm: '', newPassword: '' });
    } catch (err) {
      setError('Не удалось изменить пароль. Проверьте текущий пароль.');
    } finally {
      setLoadingPassword(false);
    }
  }

  return (
    <div className={styles.tab}>
      <h3>Личная информация</h3>
      
      <div className={styles.infoBlock}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Почта:</span>
          <span className={styles.value}>{user?.email}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Страна:</span>
          <span className={styles.value}>{user?.country || 'Not specified'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Гражданство:</span>
          <span className={styles.value}>{user?.citizenship || 'Not specified'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Валюта:</span>
          <span className={styles.value}>{user?.currency || 'Not specified'}</span>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Дата регистрации:</span>
          <span className={styles.value}>
            {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : 'Не указана'}
          </span>
        </div>
      </div>

      <div className={styles.section}>
        <h4>Изменить пароль</h4>
        <form onSubmit={handlePasswordChange} className={styles.form}>
          <div className={styles.formGroup}>
            <label>Текущий пароль</label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Введите текущий пароль"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Подтвердите текущий пароль</label>
            <input
              type="password"
              value={passwordData.currentPasswordConfirm}
              onChange={(e) => setPasswordData({ ...passwordData, currentPasswordConfirm: e.target.value })}
              placeholder="Повторите текущий пароль"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Новый пароль</label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Введите новый пароль (не менее 8 символов)"
              required
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}

          <button type="submit" className={styles.submitBtn} disabled={loadingPassword}>
            {loadingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}

function PassengersTab() {
   const [passengers, setPassengers] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState('');
   const [expandedId, setExpandedId] = useState(null);
   const [newPassengerType, setNewPassengerType] = useState(0);
   const [showAddForm, setShowAddForm] = useState(false);
   const [addingPassenger, setAddingPassenger] = useState(false);
   const [showAddDocForm, setShowAddDocForm] = useState(null);
   const [docData, setDocData] = useState({
     type: 'Passport',
     gender: 'Male',
     firstName: '',
     middleName: '',
     lastName: '',
     number: '',
     series: '',
     dateOfBirth: '',
     validityPeriod: '',
   });
   const [addingDoc, setAddingDoc] = useState(false);
   const user = useAuthStore((state) => state.user);

  useEffect(() => {
    fetchPassengers();
  }, []);

  async function fetchPassengers() {
    try {
      const response = await apiClient.get('/passengers/me');
      setPassengers(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      setError('Не удалось загрузить пассажиров');
      setPassengers([]);
    } finally {
      setLoading(false);
    }
  }

   async function addPassenger() {
     if (!user?.id) return;
     
     setAddingPassenger(true);
     try {
       await apiClient.post('/passengers', {
         userId: user.id,
         type: newPassengerType,
         isSaved: false,
       });
       setShowAddForm(false);
       setNewPassengerType(0);
       await fetchPassengers();
     } catch (err) {
       setError('Не удалось добавить пассажира');
     } finally {
       setAddingPassenger(false);
     }
   }

  async function deletePassenger(passengerId) {
    if (!confirm('Вы уверены, что хотите удалить пассажира?')) return;
    
    try {
      await apiClient.delete(`/passengers/${passengerId}`);
      await fetchPassengers();
    } catch (err) {
      setError('Не удалось удалить пассажира');
    }
  }

   async function deleteDocument(docId) {
     if (!confirm('Вы уверены, что хотите удалить этот документ?')) return;
     
     try {
       await apiClient.delete(`/docs/${docId}`);
       await fetchPassengers();
     } catch (err) {
       setError('Не удалось удалить документ');
     }
   }

     async function addDocument(passengerId) {
       setAddingDoc(true);
       setError('');
       
       try {
         // First validate the document
         const validationPayload = {
           Type: DOCUMENT_TYPE[docData.type] || 0,
           FirstName: docData.firstName,
           MiddleName: docData.middleName || null,
           LastName: docData.lastName,
           Number: docData.number,
           Series: docData.series || null,
           Gender: GENDER[docData.gender] || 0,
           DateOfBirth: docData.dateOfBirth,
           ValidityPeriod: docData.validityPeriod || null,
           UserId: user.id,
         };

         try {
           await apiClient.post('/documents/validate', validationPayload);
         } catch (validationErr) {
           throw new Error(
             validationErr.response?.data?.message || 'Document validation failed'
           );
         }

         // Validation passed, create document
         await apiClient.post('/documents', {
           passengerId: passengerId,
           type: DOCUMENT_TYPE[docData.type],
           firstName: docData.firstName,
           middleName: docData.middleName,
           lastName: docData.lastName,
           gender: GENDER[docData.gender],
           dateOfBirth: docData.dateOfBirth,
           validityPeriod: docData.validityPeriod,
           number: docData.number,
           series: docData.series,
         });

         // Only close form on success
         setShowAddDocForm(null);
         setDocData({
           type: 'Passport',
           gender: 'Male',
           firstName: '',
           middleName: '',
           lastName: '',
           number: '',
           series: '',
           dateOfBirth: '',
           validityPeriod: '',
         });
        await fetchPassengers();
      } catch (err) {
        setError(err.message || 'Failed to add document');
      } finally {
        setAddingDoc(false);
      }
    }

  return (
    <div className={styles.tab}>
      <div className={styles.tabHeader}>
        <h3>Мои пассажиры</h3>
        <button className={styles.addBtn} onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? 'Отмена' : '+ Добавить пассажира'}
        </button>
      </div>

       {showAddForm && (
         <div className={styles.addForm}>
           <div className={styles.formGroup}>
             <label>Тип пассажира</label>
             <select value={newPassengerType} onChange={(e) => setNewPassengerType(parseInt(e.target.value))}>
               <option value="0">Взрослый</option>
               <option value="1">Ребёнок</option>
               <option value="2">Младенец</option>
             </select>
           </div>
           <button onClick={addPassenger} disabled={addingPassenger} className={styles.submitBtn}>
             {addingPassenger ? 'Добавление...' : 'Добавить пассажира'}
           </button>
         </div>
       )}

      {loading ? (
        <div className={styles.loading}>Загрузка пассажиров...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : passengers.length === 0 ? (
        <div className={styles.empty}>Пассажиры ещё не добавлены.</div>
      ) : (
        <div className={styles.passengersList}>
           {passengers.map((passenger) => {
             const passengerId = passenger.id || passenger.Id;
             const passengerType = PASSENGER_TYPE_NAMES[passenger.type] || PASSENGER_TYPE_NAMES[passenger.Type] || PASSENGER_TYPE_NAMES[0];
             const firstDoc = passenger.documents && passenger.documents.length > 0 ? passenger.documents[0] : null;
             const passengerName = firstDoc 
               ? `${firstDoc.firstName || firstDoc.FirstName} ${firstDoc.lastName || firstDoc.LastName}`
               : passengerType;
             
              return (
              <div key={passengerId} className={styles.passengerCard}>
                <div className={styles.passengerHeader}>
                  <div>
                    <div className={styles.passengerNameBlock}>
                      <svg className={styles.passengerIcon} viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      <div>
                        <h4>
                          {passengerName}
                        </h4>
                        {!firstDoc && <small className={styles.noDocuments}>Нет документов</small>}
                      </div>
                    </div>
                    <small>{passengerType}</small>
                    <button
                      className={styles.expandBtn}
                      onClick={() => setExpandedId(expandedId === passengerId ? null : passengerId)}
                    >
                      {expandedId === passengerId ? 'Меньше' : 'Показать'}
                    </button>
                  </div>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => deletePassenger(passengerId)}
                  >
                    Удалить
                  </button>
                </div>

               {expandedId === passengerId && (
                 <div className={styles.documentsSection}>
                   <div className={styles.documentsHeader}>
                     <h5>Документы</h5>
                     <button 
                       className={styles.addBtn}
                       onClick={() => setShowAddDocForm(showAddDocForm === passengerId ? null : passengerId)}
                     >
                       {showAddDocForm === passengerId ? 'Закрыть' : '+ Добавить'}
                     </button>
                   </div>

                   {showAddDocForm === passengerId && (
                    <div className={styles.addDocForm}>
                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Тип документа</label>
                          <select value={docData.type} onChange={(e) => setDocData({ ...docData, type: e.target.value })}>
                            <option value="Passport">Паспорт</option>
                            <option value="ForeignPassport">Заграничный паспорт</option>
                            <option value="BirthCertificate">Свидетельство о рождении</option>
                            <option value="Other">Другое</option>
                          </select>
                        </div>
                        <div className={styles.formGroup}>
                          <label>Пол</label>
                          <select value={docData.gender} onChange={(e) => setDocData({ ...docData, gender: e.target.value })}>
                            <option value="Male">Мужской</option>
                            <option value="Female">Женский</option>
                          </select>
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Имя</label>
                          <input
                            type="text"
                            value={docData.firstName}
                            onChange={(e) => setDocData({ ...docData, firstName: e.target.value })}
                            placeholder="Имя"
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Отчество</label>
                          <input
                            type="text"
                            value={docData.middleName}
                            onChange={(e) => setDocData({ ...docData, middleName: e.target.value })}
                            placeholder="Отчество (необязательно)"
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Фамилия</label>
                          <input
                            type="text"
                            value={docData.lastName}
                            onChange={(e) => setDocData({ ...docData, lastName: e.target.value })}
                            placeholder="Фамилия"
                            required
                          />
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Номер документа</label>
                          <input
                            type="text"
                            value={docData.number}
                            onChange={(e) => setDocData({ ...docData, number: e.target.value })}
                            placeholder="Номер документа"
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Серия документа</label>
                          <input
                            type="text"
                            value={docData.series}
                            onChange={(e) => setDocData({ ...docData, series: e.target.value })}
                            placeholder="Серия (необязательно)"
                          />
                        </div>
                      </div>

                      <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                          <label>Дата рождения</label>
                          <input
                            type="date"
                            value={docData.dateOfBirth}
                            onChange={(e) => setDocData({ ...docData, dateOfBirth: e.target.value })}
                            required
                          />
                        </div>
                        <div className={styles.formGroup}>
                          <label>Срок действия</label>
                          <input
                            type="date"
                            value={docData.validityPeriod}
                            onChange={(e) => setDocData({ ...docData, validityPeriod: e.target.value })}
                            placeholder="Срок действия (необязательно)"
                          />
                        </div>
                      </div>

                      {error && <div className={styles.error}>{error}</div>}

                       <button 
                         onClick={() => addDocument(passengerId)} 
                         disabled={addingDoc} 
                         className={styles.submitBtn}
                       >
                         {addingDoc ? 'Добавление...' : 'Добавить'}
                       </button>
                    </div>
                  )}

                   {passenger.documents && passenger.documents.length > 0 ? (
                     <div className={styles.documentsList}>
                       {passenger.documents.map((doc) => {
                         const docId = doc.id || doc.Id;
                         const docType = DOCUMENT_TYPE_NAMES[doc.type] || DOCUMENT_TYPE_NAMES[doc.Type] || doc.type;
                         return (
                         <div key={docId} className={styles.documentItem}>
                           <div>
                             <strong>{docType}</strong>
                             <p>
                               {doc.firstName || doc.FirstName} {doc.lastName || doc.LastName}
                             </p>
                             <small>ДР: {new Date(doc.dateOfBirth || doc.DateOfBirth).toLocaleDateString()}</small>
                           </div>
                           <button
                             className={styles.deleteBtn}
                             onClick={() => deleteDocument(docId)}
                           >
                             Удалить
                           </button>
                         </div>
                         );
                       })}
                     </div>
                   ) : (
                     <p className={styles.empty}>Документы не добавлены</p>
                   )}
                 </div>
               )}
             </div>
             );
           })}
         </div>
      )}
    </div>
  );
}
function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user?.id) {
      fetchOrders();
    }
  }, [user?.id]);

  async function fetchOrders() {
    try {
      const response = await apiClient.get(`/orders/me`);
      if (Array.isArray(response.data)) {
        setOrders(response.data);
        setError('');
      } else {
        setOrders([]);
        setError('Некорректные данные заказов');
      }
    } catch (err) {
      setError('Не удалось загрузить заказы');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  function getStatusClass(status) {
    const statusMap = {
      0: styles.orderStatusPending,
      1: styles.orderStatusConfirmed,
      3: styles.orderStatusExpired,
      2: styles.orderStatusCancelled,
      Pending: styles.orderStatusPending,
      Confirmed: styles.orderStatusConfirmed,
      Expired: styles.orderStatusExpired,
      Cancelled: styles.orderStatusCancelled,
    };
    return statusMap[status] || styles.orderStatusPending;
  }

  function getStatusText(status) {
    const statusMap = {
      0: 'Ожидает подтверждения',
      1: 'Подтверждён',
      3: 'Истёк',
      2: 'Отменён',
      Pending: 'Ожидает подтверждения',
      Confirmed: 'Подтверждён',
      Expired: 'Истёк',
      Cancelled: 'Отменён',
    };
    return statusMap[status] || 'Неизвестно';
  }

  return (
    <div className={styles.tab}>
      <h3>Мои заказы</h3>
      {loading ? (
        <div className={styles.loading}>Загрузка заказов...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : orders.length === 0 ? (
        <div className={styles.empty}>Вы ещё не сделали ни одного заказа.</div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => {
            const orderId = order.orderId || order.id;
            const shortId = orderId ? orderId.split('-')[0] : 'N/A';
            const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })             : 'Неизвестно';
            const status = order.status;
            const totalPrice = order.totalPrice || 0;
            const bookings = order.bookings || [];
            const isExpanded = expandedOrderId === orderId;

            return (
              <div key={orderId} className={styles.orderCard}>
                <div className={styles.orderMainHeader}>
                  <div className={styles.orderIdBlock}>
                    <div className={styles.orderStatusBadge + ' ' + getStatusClass(status)}>
                      {getStatusText(status)}
                    </div>
                    <div className={styles.orderId}>Заказ №{shortId}</div>
                    <div className={styles.orderDate}>{createdAt}</div>
                  </div>
                  <div className={styles.orderTotalPrice}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(totalPrice)}
                  </div>
                </div>

                <button
                  className={styles.orderToggleBtn}
                  onClick={() => setExpandedOrderId(isExpanded ? null : orderId)}
                >
                  {isExpanded ? 'Скрыть бронирования' : `Показать бронирования (${bookings.length})`}
                </button>

                {isExpanded && bookings.length > 0 && (
                  <div className={styles.bookingsList}>
                    {bookings.map((booking, index) => {
                      const flight = booking.flight || {};
                      const fromCity = flight.fromAirport?.city || flight.FromAirport?.city || 'Неизвестно';
                      const toCity = flight.toAirport?.city || flight.ToAirport?.city || 'Неизвестно';
                      const departureTime = flight.departureTime || flight.DepartureTime;
                      const passengerName = `${booking.firstName || ''} ${booking.lastName || ''}`.trim() || 'Пассажир';

                      return (
                        <div key={booking.id || index} className={styles.bookingItem}>
                          <div className={styles.bookingHeader}>
                            <div>
                              <h4 className={styles.bookingRoute}>{fromCity} → {toCity}</h4>
                              <p className={styles.bookingPassenger}>
                                {passengerName} • {departureTime ? new Date(departureTime).toLocaleDateString('ru-RU') : 'Нет данных'}
                              </p>
                            </div>
                            <div className={styles.bookingSeat}>
                              Место: {booking.seatNumber || booking.SeatNumber || 'нет данных'}
                            </div>
                          </div>
                          <div className={styles.bookingDetails}>
                            <span>Номер бронирования: {booking.id || booking.Id}</span>
                            <span>
                              Услуги:
                              {booking.hasLuggage ? ' багаж' : ''}
                              {booking.hasFood ? ' питание' : ''}
                              {booking.isBusiness ? ' бизнес-класс' : ''}
                              {(!booking.hasLuggage && !booking.hasFood && !booking.isBusiness) ? ' нет' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ProfilePage() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const [userInfo, setUserInfo] = useState(user);
  const [activeTab, setActiveTab] = useState(() => {
    // Check if tab was passed via location state
    return location.state?.tab || TABS.personal;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const response = await apiClient.get('/users/me');
        setUserInfo(response.data);
      } catch (err) {
        console.error('Failed to load user info');
      } finally {
        setLoading(false);
      }
    }

    fetchUserInfo();
  }, []);

  if (loading) {
    return (
      <AppShell title="Мой аккаунт" subtitle="Просматривайте и управляйте профилем">
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка профиля...</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Мой аккаунт" subtitle="Просматривайте и управляйте профилем">
      <div className={styles.container}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <div className={styles.userCard}>
              <div className={styles.avatar}>{userInfo?.email?.[0]?.toUpperCase() || 'U'}</div>
              <div className={styles.userDetails}>
                <h3>{userInfo?.email || 'User'}</h3>
              </div>
            </div>

            <nav className={styles.tabsNav}>
              <button
                className={`${styles.tabBtn} ${activeTab === TABS.personal ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab(TABS.personal)}
              >
                Личная информация
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === TABS.passengers ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab(TABS.passengers)}
              >
                Пассажиры
              </button>
              <button
                className={`${styles.tabBtn} ${activeTab === TABS.orders ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveTab(TABS.orders)}
              >
                Заказы
              </button>
            </nav>
          </aside>

          <main className={styles.content}>
            {activeTab === TABS.personal && <PersonalTab user={userInfo} />}
            {activeTab === TABS.passengers && <PassengersTab />}
            {activeTab === TABS.orders && <OrdersTab />}
          </main>
        </div>
      </div>
    </AppShell>
  );
}
