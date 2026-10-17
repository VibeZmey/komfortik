import {
  Children,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import styles from './Select.module.css';

export function Select({
  children,
  value,
  onChange,
  className = '',
  disabled = false,
  id,
  name,
  ...props
}) {
  const generatedId = useId();
  const listId = `${id || generatedId}-options`;
  const options = Children.toArray(children).map((option) => ({
    value: String(option.props.value),
    label: option.props.children,
    disabled: Boolean(option.props.disabled),
  }));
  const selected = options.findIndex(
    (option) => option.value === String(value),
  );
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const searchRef = useRef({ text: '', time: 0 });

  function choose(index) {
    if (!options[index] || options[index].disabled) return;
    onChange?.({
      target: { value: options[index].value, name },
      currentTarget: { value: options[index].value, name },
    });
    setOpen(false);
    triggerRef.current.focus();
  }

  useLayoutEffect(() => {
    if (!open) return;
    function reposition() {
      const rect = triggerRef.current.getBoundingClientRect();
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      const desired = Math.min(280, options.length * 44 + 12);
      const upwards = below < desired && above > below;
      const maxHeight = Math.max(44, Math.min(280, upwards ? above : below));
      const width = Math.min(Math.max(rect.width, 180), window.innerWidth - 32);
      setPosition({
        width,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - width - 16)),
        maxHeight,
        ...(upwards
          ? { bottom: window.innerHeight - rect.top + 8 }
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
  }, [open, options.length]);

  useEffect(() => {
    if (!open) return;
    function dismiss(event) {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      )
        setOpen(false);
    }
    document.addEventListener('pointerdown', dismiss);
    return () => document.removeEventListener('pointerdown', dismiss);
  }, [open]);

  useEffect(() => {
    if (open)
      menuRef.current
        ?.querySelector(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: 'nearest' });
  }, [open, active, position?.maxHeight]);

  return (
    <div className={`${styles.root} ${className}`} data-select-root>
      {name && (
        <input
          type="hidden"
          name={name}
          value={value ?? ''}
          disabled={disabled}
        />
      )}
      <button
        {...props}
        id={id}
        type="button"
        ref={triggerRef}
        className={styles.trigger}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={
          open && options[active] ? `${listId}-${active}` : undefined
        }
        disabled={disabled}
        onBlur={(event) => {
          if (!menuRef.current?.contains(event.relatedTarget)) setOpen(false);
        }}
        onClick={() => {
          setActive(
            selected >= 0
              ? selected
              : options.findIndex((option) => !option.disabled),
          );
          setOpen(!open);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            if (open) {
              event.preventDefault();
              event.stopPropagation();
              setOpen(false);
            }
            return;
          }
          if (event.key === 'Tab') {
            setOpen(false);
            return;
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (open) choose(active);
            else {
              setActive(
                selected >= 0
                  ? selected
                  : options.findIndex((option) => !option.disabled),
              );
              setOpen(true);
            }
            return;
          }
          if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
            event.preventDefault();
            const available = options
              .map((option, index) => (option.disabled ? -1 : index))
              .filter((index) => index >= 0);
            if (!available.length) return;
            if (!open) {
              setActive(selected >= 0 ? selected : available[0]);
              setOpen(true);
              return;
            }
            const cursor = available.indexOf(active);
            setActive(
              event.key === 'Home'
                ? available[0]
                : event.key === 'End'
                  ? available.at(-1)
                  : available[
                      (cursor +
                        (event.key === 'ArrowDown' ? 1 : -1) +
                        available.length) %
                        available.length
                    ],
            );
            return;
          }
          if (
            event.key.length === 1 &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            event.preventDefault();
            const now = Date.now();
            const text =
              (now - searchRef.current.time < 700
                ? searchRef.current.text
                : '') + event.key.toLocaleLowerCase('ru');
            searchRef.current = { text, time: now };
            const index = options.findIndex(
              (option) =>
                !option.disabled &&
                String(option.label).toLocaleLowerCase('ru').startsWith(text),
            );
            if (index >= 0) {
              if (open) setActive(index);
              else choose(index);
            }
          }
        }}
      >
        <span className={styles.value}>
          {options[selected]?.label || 'Выберите значение'}
        </span>
        <svg viewBox="0 0 20 20" aria-hidden="true" className={styles.chevron}>
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>
      {open &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            onPointerDown={(event) => event.stopPropagation()}
            id={listId}
            role="listbox"
            aria-label={props['aria-label']}
            className={styles.menu}
            style={position}
          >
            {options.map((option, index) => (
              <div
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={selected === index}
                aria-disabled={option.disabled || undefined}
                data-index={index}
                className={`${styles.option} ${index === active ? styles.active : ''} ${selected === index ? styles.selected : ''}`}
                onPointerMove={() => {
                  if (!option.disabled) setActive(index);
                }}
                onPointerDown={(event) => event.preventDefault()}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  choose(index);
                }}
              >
                <span>{option.label}</span>
                {selected === index && (
                  <span className={styles.check} aria-hidden="true">
                    ✓
                  </span>
                )}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
