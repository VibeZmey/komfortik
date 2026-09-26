import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AirportAutosuggest } from '../components/ui/AirportAutosuggest';
import { Button } from '../components/ui/Button';
import styles from './SearchPage.module.css';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';

const PAGE_SIZE = 6;

const SORT_FIELD_ENUM = {
  Price: 0,
  DepartureTime: 1,
  ArrivalTime: 2,
  Duration: 3,
};

const SORT_DIRECTION_ENUM = {
  Ascending: 0,
  Descending: 1,
};

function getSegmentValue(segment, keyLower, keyUpper) {
  if (!segment) {
    return undefined;
  }

  return segment[keyLower] ?? segment[keyUpper];
}

function toDateOnlyString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateOnly(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function parseIntParam(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function getMonthGrid(monthDate) {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstWeekday = (firstDay.getDay() + 6) % 7;
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstWeekday);

  const days = [];
  for (let i = 0; i < 42; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }

  return days;
}

function formatTime(dateValue) {
  if (!dateValue) {
    return '--:--';
  }

  return new Date(dateValue).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function normalizeTimezoneOffset(offset) {
  const parsed = Number(offset);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatAirportDateTime(dateValue, timezoneOffset) {
  if (!dateValue) {
    return { time: '--:--', date: '-' };
  }

  const offsetHours = normalizeTimezoneOffset(timezoneOffset);
  const shifted = new Date(new Date(dateValue).getTime() + offsetHours * 60 * 60 * 1000);

  const time = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(shifted);

  const date = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    weekday: 'short',
  }).format(shifted);

  return { time, date };
}

function formatDateLabel(dateValue, timezoneOffset) {
  if (!dateValue) {
    return '-';
  }

  const { date } = formatAirportDateTime(dateValue, timezoneOffset);
  return date;
}

function formatTimeLabel(dateValue, timezoneOffset) {
  return formatAirportDateTime(dateValue, timezoneOffset).time;
}

function formatDuration(durationMins) {
  const mins = Number(durationMins);
  if (!Number.isFinite(mins) || mins <= 0) {
    return '-';
  }

  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  if (hours > 0) {
    return `${hours} ч ${rest} м`;
  }

  return `${rest} м`;
}

function formatPrice(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return '—';
  }

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(num);
}

function getBadgeLabel(index, sortBy, sortDirection) {
  if (index !== 0) {
    return null;
  }

  if (sortBy === 'Price' && sortDirection === 'Ascending') {
    return 'Самый дешёвый';
  }

  if (sortBy === 'Price' && sortDirection === 'Descending') {
    return 'Выгодный вариант';
  }

  if (sortBy === 'Duration' && sortDirection === 'Ascending') {
    return 'Самый быстрый';
  }

  return null;
}

