import { useEffect, useState, useRef } from 'react';
import styles from './AirportAutosuggest.module.css';
import { apiClient } from '../../api/client';

export function AirportAutosuggest({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  const rootRef = useRef(null);
  const take = 8;

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await apiClient.get(`/airports/cities?q=${encodeURIComponent(query)}&take=${take}`);
        setSuggestions(res.data || []);
        setOpen(true);
      } catch (err) {
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer.current);
  }, [query]);

  useEffect(() => {
    function handleOutsidePointerDown(event) {
      if (!rootRef.current) {
        return;
      }

      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => document.removeEventListener('pointerdown', handleOutsidePointerDown);
  }, []);

  function handleSelect(item) {
    setQuery(item);
    onChange(item);
    setOpen(false);
  }

  function commitIfPossible() {
    const exact = suggestions.find((item) => item.toLowerCase() === query.trim().toLowerCase());
    if (exact) {
      handleSelect(exact);
      return;
    }

    if (suggestions.length === 1) {
      handleSelect(suggestions[0]);
      return;
    }

    if (suggestions.length > 1) {
      handleSelect(suggestions[0]);
    }
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <input
        className={styles.input}
        value={query}
        placeholder={placeholder}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => {
          if (query.length > 0) {
            setOpen(true);
          }
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commitIfPossible();
          }

          if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
      />

      {open && suggestions.length > 0 ? (
        <ul className={styles.list} role="listbox">
          {suggestions.map((s) => (
            <li key={s} role="option" onMouseDown={() => handleSelect(s)} className={styles.item}>
              {s}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}





