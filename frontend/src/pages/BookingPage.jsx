import { DateInput } from '../components/ui/DateInput';
import { Select } from '../components/ui/Select';
import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import styles from './BookingPage.module.css';
import { Button } from '../components/ui/Button';
import { formatMoney } from '../utils/format';

// Enum mappings
const PASSENGER_TYPE = { Adult: 0, Kid: 1, Baby: 2, None: 3 };
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
const GENDER = { Male: 0, Female: 1 };
const FLIGHT_STATUS = {
  Scheduled: 0,
  CheckIn: 1,
  Boarding: 2,
  Departed: 3,
  Arrived: 4,
  Cancelled: 5,
  Delayed: 6,
};

function Step1PassengerDocuments({
  flight,
  passengers,
  initialData,
  onNext,
  onBack,
}) {
  const user = useAuthStore((state) => state.user);
  const [passengerData, setPassengerData] = useState(initialData || []);
  const [savedPassengers, setSavedPassengers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function loadPassengers() {
      try {
        const response = await apiClient.get('/passengers/me');
        setSavedPassengers(Array.isArray(response.data) ? response.data : []);
      } catch (err) {
        console.error('Failed to load saved passengers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPassengers();

    const totalPassengers =
      (passengers.adults || 0) +
      (passengers.kids || 0) +
      (passengers.babies || 0);
    if (initialData?.length) return;
    setPassengerData(
      Array.from({ length: totalPassengers }, (_, i) => ({
        index: i,
        type:
          i < (passengers.adults || 0)
            ? PASSENGER_TYPE.Adult
            : i < (passengers.adults || 0) + (passengers.kids || 0)
              ? PASSENGER_TYPE.Kid
              : PASSENGER_TYPE.Baby,
        useExisting: false,
        existingPassengerId: null,
        documents: {
          type: i >= (passengers.adults || 0) ? 'BirthCertificate' : 'Passport',
          gender: 'Male',
          firstName: '',
          middleName: '',
          lastName: '',
          number: '',
          series: '',
          dateOfBirth: '',
          validityPeriod: '',
        },
      })),
    );
  }, [passengers]);

  const allFieldsFilled =
    passengerData.length > 0 &&
    passengerData.every((p) => {
      if (p.useExisting) return Boolean(p.existingPassengerId);
      return (
        p.documents.firstName &&
        p.documents.lastName &&
        p.documents.number &&
        p.documents.dateOfBirth &&
        p.documents.type &&
        p.documents.gender
      );
    });

  async function handleNext() {
    setError('');
    for (const p of passengerData) {
      if (p.useExisting) {
        if (!p.existingPassengerId) {
          setError(`Выберите сохранённого пассажира ${p.index + 1}.`);
          return;
        }
        continue;
      }
      const d = p.documents;
      const prefix = `Пассажир ${p.index + 1}: `;
      const birth = new Date(d.dateOfBirth + 'T00:00:00Z');
      const expiration = new Date(d.validityPeriod + 'T00:00:00Z');
      let problem = '';
      if (!d.firstName.trim() || !d.lastName.trim())
        problem = 'укажите имя и фамилию.';
      else if (
        !/^\d{4}-\d{2}-\d{2}$/.test(d.dateOfBirth) ||
        Number.isNaN(birth.getTime()) ||
        birth.toISOString().slice(0, 10) !== d.dateOfBirth ||
        birth >= new Date()
      )
        problem = 'дата рождения должна быть в прошлом.';
      else if (d.type === 'Passport' && !/^\d{4}$/.test(d.series))
        problem = 'серия паспорта должна содержать 4 цифры.';
      else if (d.type === 'ForeignPassport' && !/^\d{2}$/.test(d.series))
        problem = 'серия загранпаспорта должна содержать 2 цифры.';
      else if (
        d.type === 'BirthCertificate' &&
        !/^(I{1,3}|IV|IX|X(I{0,3}|V|VI{0,2}|IX)|XX)-[А-Я]{2}$/.test(d.series)
      )
        problem = 'укажите серию свидетельства, например I-МЮ.';
      else if (
        ['Passport', 'BirthCertificate'].includes(d.type) &&
        !/^\d{6}$/.test(d.number)
      )
        problem = 'номер документа должен содержать 6 цифр.';
      else if (d.type === 'ForeignPassport' && !/^\d{8}$/.test(d.number))
        problem = 'номер загранпаспорта должен содержать 8 цифр.';
      else if (
        d.type === 'BirthCertificate' &&
        new Date(d.dateOfBirth + 'T00:00:00Z') <
          new Date(new Date().setUTCFullYear(new Date().getUTCFullYear() - 14))
      )
        problem = 'с 14 лет нужно использовать паспорт.';
      else if (
        d.validityPeriod &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(d.validityPeriod) ||
          Number.isNaN(expiration.getTime()) ||
          expiration.toISOString().slice(0, 10) !== d.validityPeriod ||
          expiration < new Date())
      )
        problem = 'укажите корректный срок действия документа в будущем.';
      if (problem) {
        setError(prefix + problem);
        return;
      }
    }
    setCreating(true);
    try {
      const createdPassengers = [];
      for (let i = 0; i < passengerData.length; i++) {
        const pData = passengerData[i];
        let passengerId;

        if (pData.useExisting && pData.existingPassengerId) {
          passengerId = pData.existingPassengerId;
          const saved = savedPassengers.find(
            (p) => (p.id || p.Id) === passengerId,
          );
          if (saved?.documents?.[0]) {
            const document = saved.documents[0];
            pData.documents = {
              ...pData.documents,
              firstName: document.firstName,
              lastName: document.lastName,
              middleName: document.middleName || '',
              type:
                Object.keys(DOCUMENT_TYPE).find(
                  (key) => DOCUMENT_TYPE[key] === document.type,
                ) || 'Passport',
              gender:
                Object.keys(GENDER).find(
                  (key) => GENDER[key] === document.gender,
                ) || 'Male',
              dateOfBirth: document.dateOfBirth?.slice(0, 10) || '',
              validityPeriod: document.validityPeriod?.slice(0, 10) || '',
            };
          }
        } else {
          const validationPayload = {
            Type: DOCUMENT_TYPE[pData.documents.type] || 0,
            FirstName: pData.documents.firstName.trim(),
            MiddleName: pData.documents.middleName?.trim() || null,
            LastName: pData.documents.lastName.trim(),
            Number: pData.documents.number,
            Series: pData.documents.series || null,
            Gender: GENDER[pData.documents.gender] || 0,
            DateOfBirth: pData.documents.dateOfBirth,
            ValidityPeriod: pData.documents.validityPeriod || null,
            UserId: user.id || user.userId,
          };

          try {
            await apiClient.post('/documents/validate', validationPayload);
          } catch (validationErr) {
            throw new Error(
              validationErr.response?.data?.message || validationErr.message,
            );
          }

          const passengerResp = pData.savedPassengerId
            ? { data: { id: pData.savedPassengerId } }
            : await apiClient.post('/passengers', {
                userId: user.id || user.userId,
                type: pData.type,
                isSaved: true,
              });
          passengerId = passengerResp.data.id || passengerResp.data.Id;
          pData.savedPassengerId = passengerId;

          if (!pData.documentCreated) {
            const documentResponse = await apiClient[
              pData.documentId ? 'patch' : 'post'
            ](
              pData.documentId
                ? `/documents/${pData.documentId}`
                : '/documents',
              {
                passengerId: passengerId,
                type: DOCUMENT_TYPE[pData.documents.type] || 0,
                firstName: pData.documents.firstName.trim(),
                middleName: pData.documents.middleName?.trim() || null,
                lastName: pData.documents.lastName.trim(),
                gender: GENDER[pData.documents.gender] || 0,
                dateOfBirth: pData.documents.dateOfBirth,
                validityPeriod: pData.documents.validityPeriod || null,
                number: pData.documents.number,
                series: pData.documents.series || null,
                userId: user.id || user.userId,
              },
            );
            pData.documentId =
              documentResponse.data?.id ||
              documentResponse.data?.Id ||
              pData.documentId;
          }
        }
        pData.documentCreated = true;
        createdPassengers.push({ ...pData, savedPassengerId: passengerId });
      }
      onNext(createdPassengers);
    } catch (err) {
      setError(
        err.message === 'Network Error'
          ? 'Нет связи с сервером. Попробуйте ещё раз.'
          : err.message || 'Не удалось сохранить пассажиров.',
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className={styles.stepContent}>
      <h2>Шаг 1: Данные пассажиров</h2>
      <p>Добавьте или выберите пассажиров и их документы для бронирования.</p>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Загрузка сохранённых пассажиров...</div>
      ) : (
        <div className={styles.passengersGrid}>
          {passengerData.map((pData) => (
            <div key={pData.index} className={styles.passengerCard}>
              <div className={styles.passengerTitle}>
                Пассажир {pData.index + 1} ({PASSENGER_TYPE_NAMES[pData.type]})
              </div>
              <div className={styles.toggleOption}>
                <label>
                  <input
                    type="checkbox"
                    checked={pData.useExisting}
                    disabled={
                      !savedPassengers.some(
                        (p) => p.type === pData.type && p.documents?.length,
                      )
                    }
                    onChange={(e) => {
                      const updated = [...passengerData];
                      updated[pData.index].useExisting = e.target.checked;
                      setPassengerData(updated);
                    }}
                  />
                  Использовать сохранённого пассажира
                </label>
                {pData.useExisting && savedPassengers.length > 0 && (
                  <Select
                    aria-label="Сохранённый пассажир"
                    value={pData.existingPassengerId || ''}
                    onChange={(e) => {
                      const updated = [...passengerData];
                      updated[pData.index].existingPassengerId = e.target.value;
                      setPassengerData(updated);
                    }}
                    className={styles.selectPassenger}
                  >
                    <option value="">Выберите сохранённого пассажира...</option>
                    {savedPassengers
                      .filter(
                        (p) => p.type === pData.type && p.documents?.length,
                      )
                      .map((p) => {
                        const id = p.id || p.Id;
                        const doc =
                          p.documents && p.documents.length > 0
                            ? p.documents[0]
                            : null;
                        const name = doc
                          ? `${doc.firstName || doc.FirstName} ${doc.lastName || doc.LastName}`
                          : `Пассажир ${id}`;
                        return (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        );
                      })}
                  </Select>
                )}
              </div>

              {!pData.useExisting && (
                <div className={styles.documentForm}>
                  <div className={styles.formRow}>
                    <label className={styles.formGroup}>
                      <span>Тип документа</span>
                      <Select
                        aria-label="Тип документа"
                        value={pData.documents.type}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documentCreated = false;
                          updated[pData.index].documents.type = e.target.value;
                          updated[pData.index].documentId = null;
                          updated[pData.index].savedPassengerId = null;
                          setPassengerData(updated);
                        }}
                      >
                        <option value="Passport">Паспорт</option>
                        <option value="ForeignPassport">
                          Заграничный паспорт
                        </option>
                        <option value="BirthCertificate">
                          Свидетельство о рождении
                        </option>
                        <option value="Other">Другое</option>
                      </Select>
                    </label>
                    <label className={styles.formGroup}>
                      <span>Пол</span>
                      <Select
                        aria-label="Пол"
                        value={pData.documents.gender}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documentCreated = false;
                          updated[pData.index].documents.gender =
                            e.target.value;
                          setPassengerData(updated);
                        }}
                      >
                        <option value="Male">Мужской</option>
                        <option value="Female">Женский</option>
                      </Select>
                    </label>
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formGroup}>
                      <span>Имя *</span>
                      <input
                        type="text"
                        value={pData.documents.firstName}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documentCreated = false;
                          updated[pData.index].documents.firstName =
                            e.target.value;
                          setPassengerData(updated);
                        }}
                        placeholder="Имя"
                      />
                    </label>
                    <label className={styles.formGroup}>
                      <span>Отчество</span>
                      <input
                        type="text"
                        value={pData.documents.middleName}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documentCreated = false;
                          updated[pData.index].documents.middleName =
                            e.target.value;
                          setPassengerData(updated);
                        }}
                        placeholder="Отчество (необязательно)"
                      />
                    </label>
                    <label className={styles.formGroup}>
                      <span>Фамилия *</span>
                      <input
                        type="text"
                        value={pData.documents.lastName}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documentCreated = false;
                          updated[pData.index].documents.lastName =
                            e.target.value;
                          setPassengerData(updated);
                        }}
                        placeholder="Фамилия"
                      />
                    </label>
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formGroup}>
                      <span>
                        Серия{' '}
                        {pData.documents.type === 'Other'
                          ? '(необязательно)'
                          : '*'}
                      </span>
                      <input
                        type="text"
                        value={pData.documents.series}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documentCreated = false;
                          updated[pData.index].documents.series =
                            e.target.value;
                          setPassengerData(updated);
                        }}
                        placeholder={
                          pData.documents.type === 'BirthCertificate'
                            ? 'I-МЮ'
                            : pData.documents.type === 'ForeignPassport'
                              ? '2 цифры'
                              : '4 цифры'
                        }
                      />
                    </label>
                    <label className={styles.formGroup}>
                      <span>Номер документа *</span>
                      <input
                        type="text"
                        value={pData.documents.number}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documentCreated = false;
                          updated[pData.index].documents.number =
                            e.target.value;
                          setPassengerData(updated);
                        }}
                        placeholder={
                          pData.documents.type === 'ForeignPassport'
                            ? '8 цифр'
                            : pData.documents.type === 'Other'
                              ? 'Номер документа'
                              : '6 цифр'
                        }
                        maxLength={
                          pData.documents.type === 'ForeignPassport'
                            ? 8
                            : pData.documents.type === 'Other'
                              ? 30
                              : 6
                        }
                      />
                    </label>
                  </div>
                  <div className={styles.formRow}>
                    <label className={styles.formGroup}>
                      <span>Дата рождения *</span>
                      <DateInput
                        label="Дата рождения"
                        max={new Date().toISOString().slice(0, 10)}
                        value={pData.documents.dateOfBirth}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documentCreated = false;
                          updated[pData.index].documents.dateOfBirth =
                            e.target.value;
                          setPassengerData(updated);
                        }}
                      />
                    </label>
                    <label className={styles.formGroup}>
                      <span>Срок действия (необязательно)</span>
                      <DateInput
                        label="Срок действия"
                        min={new Date(Date.now() + 86400000)
                          .toISOString()
                          .slice(0, 10)}
                        value={pData.documents.validityPeriod}
                        onChange={(e) => {
                          const updated = [...passengerData];
                          updated[pData.index].documentCreated = false;
                          updated[pData.index].documents.validityPeriod =
                            e.target.value;
                          setPassengerData(updated);
                        }}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <div className={styles.buttonRow}>
        <Button
          variant="secondary"
          className={styles.backBtn}
          onClick={() => onBack(passengerData)}
        >
          Назад
        </Button>
        <Button
          variant="primary"
          className={styles.nextBtn}
          onClick={handleNext}
          disabled={!allFieldsFilled || creating}
        >
          {creating ? 'Создание...' : 'Далее: выбрать места'}
        </Button>
      </div>
    </div>
  );
}