function renderSegmentCard(segment, label) {
  const fromCity = getSegmentValue(segment?.fromAirport || segment?.FromAirport, 'city', 'City') || '-';
  const toCity = getSegmentValue(segment?.toAirport || segment?.ToAirport, 'city', 'City') || '-';
  const fromCode = getSegmentValue(segment?.fromAirport || segment?.FromAirport, 'code', 'Code') || '---';
  const toCode = getSegmentValue(segment?.toAirport || segment?.ToAirport, 'code', 'Code') || '---';
  const fromTimezoneOffset = getSegmentValue(segment?.fromAirport || segment?.FromAirport, 'timezoneOffset', 'TimezoneOffset');
  const toTimezoneOffset = getSegmentValue(segment?.toAirport || segment?.ToAirport, 'timezoneOffset', 'TimezoneOffset');
  const departureTime = getSegmentValue(segment, 'departureTime', 'DepartureTime');
  const arrivalTime = getSegmentValue(segment, 'arrivalTime', 'ArrivalTime');
  const durationMins = getSegmentValue(segment, 'durationMins', 'DurationMins');

  return (
    <div className={styles.tripSection}>
      <div className={styles.tripLabel}>{label}</div>
      <div className={styles.routeRow}>
        <div className={styles.pointBlock}>
          <div className={styles.timeValue}>{formatTimeLabel(departureTime, fromTimezoneOffset)}</div>
          <div className={styles.cityValue}>{fromCity}</div>
          <div className={styles.dateValue}>{formatDateLabel(departureTime, fromTimezoneOffset)}</div>
        </div>

        <div className={styles.durationBlock}>
          <div className={styles.durationValue}>{formatDuration(durationMins)}</div>
          <div className={styles.durationCodes}>
            <span className={styles.airportCode}>{fromCode}</span>
            <span className={styles.airportCode}>{toCode}</span>
          </div>
          <div className={styles.durationLine} />
        </div>

        <div className={`${styles.pointBlock} ${styles.pointBlockEnd}`}>
          <div className={styles.timeValue}>{formatTimeLabel(arrivalTime, toTimezoneOffset)}</div>
          <div className={styles.cityValue}>{toCity}</div>
          <div className={styles.dateValue}>{formatDateLabel(arrivalTime, toTimezoneOffset)}</div>
        </div>
      </div>
    </div>
  );
}

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => Boolean(state.accessToken));
  const [origin, setOrigin] = useState(() => searchParams.get('from') || '');
  const [destination, setDestination] = useState(() => searchParams.get('to') || '');
  const [departureDate, setDepartureDate] = useState(() => searchParams.get('departure') || '');
  const [returnDate, setReturnDate] = useState(() => searchParams.get('return') || '');
  const [adults, setAdults] = useState(() => parseIntParam(searchParams.get('adults'), 1));
  const [kids, setKids] = useState(() => parseIntParam(searchParams.get('kids'), 0));
  const [babies, setBabies] = useState(() => parseIntParam(searchParams.get('babies'), 0));
  const [cabinClass, setCabinClass] = useState(() => searchParams.get('class') || 'Economy');
  const [showPassengerPanel, setShowPassengerPanel] = useState(false);
  const [maxTotalPrice, setMaxTotalPrice] = useState(() => searchParams.get('maxPrice') || '');
  const [departureTimeSlot, setDepartureTimeSlot] = useState(() => searchParams.get('slot') || 'any');
  const [airlineId, setAirlineId] = useState(() => searchParams.get('airlineId') || '');
  const [sortBy, setSortBy] = useState(() => searchParams.get('sortBy') || 'Price');
  const [sortDirection, setSortDirection] = useState(() => searchParams.get('direction') || 'Ascending');
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [showStaleDataWarning, setShowStaleDataWarning] = useState(false);
  const [bookingFlight, setBookingFlight] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const passengerPanelRef = useRef(null);
  const departureCalendarRef = useRef(null);
  const returnCalendarRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const [openCalendarField, setOpenCalendarField] = useState(null);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const didRestoreSearch = useRef(false);

  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const sortFields = useMemo(
    () => [
      { value: 'Price', label: 'Цена' },
      { value: 'DepartureTime', label: 'Время вылета' },
      { value: 'ArrivalTime', label: 'Время прибытия' },
      { value: 'Duration', label: 'Длительность' },
    ],
    []
  );

  useEffect(() => {
    function handlePointerDown(event) {
      if (!passengerPanelRef.current) {
        return;
      }

      if (!passengerPanelRef.current.contains(event.target)) {
        setShowPassengerPanel(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  useEffect(() => {
    function handleOutsideCalendarClick(event) {
      const insideDeparture = departureCalendarRef.current && departureCalendarRef.current.contains(event.target);
      const insideReturn = returnCalendarRef.current && returnCalendarRef.current.contains(event.target);
      if (!insideDeparture && !insideReturn) {
        setOpenCalendarField(null);
      }
    }

    document.addEventListener('pointerdown', handleOutsideCalendarClick);
    return () => document.removeEventListener('pointerdown', handleOutsideCalendarClick);
  }, []);

  // Inactivity timer for stale data warning
  useEffect(() => {
    if (results === null || results.length === 0) {
      return;
    }

    function resetTimer() {
      setShowStaleDataWarning(false);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      inactivityTimerRef.current = setTimeout(() => {
        setShowStaleDataWarning(true);
      }, 2 * 60 * 1000); // 2 minutes
    }

    // Start timer when results are loaded
    resetTimer();

    // Reset timer on user interaction
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [results]);

  const departureWindowMap = {
    any: { from: undefined, to: undefined },
    morning: { from: 6, to: 11 },
    evening: { from: 18, to: 23 },
    night: { from: 0, to: 5 },
  };

  useEffect(() => {
    const next = new URLSearchParams();
    if (origin) next.set('from', origin);
    if (destination) next.set('to', destination);
    if (departureDate) next.set('departure', departureDate);
    if (returnDate) next.set('return', returnDate);
    if (adults !== 1) next.set('adults', String(adults));
    if (kids > 0) next.set('kids', String(kids));
    if (babies > 0) next.set('babies', String(babies));
    if (cabinClass !== 'Economy') next.set('class', cabinClass);
    if (maxTotalPrice) next.set('maxPrice', maxTotalPrice);
    if (departureTimeSlot !== 'any') next.set('slot', departureTimeSlot);
    if (airlineId) next.set('airlineId', airlineId);
    if (sortBy !== 'Price') next.set('sortBy', sortBy);
    if (sortDirection !== 'Ascending') next.set('direction', sortDirection);

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [
    origin,
    destination,
    departureDate,
    returnDate,
    adults,
    kids,
    babies,
    cabinClass,
    maxTotalPrice,
    departureTimeSlot,
    airlineId,
    sortBy,
    sortDirection,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (didRestoreSearch.current) {
      return;
    }

    didRestoreSearch.current = true;
    if (!origin || !destination || !departureDate) {
      return;
    }

    setLoading(true);
    fetchFlights(1, false)
      .catch(() => {
        setResults([]);
        setHasMore(false);
        setError('Поиск не удался. Попробуйте позже.');
      })
      .finally(() => setLoading(false));
  }, [origin, destination, departureDate]);

  function buildSearchParams(nextPageNumber) {
    const params = {
      OriginCity: origin,
      DestinationCity: destination,
      DepartureDate: departureDate,
      ReturnDate: returnDate || undefined,
      Adults: adults,
      Kids: kids,
      Babies: babies,
      MaxTotalPrice: maxTotalPrice || undefined,
      DepartureHourFrom: departureWindowMap[departureTimeSlot].from,
      DepartureHourTo: departureWindowMap[departureTimeSlot].to,
      AirlineId: airlineId || undefined,
      IsBusinessOnly: cabinClass === 'Business',
      SortBy: SORT_FIELD_ENUM[sortBy] ?? 0,
      SortDirection: SORT_DIRECTION_ENUM[sortDirection] ?? 0,
      PageSize: PAGE_SIZE,
      PageNumber: nextPageNumber,
    };

    return params;
  }

  async function fetchFlights(nextPageNumber, append) {
    const params = buildSearchParams(nextPageNumber);
    const response = await apiClient.get('/flights', { params });
    const nextResults = Array.isArray(response.data) ? response.data : [];

    setResults((prev) => {
      if (!append) {
        return nextResults;
      }

      return [...(Array.isArray(prev) ? prev : []), ...nextResults];
    });

    setPageNumber(nextPageNumber);
    setHasMore(nextResults.length === PAGE_SIZE);
  }

  async function handleSearch(event) {
    event.preventDefault();
    setError('');

    if (!origin || !destination || !departureDate) {
      setError('Выберите оба города и дату вылета.');
      return;
    }

    setLoading(true);
    try {
      await fetchFlights(1, false);
    } catch (requestError) {
      setResults([]);
      setHasMore(false);
      setError('Поиск не удался. Попробуйте позже.');
      void requestError;
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadMore() {
    if (!hasMore || loading || loadingMore) {
      return;
    }

    setLoadingMore(true);
    setError('');
    try {
      await fetchFlights(pageNumber + 1, true);
    } catch (requestError) {
      setError('Не удалось загрузить дополнительные рейсы. Попробуйте снова.');
      void requestError;
    } finally {
      setLoadingMore(false);
    }
  }

   async function handleFlightClick(result) {
     const isAuthenticated = useAuthStore.getState().accessToken;

     if (!isAuthenticated) {
       setError('Войдите или зарегистрируйтесь, чтобы забронировать рейс');
       // Redirect to auth page after a delay
       setTimeout(() => {
         navigate('/auth');
       }, 2000);
       return;
     }

     const outboundFlight = result.outbound || result.Outbound;
     const returnFlight = result.return || result.Return;
     
     if (!outboundFlight) {
       setError('Выбран недействительный рейс. Попробуйте снова.');
       return;
     }

     const flightId = outboundFlight.id || outboundFlight.Id;
     setBookingLoading(true);
     setError('');

     try {
       const response = await apiClient.get(`/flights/${flightId}`);
       const fullFlight = response.data;

       const status = fullFlight.status;
       const FLIGHT_STATUS = {
         Scheduled: 0,
         CheckIn: 1,
         Boarding: 2,
         Departed: 3,
         Arrived: 4,
         Cancelled: 5,
         Delayed: 6,
       };

       if (status !== FLIGHT_STATUS.Scheduled && status !== FLIGHT_STATUS.CheckIn) {
         setError('Этот рейс больше недоступен для бронирования.');
         return;
       }

       // If there's a return flight, fetch it as well
       let returnFlightData = null;
       if (returnFlight) {
         const returnFlightId = returnFlight.id || returnFlight.Id;
         try {
           const returnResponse = await apiClient.get(`/flights/${returnFlightId}`);
           returnFlightData = returnResponse.data;
           
           if (returnFlightData.status !== FLIGHT_STATUS.Scheduled && returnFlightData.status !== FLIGHT_STATUS.CheckIn) {
             setError('Обратный рейс больше недоступен для бронирования.');
             return;
           }
         } catch (err) {
           setError('Не удалось загрузить данные обратного рейса. Попробуйте снова.');
           return;
         }
       }

       // Navigate to booking page with flight data (both outbound and return if available)
       navigate(`/booking/${flightId}`, {
         state: {
           flight: fullFlight,
           returnFlight: returnFlightData,
           passengers: {
             adults,
             kids,
             babies,
           },
         },
       });
     } catch (err) {
       setError('Не удалось загрузить данные рейса. Попробуйте снова.');
       console.error(err);
     } finally {
       setBookingLoading(false);
     }
   }

  function updatePassengerValue(type, value) {
    const next = Number.isFinite(value) ? value : 0;
    if (type === 'adults') {
      setAdults(Math.max(1, next));
      return;
    }

    if (type === 'kids') {
      setKids(Math.max(0, next));
      return;
    }

    setBabies(Math.max(0, next));
  }

  function openCalendar(field) {
    setOpenCalendarField((prev) => (prev === field ? null : field));
    setCalendarOffset(0);
  }

  function selectDate(field, date) {
    const dateValue = toDateOnlyString(date);
    if (field === 'departure') {
      setDepartureDate(dateValue);
      if (returnDate && returnDate < dateValue) {
        setReturnDate('');
      }
    } else {
      setReturnDate(dateValue);
    }
    setOpenCalendarField(null);
  }

  function renderCalendar(field) {
    const selectedValue = field === 'departure' ? departureDate : returnDate;
    const selectedDate = parseDateOnly(selectedValue);
    const minDate = field === 'return' && departureDate ? parseDateOnly(departureDate) || today : today;
    const monthBase = addMonths(startOfMonth(today), calendarOffset);
    const months = [monthBase, addMonths(monthBase, 1)];
    const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className={styles.calendarPopover}>
        <div className={styles.calendarHead}>
          <button
            type="button"
            className={styles.calendarArrowButton}
            onClick={() => setCalendarOffset((v) => Math.max(0, v - 1))}
            disabled={calendarOffset <= 0}
            aria-label="Предыдущие месяцы"
          >
            {'<'}
          </button>
          <span className={styles.calendarTitle}>Choose {field === 'departure' ? 'departure' : 'return'} date</span>
          <div className={styles.calendarNav}>
            <button
              type="button"
              className={styles.calendarArrowButton}
              onClick={() => setCalendarOffset((v) => v + 1)}
              aria-label="Следующие месяцы"
            >
              {'>'}
            </button>
          </div>
        </div>

        <div className={styles.calendarMonths}>
          {months.map((monthDate) => {
            const grid = getMonthGrid(monthDate);
            return (
              <div key={`${monthDate.getFullYear()}-${monthDate.getMonth()}`} className={styles.monthCard}>
                <div className={styles.monthTitle}>
                  {new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(monthDate)}
                </div>
                <div className={styles.weekdayRow}>
                  {weekdays.map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className={styles.daysGrid}>
                  {grid.map((day) => {
                    const dayString = toDateOnlyString(day);
                    const isPast = day < minDate;
                    const isCurrentMonth = day.getMonth() === monthDate.getMonth();
                    const isSelected = selectedDate && toDateOnlyString(selectedDate) === dayString;
                    return (
                      <button
                        key={dayString}
                        type="button"
                        className={`${styles.dayCell} ${!isCurrentMonth ? styles.dayMuted : ''} ${isSelected ? styles.daySelected : ''}`}
                        disabled={isPast}
                        onClick={() => selectDate(field, day)}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <AppShell title="Поиск рейсов" subtitle="Сравнивайте цены, фильтры и расписание в одном месте.">
      <div className={styles.container}>
        <section className={styles.searchPanel}>
          <form className={styles.searchBar} onSubmit={handleSearch}>
            <div className={styles.airportInputsWrapper}>
              <div className={styles.searchField}>
                <label className={styles.hiddenLabel}>Откуда</label>
                <AirportAutosuggest value={origin} onChange={setOrigin} placeholder="Откуда" />
              </div>

              <button
                type="button"
                className={styles.swapCitiesButton}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const temp = origin;
                  setOrigin(destination);
                  setDestination(temp);
                }}
                aria-label="Поменять города местами"
                title="Поменять города местами"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8h14m0 0l-4-4m4 4l-4 4" />
                  <path d="M21 16H7m0 0l4 4m-4-4l4-4" />
                </svg>
              </button>

              <div className={styles.searchField}>
                <label className={styles.hiddenLabel}>Куда</label>
                <AirportAutosuggest value={destination} onChange={setDestination} placeholder="Куда" />
              </div>
            </div>

            <div className={styles.searchField}>
              <label className={styles.hiddenLabel}>Дата вылета</label>
              <div className={styles.dateField} ref={departureCalendarRef}>
                <button type="button" className={styles.dateButton} onClick={() => openCalendar('departure')}>
                  <span>{departureDate ? formatDateLabel(departureDate) : 'Дата вылета'}</span>
                </button>
                {departureDate ? (
                  <button
                    type="button"
                    className={styles.dateActionClear}
                    aria-label="Очистить дату вылета"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setDepartureDate('');
                    }}
                  >
                    x
                  </button>
                ) : (
                  <span className={styles.dateActionIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
                {openCalendarField === 'departure' ? renderCalendar('departure') : null}
              </div>
            </div>

            <div className={styles.searchField}>
              <label className={styles.hiddenLabel}>Дата возвращения</label>
              <div className={styles.dateField} ref={returnCalendarRef}>
                <button type="button" className={styles.dateButton} onClick={() => openCalendar('return')}>
                  <span>{returnDate ? formatDateLabel(returnDate) : 'Дата возвращения'}</span>
                </button>
                {returnDate ? (
                  <button
                    type="button"
                    className={styles.dateActionClear}
                    aria-label="Очистить дату возвращения"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setReturnDate('');
                    }}
                  >
                    x
                  </button>
                ) : (
                  <span className={styles.dateActionIcon} aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M8 2v4M16 2v4M3 9h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  </span>
                )}
                {openCalendarField === 'return' ? renderCalendar('return') : null}
              </div>
            </div>

            <div className={styles.searchField} ref={passengerPanelRef}>
              <label className={styles.hiddenLabel}>Пассажиры</label>
              <button
                type="button"
                className={styles.passengerButton}
                onClick={() => setShowPassengerPanel((value) => !value)}
              >
                <span>{adults + kids + babies} {adults + kids + babies === 1 ? 'пассажир' : 'пассажира'}</span>
                <small>{cabinClass === 'Business' ? 'Бизнес' : 'Эконом'}</small>
              </button>

              {showPassengerPanel ? (
                <div className={styles.passengerPanel}>
                  <div className={styles.passengerRow}>
                    <span>Взрослые</span>
                    <div className={styles.passengerControl}>
                      <button type="button" onClick={() => updatePassengerValue('adults', adults - 1)}>-</button>
                      <input
                        type="number"
                        min={1}
                        value={adults}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === '') {
                            setAdults(1);
                            return;
                          }
                          updatePassengerValue('adults', Number(raw));
                        }}
                        aria-label="Взрослые"
                      />
                      <button type="button" onClick={() => updatePassengerValue('adults', adults + 1)}>+</button>
                    </div>
                  </div>
                  <div className={styles.passengerRow}>
                    <span>Дети</span>
                    <div className={styles.passengerControl}>
                      <button type="button" onClick={() => updatePassengerValue('kids', kids - 1)}>-</button>
                      <input
                        type="number"
                        min={0}
                        value={kids}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === '') {
                            setKids(0);
                            return;
                          }
                          updatePassengerValue('kids', Number(raw));
                        }}
                        aria-label="Дети"
                      />
                      <button type="button" onClick={() => updatePassengerValue('kids', kids + 1)}>+</button>
                    </div>
                  </div>
                  <div className={styles.passengerRow}>
                    <span>Младенцы</span>
                    <div className={styles.passengerControl}>
                      <button type="button" onClick={() => updatePassengerValue('babies', babies - 1)}>-</button>
                      <input
                        type="number"
                        min={0}
                        value={babies}
                        onChange={(event) => {
                          const raw = event.target.value;
                          if (raw === '') {
                            setBabies(0);
                            return;
                          }
                          updatePassengerValue('babies', Number(raw));
                        }}
                        aria-label="Младенцы"
                      />
                      <button type="button" onClick={() => updatePassengerValue('babies', babies + 1)}>+</button>
                    </div>
                  </div>
                  <div className={styles.passengerRow}>
                    <span>Класс</span>
                    <select value={cabinClass} onChange={(event) => setCabinClass(event.target.value)}>
                      <option value="Economy">Эконом</option>
                      <option value="Business">Бизнес</option>
                    </select>
                  </div>
                </div>
              ) : null}
            </div>

            <Button type="submit" className={styles.searchButton} disabled={loading}>
              {loading ? 'Поиск...' : 'Найти рейсы'}
            </Button>
          </form>

          {error ? <div className={styles.error}>{error}</div> : null}
        </section>

        <div className={styles.bodyGrid}>
          <aside className={styles.sidebar}>
            <div className={styles.section}>
              <h3>Фильтры</h3>
              <label>Максимальная общая цена</label>
              <input type="number" min={0} step="0.01" value={maxTotalPrice} onChange={(event) => setMaxTotalPrice(event.target.value)} />

              <div className={styles.inlineGrid}>
                <div className={styles.timeSlotWrap}>
                  <label>Время вылета</label>
                  <div className={styles.timeSlots}>
                    <button
                      type="button"
                      className={`${styles.timeSlotBtn} ${departureTimeSlot === 'any' ? styles.timeSlotBtnActive : ''}`}
                      onClick={() => setDepartureTimeSlot('any')}
                    >
                      Любое
                    </button>
                    <button
                      type="button"
                      className={`${styles.timeSlotBtn} ${departureTimeSlot === 'morning' ? styles.timeSlotBtnActive : ''}`}
                      onClick={() => setDepartureTimeSlot('morning')}
                    >
                      Утро
                    </button>
                    <button
                      type="button"
                      className={`${styles.timeSlotBtn} ${departureTimeSlot === 'evening' ? styles.timeSlotBtnActive : ''}`}
                      onClick={() => setDepartureTimeSlot('evening')}
                    >
                      Вечер
                    </button>
                    <button
                      type="button"
                      className={`${styles.timeSlotBtn} ${departureTimeSlot === 'night' ? styles.timeSlotBtnActive : ''}`}
                      onClick={() => setDepartureTimeSlot('night')}
                    >
                      Ночь
                    </button>
                  </div>
                </div>
              </div>
              <label>Сортировать по</label>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                {sortFields.map((field) => (
                  <option key={field.value} value={field.value}>
                    {field.label}
                  </option>
                ))}
              </select>

              <label>Направление</label>
              <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value)}>
                <option value="Ascending">По возрастанию</option>
                <option value="Descending">По убыванию</option>
              </select>

            </div>
          </aside>

          <main className={styles.results}>
            {results === null ? (
              <div className={styles.hint}>Выберите маршрут и фильтры, затем выполните поиск рейсов.</div>
            ) : results.length === 0 ? (
              <div className={styles.hint}>Рейсы не найдены</div>
             ) : (
                <ul className={styles.list}>
                 {results.map((result, index) => (
                   <li
                     key={index}
                     className={styles.card}
                     onClick={() => handleFlightClick(result)}
                     style={{ cursor: 'pointer' }}
                   >
                    <div className={styles.cardTop}>
                      <div>
                        <div className={styles.priceLabel}>Итого</div>
                        <div className={styles.priceValue}>{formatPrice(result.totalPrice ?? result.TotalPrice)}</div>
                      </div>
                      {getBadgeLabel(index, sortBy, sortDirection) && (
                        <div className={styles.badge}>
                          {getBadgeLabel(index, sortBy, sortDirection)}
                        </div>
                      )}
                    </div>

                     {renderSegmentCard(result.outbound || result.Outbound, 'Туда')}

                     {result.return || result.Return ? <div className={styles.tripDivider} /> : null}
                     {result.return || result.Return ? renderSegmentCard(result.return || result.Return, 'Обратно') : null}

                     <div className={styles.airlineName}>{result.outbound?.airlineName || result.Outbound?.AirlineName}</div>
                   </li>
                 ))}
               </ul>
             )}

             {showStaleDataWarning && (
               <div className={styles.staleDataWarning}>
                 <p>Данные о рейсах могли устареть. Обновите страницу, чтобы увидеть актуальные цены и наличие мест.</p>
                 <button
                   onClick={() => window.location.reload()}
                   className={styles.refreshButton}
                 >
                   Обновить страницу
                 </button>
               </div>
             )}

            {results && results.length > 0 && hasMore ? (
              <div className={styles.loadMoreWrap}>
                <Button type="button" variant="secondary" onClick={handleLoadMore} disabled={loadingMore || loading}>
                  {loadingMore ? 'Загрузка...' : 'Загрузить ещё рейсы'}
                </Button>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </AppShell>
  );
}