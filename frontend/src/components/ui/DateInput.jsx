import { useEffect, useLayoutEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Select } from './Select';
import styles from './DateInput.module.css';

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const months = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];
export function DateInput({
  value = '',
  onChange,
  min,
  max,
  label,
  required,
  disabled,
  ...props
}) {
  const [open, setOpen] = useState(false),
    [view, setView] = useState(new Date()),
    [position, setPosition] = useState(null);
  const root = useRef(null),
    input = useRef(null),
    menu = useRef(null),
    menuId = useId();
  const yearMin = min ? Number(min.slice(0, 4)) : 1900,
    yearMax = max ? Number(max.slice(0, 4)) : new Date().getFullYear() + 30;
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const start = 1 - ((first.getDay() + 6) % 7);
  const days = Array.from(
    { length: 42 },
    (_, i) => new Date(view.getFullYear(), view.getMonth(), start + i),
  );
  const display = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value.split('-').reverse().join('.')
    : value;
  useEffect(() => {
    const parsed = new Date(`${value}T12:00:00`);
    const valid =
      !value ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(parsed.getTime()) &&
        dateKey(parsed) === value);
    input.current.setCustomValidity(
      !valid
        ? 'Введите существующую дату в формате ДД.ММ.ГГГГ.'
        : value && min && value < min
          ? 'Выберите дату не раньше указанного срока.'
          : value && max && value > max
            ? 'Дата рождения не может быть в будущем.'
            : '',
    );
  }, [value, min, max]);
  useLayoutEffect(() => {
    if (!open) return;
    function reposition() {
      const rect = root.current.getBoundingClientRect();
      const width = Math.min(360, innerWidth - 32),
        below = innerHeight - rect.bottom - 16,
        above = rect.top - 16,
        up = below < 420 && above > below;
      setPosition({
        width,
        left: Math.max(16, Math.min(rect.left, innerWidth - width - 16)),
        maxHeight: Math.max(100, up ? above : below),
        ...(up
          ? { bottom: innerHeight - rect.top + 8 }
          : { top: rect.bottom + 8 }),
      });
    }
    reposition();
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
    return () => {
      window.removeEventListener('resize', reposition);
      window.removeEventListener('scroll', reposition, true);
    };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    function dismiss(e) {
      if (
        !root.current?.contains(e.target) &&
        !menu.current?.contains(e.target)
      )
        setOpen(false);
    }
    function escape(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        input.current.focus();
      }
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  function toggle() {
    if (!open) {
      const initial = /^\d{4}-\d{2}-\d{2}$/.test(value)
        ? value
        : max || min || dateKey(new Date());
      const parsed = new Date(`${initial}T12:00:00`);
      setView(
        Number.isNaN(parsed.getTime())
          ? new Date(`${max || min || dateKey(new Date())}T12:00:00`)
          : parsed,
      );
    }
    setOpen(!open);
  }
  return (
    <div className={styles.root} ref={root}>
      <input
        {...props}
        ref={input}
        type="text"
        value={display || ''}
        aria-label={label}
        placeholder="ДД.ММ.ГГГГ"
        inputMode="numeric"
        autoComplete="off"
        required={required}
        disabled={disabled}
        onChange={(e) => {
          const raw = e.target.value,
            match = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})$/),
            iso = match ? `${match[3]}-${match[2]}-${match[1]}` : raw,
            parsed = new Date(`${iso}T12:00:00`);
          onChange({
            target: {
              value:
                /^\d{4}-\d{2}-\d{2}$/.test(iso) &&
                !Number.isNaN(parsed.getTime()) &&
                dateKey(parsed) === iso
                  ? iso
                  : raw,
            },
          });
        }}
        onBlur={() => input.current.reportValidity()}
        onKeyDown={(e) => {
          if (e.altKey && e.key === 'ArrowDown') {
            e.preventDefault();
            toggle();
          }
        }}
      />
      <button
        type="button"
        className={styles.calendarButton}
        aria-label={`Календарь: ${label}`}
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        disabled={disabled}
        onClick={toggle}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
        >
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M7 3v4m10-4v4M3 10h18" />
        </svg>
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={menu}
            id={menuId}
            role="dialog"
            aria-label={`Календарь: ${label}`}
            className={styles.menu}
            style={position}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className={styles.heading}>
              <strong>{label}</strong>
              <button
                type="button"
                aria-label="Закрыть календарь"
                onClick={() => {
                  setOpen(false);
                  input.current.focus();
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.controls}>
              <Select
                aria-label="Месяц"
                value={view.getMonth()}
                onChange={(e) =>
                  setView(
                    new Date(view.getFullYear(), Number(e.target.value), 1),
                  )
                }
              >
                {months.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Год"
                value={view.getFullYear()}
                onChange={(e) =>
                  setView(new Date(Number(e.target.value), view.getMonth(), 1))
                }
              >
                {Array.from(
                  { length: Math.max(1, yearMax - yearMin + 1) },
                  (_, i) => yearMax - i,
                ).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </Select>
            </div>
            <div className={styles.weekdays}>
              {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className={styles.days}>
              {days.map((day) => {
                const key = dateKey(day);
                return (
                  <button
                    type="button"
                    key={key}
                    aria-label={day.toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    aria-pressed={key === value}
                    disabled={Boolean((min && key < min) || (max && key > max))}
                    className={`${styles.day} ${day.getMonth() !== view.getMonth() ? styles.muted : ''} ${key === value ? styles.selected : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onChange({ target: { value: key } });
                      setOpen(false);
                      input.current.focus();
                    }}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className={styles.clear}
              onClick={() => {
                onChange({ target: { value: '' } });
                setOpen(false);
                input.current.focus();
              }}
            >
              Очистить дату
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}