function Step2SeatSelection({
  flight,
  passengerData,
  initialSelection,
  onNext,
  onBack,
}) {
  const [selectedSeats, setSelectedSeats] = useState(
    () =>
      initialSelection?.seats ||
      Object.fromEntries(passengerData.map((_, i) => [i, null])),
  );
  const [seatTypes, setSeatTypes] = useState(
    () =>
      initialSelection?.seatTypes ||
      Object.fromEntries(passengerData.map((_, i) => [i, 'economy'])),
  );
  const [activePassenger, setActivePassenger] = useState(0);
  const bookedSeats = flight.bookings || [];

  const generateSeatMap = () => {
    const airplane = flight.airplane;
    const seats = [];
    for (let row = 1; row <= airplane.buisnessRows; row++) {
      const rowData = {};
      const letters = ['A', 'C', 'D', 'F'];
      for (const letter of letters) {
        const seatNumber = `${row}${letter}`;
        rowData[letter] = {
          number: seatNumber,
          isBooked: bookedSeats.includes(seatNumber),
          isBusiness: true,
        };
      }
      seats.push({ type: 'business', row, seats: rowData, letters });
    }
    const economyStartRow = airplane.buisnessRows + 1;
    let economyRowCount = 0;
    for (
      let row = economyStartRow;
      row < economyStartRow + airplane.rows;
      row++
    ) {
      if (row === airplane.spacePlusRow) seats.push({ type: 'spacer' });
      const rowData = {};
      const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
      for (const letter of letters) {
        const seatNumber = `${row}${letter}`;
        rowData[letter] = {
          number: seatNumber,
          isBooked: bookedSeats.includes(seatNumber),
          isBusiness: false,
        };
      }
      seats.push({ type: 'economy', row, seats: rowData, letters });
      economyRowCount++;
    }
    return seats;
  };

  const seatMap = generateSeatMap();

  function handleSeatClick(seatNumber, passengerIndex, isBusiness = false) {
    if (selectedSeats[passengerIndex] === seatNumber) {
      setSelectedSeats((prev) => ({ ...prev, [passengerIndex]: null }));
      setSeatTypes((prev) => ({ ...prev, [passengerIndex]: 'economy' }));
    } else {
      setSelectedSeats((prev) => ({ ...prev, [passengerIndex]: seatNumber }));
      setSeatTypes((prev) => ({
        ...prev,
        [passengerIndex]: isBusiness ? 'business' : 'economy',
      }));
      const next = passengerData.findIndex(
        (_, i) => i !== passengerIndex && !selectedSeats[i],
      );
      if (next >= 0) setActivePassenger(next);
    }
  }

  const allSeatsSelected =
    passengerData.length > 0 &&
    passengerData.every((_, i) => Boolean(selectedSeats[i]));

  return (
    <div className={styles.stepContent}>
      <h2>Шаг 2: Выбор мест</h2>
      <p>
        Выберите пассажира справа, затем свободное место на схеме. Нажмите
        выбранное место повторно, чтобы освободить его.
      </p>
      <div className={styles.seatSelectionContainer}>
        <div className={styles.seatSelectionLeft}>
          <div className={styles.seatMap}>
            <div className={styles.seatTitle}>{flight.airplane.name}</div>
            <div className={styles.seatLegend}>
              <span>□ Свободно</span>
              <span>▧ Занято</span>
              <span>✓ Выбрано</span>
              <span>Бизнес — первые ряды</span>
            </div>
            <div className={styles.seatMapContent}>
              {seatMap.map((row, rowIndex) => {
                if (row.type === 'spacer')
                  return <div key="spacer" className={styles.spacer}></div>;
                const isBusiness = row.type === 'business';
                return (
                  <div key={rowIndex} className={styles.seatRowWrapper}>
                    <div className={styles.rowNumber}>{row.row}</div>
                    <div className={styles.seatsLeftGroup}>
                      {row.letters
                        .slice(0, isBusiness ? 2 : 3)
                        .map((letter) => {
                          const seat = row.seats[letter];
                          const isSelected = Object.values(
                            selectedSeats,
                          ).includes(seat.number);
                          return (
                            <button
                              key={seat.number}
                              className={`${styles.seat} ${isBusiness ? styles.seatBusiness : ''} ${seat.isBooked ? styles.seatBooked : ''} ${isSelected ? styles.seatSelected : ''}`}
                              onClick={() => {
                                if (!seat.isBooked) {
                                  const passengerIdx = Object.entries(
                                    selectedSeats,
                                  ).find(([_, s]) => s === seat.number)?.[0];
                                  if (passengerIdx !== undefined) {
                                    handleSeatClick(
                                      seat.number,
                                      parseInt(passengerIdx),
                                      isBusiness,
                                    );
                                  } else {
                                    handleSeatClick(
                                      seat.number,
                                      activePassenger,
                                      isBusiness,
                                    );
                                  }
                                }
                              }}
                              disabled={seat.isBooked}
                              aria-pressed={isSelected}
                              aria-label={`Место ${seat.number}, ${isBusiness ? 'бизнес' : 'эконом'}${seat.isBooked ? ', занято' : isSelected ? ', выбрано' : ', свободно'}`}
                            >
                              {seat.number}
                              {isSelected && (
                                <span
                                  className={styles.seatAssignedBadge}
                                  aria-hidden="true"
                                >
                                  ✓
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                    <div className={styles.aisle}></div>
                    <div className={styles.seatsRightGroup}>
                      {row.letters.slice(isBusiness ? 2 : 3).map((letter) => {
                        const seat = row.seats[letter];
                        const isSelected = Object.values(
                          selectedSeats,
                        ).includes(seat.number);
                        return (
                          <button
                            key={seat.number}
                            className={`${styles.seat} ${isBusiness ? styles.seatBusiness : ''} ${seat.isBooked ? styles.seatBooked : ''} ${isSelected ? styles.seatSelected : ''}`}
                            onClick={() => {
                              if (!seat.isBooked) {
                                const passengerIdx = Object.entries(
                                  selectedSeats,
                                ).find(([_, s]) => s === seat.number)?.[0];
                                if (passengerIdx !== undefined) {
                                  handleSeatClick(
                                    seat.number,
                                    parseInt(passengerIdx),
                                    isBusiness,
                                  );
                                } else {
                                  handleSeatClick(
                                    seat.number,
                                    activePassenger,
                                    isBusiness,
                                  );
                                }
                              }
                            }}
                            disabled={seat.isBooked}
                            aria-pressed={isSelected}
                            aria-label={`Место ${seat.number}, ${isBusiness ? 'бизнес' : 'эконом'}${seat.isBooked ? ', занято' : isSelected ? ', выбрано' : ', свободно'}`}
                          >
                            {seat.number}
                            {isSelected && (
                              <span
                                className={styles.seatAssignedBadge}
                                aria-hidden="true"
                              >
                                ✓
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className={styles.passengerSeatAssignment}>
          <h3>Распределение мест</h3>
          {passengerData.map((p, i) => {
            const firstName =
              p.documents?.firstName || p.documents?.FirstName || '';
            const lastName =
              p.documents?.lastName || p.documents?.LastName || '';
            const passengerName = firstName
              ? `${firstName} ${lastName}`.trim()
              : `Пассажир ${i + 1}`;
            return (
              <div
                key={i}
                className={`${styles.passengerSeatRow} ${activePassenger === i ? styles.passengerSeatActive : ''}`}
              >
                <button
                  className={styles.selectPassengerSeat}
                  aria-pressed={activePassenger === i}
                  onClick={() => setActivePassenger(i)}
                  aria-label={`Выбрать пассажира ${i + 1}: ${passengerName}`}
                >
                  Пассажир {i + 1}
                </button>
                <div className={styles.passengerLabel}>
                  <svg
                    className={styles.passengerNameIcon}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                  <span>{passengerName}</span>
                </div>
                <div
                  className={`${styles.seatDisplay} ${selectedSeats[i] ? styles.seatDisplayAssigned : ''}`}
                >
                  {selectedSeats[i] || 'Не назначено'}
                </div>
                {selectedSeats[i] && (
                  <button
                    className={styles.clearSeatBtn}
                    onClick={() => handleSeatClick(selectedSeats[i], i)}
                    title="Отменить выбор"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className={styles.buttonRow}>
        <Button
          variant="secondary"
          className={styles.backBtn}
          onClick={() => onBack({ seats: selectedSeats, seatTypes })}
        >
          Назад
        </Button>
        <Button
          variant="primary"
          className={styles.nextBtn}
          onClick={() => onNext({ seats: selectedSeats, seatTypes: seatTypes })}
          disabled={!allSeatsSelected}
        >
          Далее: услуги
        </Button>
      </div>
    </div>
  );
}

function StepReviewServices({
  flight,
  passengerData,
  selectedSeats,
  initialServices,
  onNext,
  onBack,
}) {
  const [localServices, setLocalServices] = useState(
    passengerData.map(
      (_, i) => initialServices?.[i] || { hasLuggage: false, hasFood: false },
    ),
  );

  const calculateTotal = () => {
    let total = 0;
    const seatTypes = selectedSeats.seatTypes || {};
    const seats = selectedSeats.seats || selectedSeats;

    passengerData.forEach((p, i) => {
      const isBusiness = seatTypes[i] === 'business';
      const businessPrice =
        flight?.businessPrice ||
        flight?.BusinessPrice ||
        flight?.premiumPrice ||
        flight?.PremiumPrice ||
        0;
      const economyPrice =
        flight?.flightPrice ||
        flight?.FlightPrice ||
        flight?.economyPrice ||
        flight?.EconomyPrice ||
        0;
      const basePrice =
        p.type === PASSENGER_TYPE.Baby
          ? 0
          : economyPrice +
            (isBusiness
              ? businessPrice * (p.type === PASSENGER_TYPE.Kid ? 0.5 : 1)
              : 0);
      total += basePrice;

      if (localServices[i].hasLuggage)
        total += flight?.luggagePrice || flight?.LuggagePrice || 0;
      if (localServices[i].hasFood)
        total += flight?.foodPrice || flight?.FoodPrice || 0;
    });
    return total;
  };

  return (
    <div className={styles.stepContent}>
      <h2>Проверка и услуги</h2>
      <p>Добавьте дополнительные услуги для этого рейса.</p>
      <div className={styles.reviewSummary}>
        <div className={styles.reviewSection}>
          <h3>Данные рейса</h3>
          <div className={styles.reviewRow}>
            <span>Маршрут: </span>
            <span>
              {flight?.fromAirport?.city || 'N/A'} →{' '}
              {flight?.toAirport?.city || 'N/A'}
            </span>
          </div>
          {passengerData.map((p, i) => {
            const firstName =
              p.documents?.firstName || p.documents?.FirstName || '';
            const lastName =
              p.documents?.lastName || p.documents?.LastName || '';
            const passengerName = firstName
              ? `${firstName} ${lastName}`.trim()
              : `Пассажир ${i + 1}`;
            const seatTypes = selectedSeats.seatTypes || {};
            const seats = selectedSeats.seats || selectedSeats;
            const isBusiness = seatTypes[i] === 'business';
            const businessPrice =
              flight?.businessPrice ||
              flight?.BusinessPrice ||
              flight?.premiumPrice ||
              flight?.PremiumPrice ||
              0;
            const economyPrice =
              flight?.flightPrice ||
              flight?.FlightPrice ||
              flight?.economyPrice ||
              flight?.EconomyPrice ||
              0;
            const basePrice =
              p.type === PASSENGER_TYPE.Baby
                ? 0
                : economyPrice +
                  (isBusiness
                    ? businessPrice * (p.type === PASSENGER_TYPE.Kid ? 0.5 : 1)
                    : 0);

            return (
              <div key={i} className={styles.passengerReviewCard}>
                <div className={styles.passengerReviewHeader}>
                  <div>
                    <strong>{passengerName}</strong>
                    <small>
                      Место: {seats[i]} {isBusiness ? '(Бизнес)' : ''}
                    </small>
                  </div>
                  <div className={styles.passengerPrice}>
                    {formatMoney(basePrice)}
                  </div>
                </div>
                <div className={styles.serviceCheckboxes}>
                  <label>
                    <input
                      type="checkbox"
                      checked={localServices[i].hasLuggage}
                      onChange={(e) => {
                        const updated = [...localServices];
                        updated[i].hasLuggage = e.target.checked;
                        setLocalServices(updated);
                      }}
                    />
                    Багаж +
                    {formatMoney(
                      flight?.luggagePrice || flight?.LuggagePrice || 0,
                    )}
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={localServices[i].hasFood}
                      onChange={(e) => {
                        const updated = [...localServices];
                        updated[i].hasFood = e.target.checked;
                        setLocalServices(updated);
                      }}
                    />
                    Питание +
                    {formatMoney(flight?.foodPrice || flight?.FoodPrice || 0)}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.reviewTotal}>
          <h3>Итого за рейс: {formatMoney(calculateTotal())}</h3>
        </div>
      </div>
      <div className={styles.buttonRow}>
        <Button
          variant="secondary"
          className={styles.backBtn}
          onClick={() => onBack(localServices)}
        >
          Назад
        </Button>
        <Button
          variant="primary"
          className={styles.nextBtn}
          onClick={() => onNext(localServices)}
        >
          Далее
        </Button>
      </div>
    </div>
  );
}

function FinalConfirmation({
  outboundFlight,
  returnFlight,
  passengerData,
  outboundSeats,
  returnSeats,
  outboundServices,
  returnServices,
  onBack,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate(); // Используем хук напрямую для надежности редиректа

  const calculateFlightTotal = (flight, seats, services, seatTypes) => {
    let total = 0;
    const seatList = seats.seats || seats;
    const types = seatTypes || {};
    passengerData.forEach((p, i) => {
      const isBusiness = types[i] === 'business';
      const businessPrice =
        flight?.businessPrice ||
        flight?.BusinessPrice ||
        flight?.premiumPrice ||
        flight?.PremiumPrice ||
        0;
      const economyPrice =
        flight?.flightPrice ||
        flight?.FlightPrice ||
        flight?.economyPrice ||
        flight?.EconomyPrice ||
        0;
      const basePrice =
        p.type === PASSENGER_TYPE.Baby
          ? 0
          : economyPrice +
            (isBusiness
              ? businessPrice * (p.type === PASSENGER_TYPE.Kid ? 0.5 : 1)
              : 0);
      total += basePrice;
      if (services[i]?.hasLuggage)
        total += flight?.luggagePrice || flight?.LuggagePrice || 0;
      if (services[i]?.hasFood)
        total += flight?.foodPrice || flight?.FoodPrice || 0;
    });
    return total;
  };

  async function handleFinalConfirm() {
    setLoading(true);
    setError('');
    try {
      const outboundSeatTypes = outboundSeats.seatTypes || {};
      const outboundSeatList = outboundSeats.seats || outboundSeats;
      const bookings = [];

      // 1. Формируем бронирования для рейса ТУДА
      passengerData.forEach((p, i) => {
        bookings.push({
          PassengerId: p.savedPassengerId,
          FlightId: outboundFlight.id || outboundFlight.Id,
          SeatNumber: outboundSeatList[i],
          HasLuggage: outboundServices[i]?.hasLuggage || false,
          HasFood: outboundServices[i]?.hasFood || false,
          IsBusiness: outboundSeatTypes[i] === 'business',
        });
      });

      // 2. Формируем бронирования для рейса ОБРАТНО (если есть)
      if (returnFlight) {
        const returnSeatTypes = returnSeats.seatTypes || {};
        const returnSeatList = returnSeats.seats || returnSeats;
        passengerData.forEach((p, i) => {
          bookings.push({
            PassengerId: p.savedPassengerId,
            FlightId: returnFlight.id || returnFlight.Id,
            SeatNumber: returnSeatList[i],
            HasLuggage: returnServices[i]?.hasLuggage || false,
            HasFood: returnServices[i]?.hasFood || false,
            IsBusiness: returnSeatTypes[i] === 'business',
          });
        });
      }

      // 3. Отправляем ОДИН заказ со всеми бронированиями

      const response = await apiClient.post('/orders', {
        UserId: user.id || user.userId,
        Bookings: bookings,
      });

      const orderId = response.data?.id || response.data?.Id || response.data;

      if (orderId) {
        navigate(`/order-confirmation/${orderId}`);
      } else {
        throw new Error(
          'Server returned success but no Order ID was provided.',
        );
      }
    } catch (err) {
      setError(
        `Не удалось создать заказ: ${err.response?.data?.message || err.message}`,
      );
      console.error('Booking error:', err);
    } finally {
      setLoading(false);
    }
  }

  const outboundTotal = calculateFlightTotal(
    outboundFlight,
    outboundSeats,
    outboundServices,
    outboundSeats.seatTypes,
  );
  const returnTotal = returnFlight
    ? calculateFlightTotal(
        returnFlight,
        returnSeats,
        returnServices,
        returnSeats.seatTypes,
      )
    : 0;

  return (
    <div className={styles.stepContent}>
      <h2>Подтвердите бронирование</h2>
      <p>Проверьте все рейсы и подтвердите единый заказ.</p>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <div className={styles.reviewSummary}>
        <div className={styles.reviewSection}>
          <h3>Рейс туда</h3>
          <div className={styles.reviewRow}>
            <span>Маршрут: </span>
            <span>
              {outboundFlight?.fromAirport?.city || 'N/A'} →{' '}
              {outboundFlight?.toAirport?.city || 'N/A'}
            </span>
          </div>
          <div className={styles.reviewRow}>
            <span>Цена рейса: </span>
            <span>{formatMoney(outboundTotal)}</span>
          </div>
        </div>

        {returnFlight && (
          <div className={styles.reviewSection}>
            <h3>Обратный рейс</h3>
            <div className={styles.reviewRow}>
              <span>Маршрут: </span>
              <span>
                {returnFlight?.fromAirport?.city || 'N/A'} →{' '}
                {returnFlight?.toAirport?.city || 'N/A'}
              </span>
            </div>
            <div className={styles.reviewRow}>
              <span>Цена рейса: </span>
              <span>{formatMoney(returnTotal)}</span>
            </div>
          </div>
        )}

        <div className={styles.reviewTotal}>
          <h3>
            Итоговая цена заказа: {formatMoney(outboundTotal + returnTotal)}
          </h3>
        </div>
      </div>

      <div className={styles.buttonRow}>
        <Button variant="secondary" className={styles.backBtn} onClick={onBack}>
          Назад
        </Button>
        <Button
          variant="primary"
          className={styles.confirmBtn}
          onClick={handleFinalConfirm}
          disabled={loading}
        >
          {loading ? 'Обработка...' : 'Подтвердить и создать заказ'}
        </Button>
      </div>
    </div>
  );
}

export function BookingPage() {
  const { flightId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const [flight, setFlight] = useState(null);
  const [returnFlight, setReturnFlight] = useState(
    location.state?.returnFlight || null,
  );
  const [passengers, setPassengers] = useState(
    location.state?.passengers || { adults: 1, kids: 0, babies: 0 },
  );

  const [step, setStep] = useState(0);
  const [passengerData, setPassengerData] = useState([]);

  // Состояния для раздельного хранения данных по рейсам
  const [outboundSeats, setOutboundSeats] = useState({});
  const [returnSeats, setReturnSeats] = useState({});
  const [outboundServices, setOutboundServices] = useState([]);
  const [returnServices, setReturnServices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const hasReturn = !!returnFlight;

  useEffect(() => {
    async function loadFlight() {
      if (!flightId) {
        setError('Рейс не выбран');
        return;
      }
      try {
        const response = await apiClient.get(`/flights/${flightId}`);
        const flightData = response.data;
        const status = flightData.status;
        if (
          status !== FLIGHT_STATUS.Scheduled &&
          status !== FLIGHT_STATUS.CheckIn
        ) {
          setError('Этот рейс больше недоступен для бронирования.');
          return;
        }
        setFlight(flightData);
      } catch (err) {
        setError('Не удалось загрузить данные рейса');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadFlight();
  }, [flightId]);

  if (loading) {
    return (
      <AppShell title="Бронирование рейса" subtitle="Завершите бронирование">
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка данных рейса...</div>
        </div>
      </AppShell>
    );
  }

  if (error || !flight) {
    return (
      <AppShell title="Бронирование рейса" subtitle="Завершите бронирование">
        <div className={styles.container}>
          <div className={styles.error}>{error || 'Рейс не найден'}</div>
          <button onClick={() => navigate(-1)} className={styles.backBtn}>
            Назад
          </button>
        </div>
      </AppShell>
    );
  }

  const handleNextStep = () => {
    if (step === 1) setStep(2);
    else if (step === 2) setStep(hasReturn ? 3 : 4);
    else if (step === 3) setStep(4);
    else if (step === 4) setStep(hasReturn ? 5 : 6);
    else if (step === 5) setStep(6);
  };

  const handlePrevStep = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(hasReturn ? 3 : 2);
    else if (step === 5) setStep(4);
    else if (step === 6) setStep(hasReturn ? 5 : 4);
  };

  return (
    <AppShell title="Бронирование рейса" subtitle="Завершите бронирование">
      <div className={styles.container}>
        <div
          className={styles.stepsIndicator}
          role="list"
          aria-label="Этапы бронирования"
        >
          <div
            role="listitem"
            className={`${styles.step} ${step === 0 ? styles.stepActive : step > 0 ? styles.stepComplete : ''}`}
          >
            Рейс
          </div>
          <div
            role="listitem"
            className={`${styles.step} ${step === 1 ? styles.stepActive : step > 1 ? styles.stepComplete : ''}`}
          >
            Пассажиры
          </div>
          <div
            role="listitem"
            className={`${styles.step} ${step === 2 ? styles.stepActive : step > 2 ? styles.stepComplete : ''}`}
          >
            Места туда
          </div>
          {hasReturn && (
            <div
              role="listitem"
              className={`${styles.step} ${step === 3 ? styles.stepActive : step > 3 ? styles.stepComplete : ''}`}
            >
              Места обратно
            </div>
          )}
          <div
            role="listitem"
            className={`${styles.step} ${step === 4 ? styles.stepActive : step > 4 ? styles.stepComplete : ''}`}
          >
            Услуги туда
          </div>
          {hasReturn && (
            <div
              role="listitem"
              className={`${styles.step} ${step === 5 ? styles.stepActive : step > 5 ? styles.stepComplete : ''}`}
            >
              Услуги обратно
            </div>
          )}
          <div
            role="listitem"
            className={`${styles.step} ${step === 6 ? styles.stepActive : ''}`}
          >
            Подтверждение
          </div>
        </div>

        {step === 0 && (
          <div className={styles.stepContent}>
            <h2>Информация о рейсе</h2>
            <p>Проверьте данные рейса и доступные услуги.</p>
            <div className={styles.flightDetailsGrid}>
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <h3>Маршрут</h3>
                </div>
                <div className={styles.routeDisplay}>
                  <div className={styles.routePoint}>
                    <div className={styles.routeCity}>
                      {flight?.fromAirport?.city || 'N/A'}
                    </div>
                    <div className={styles.routeCode}>
                      {flight?.fromAirport?.code || '---'}
                    </div>
                  </div>
                  <div className={styles.routeArrow}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                  <div className={styles.routePoint}>
                    <div className={styles.routeCity}>
                      {flight?.toAirport?.city || 'N/A'}
                    </div>
                    <div className={styles.routeCode}>
                      {flight?.toAirport?.code || '---'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Times Card */}
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <h3>Вылет и прибытие</h3>
                </div>
                <div className={styles.timesDisplay}>
                  <div className={styles.timeBlock}>
                    <span className={styles.timeLabel}>Вылет</span>
                    <span className={styles.timeValue}>
                      {flight?.departureTime
                        ? new Date(flight.departureTime).toLocaleTimeString(
                            'ru-RU',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            },
                          )
                        : 'N/A'}
                    </span>
                    <span className={styles.dateValue}>
                      {flight?.departureTime
                        ? new Date(flight.departureTime).toLocaleDateString(
                            'ru-RU',
                            { month: 'short', day: 'numeric', year: 'numeric' },
                          )
                        : 'N/A'}
                    </span>
                  </div>
                  <div className={styles.timeBlock}>
                    <span className={styles.timeLabel}>Прибытие</span>
                    <span className={styles.timeValue}>
                      {flight?.arrivalTime
                        ? new Date(flight.arrivalTime).toLocaleTimeString(
                            'ru-RU',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                            },
                          )
                        : 'N/A'}
                    </span>
                    <span className={styles.dateValue}>
                      {flight?.arrivalTime
                        ? new Date(flight.arrivalTime).toLocaleDateString(
                            'ru-RU',
                            { month: 'short', day: 'numeric', year: 'numeric' },
                          )
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Duration Card */}
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <h3>Длительность полёта</h3>
                </div>
                <div className={styles.durationDisplay}>
                  <div className={styles.durationValue}>
                    {flight?.durationMins
                      ? `${Math.floor(flight.durationMins / 60)}ч ${flight.durationMins % 60}м`
                      : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Availability Card */}
              <div className={styles.detailCard}>
                <div className={styles.detailHeader}>
                  <h3>Свободные места</h3>
                </div>
                <div className={styles.availabilityDisplay}>
                  <div className={styles.seatInfo}>
                    <span className={styles.seatLabel}>Эконом</span>
                    <span className={styles.seatCount}>
                      {(flight?.totalSeats || 0) - (flight?.bookedSeats || 0)} /{' '}
                      {flight?.totalSeats || 0} доступно
                    </span>
                  </div>
                  <div className={styles.seatInfo}>
                    <span className={styles.seatLabel}>Бизнес</span>
                    <span className={styles.seatCount}>
                      {(flight?.businessSeats || 0) -
                        (flight?.bookedBusinessSeats || 0)}{' '}
                      / {flight?.businessSeats || 0} доступно
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className={styles.pricingSection}>
              <h3>Доступные услуги и цены</h3>
              <div className={styles.priceGrid}>
                <div className={styles.priceCard}>
                  <div className={styles.priceLabel}>Базовый тариф</div>
                  <div className={styles.priceValue}>
                    {formatMoney(
                      flight?.flightPrice ||
                        flight?.FlightPrice ||
                        flight?.economyPrice ||
                        flight?.EconomyPrice ||
                        0,
                    )}
                  </div>
                  <div className={styles.priceDesc}>На человека</div>
                </div>

                <div className={styles.priceCard}>
                  <div className={styles.priceLabel}>Багаж</div>
                  <div className={styles.priceValue}>
                    {formatMoney(
                      flight?.luggagePrice || flight?.LuggagePrice || 0,
                    )}
                  </div>
                  <div className={styles.priceDesc}>Дополнительная услуга</div>
                </div>

                <div className={styles.priceCard}>
                  <div className={styles.priceLabel}>Питание</div>
                  <div className={styles.priceValue}>
                    {formatMoney(flight?.foodPrice || flight?.FoodPrice || 0)}
                  </div>
                  <div className={styles.priceDesc}>Дополнительная услуга</div>
                </div>

                <div className={styles.priceCard}>
                  <div className={styles.priceLabel}>Бизнес-класс</div>
                  <div className={styles.priceValue}>
                    {formatMoney(
                      flight?.businessPrice ||
                        flight?.BusinessPrice ||
                        flight?.premiumPrice ||
                        flight?.PremiumPrice ||
                        0,
                    )}
                  </div>
                  <div className={styles.priceDesc}>
                    Места повышенного комфорта
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.buttonRow}>
              <Button
                variant="secondary"
                className={styles.backBtn}
                onClick={() => navigate(-1)}
              >
                Отмена
              </Button>
              <Button
                variant="primary"
                className={styles.nextBtn}
                onClick={() => setStep(1)}
              >
                Перейти к бронированию
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <Step1PassengerDocuments
            flight={flight}
            passengers={passengers}
            initialData={passengerData}
            onNext={(data) => {
              setPassengerData(data);
              handleNextStep();
            }}
            onBack={(data) => {
              setPassengerData(data);
              setStep(0);
            }}
          />
        )}

        {step === 2 && (
          <Step2SeatSelection
            key="outbound-seats"
            flight={flight}
            passengerData={passengerData}
            initialSelection={outboundSeats}
            onNext={(data) => {
              setOutboundSeats(data);
              handleNextStep();
            }}
            onBack={(data) => {
              setOutboundSeats(data);
              handlePrevStep();
            }}
          />
        )}

        {hasReturn && step === 3 && (
          <Step2SeatSelection
            key="return-seats"
            flight={returnFlight}
            passengerData={passengerData}
            initialSelection={returnSeats}
            onNext={(data) => {
              setReturnSeats(data);
              handleNextStep();
            }}
            onBack={(data) => {
              setReturnSeats(data);
              handlePrevStep();
            }}
          />
        )}

        {step === 4 && (
          <StepReviewServices
            flight={flight}
            passengerData={passengerData}
            key="outbound-services"
            initialServices={outboundServices}
            selectedSeats={outboundSeats}
            onNext={(data) => {
              setOutboundServices(data);
              handleNextStep();
            }}
            onBack={(data) => {
              setOutboundServices(data);
              handlePrevStep();
            }}
          />
        )}

        {hasReturn && step === 5 && (
          <StepReviewServices
            flight={returnFlight}
            passengerData={passengerData}
            key="return-services"
            initialServices={returnServices}
            selectedSeats={returnSeats}
            onNext={(data) => {
              setReturnServices(data);
              handleNextStep();
            }}
            onBack={(data) => {
              setReturnServices(data);
              handlePrevStep();
            }}
          />
        )}

        {step === 6 && (
          <FinalConfirmation
            outboundFlight={flight}
            returnFlight={returnFlight}
            passengerData={passengerData}
            outboundSeats={outboundSeats}
            returnSeats={returnSeats}
            outboundServices={outboundServices}
            returnServices={returnServices}
            onBack={handlePrevStep}
          />
        )}
      </div>
    </AppShell>
  );
}
