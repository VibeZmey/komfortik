import styles from './Input.module.css';

export function Input({
  label,
  error,
  hint,
  className = '',
  id,
  ...props
}) {
  const inputId = id || props.name;
  const classes = [styles.input, error ? styles.invalid : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <label className={styles.field} htmlFor={inputId}>
      <span className={styles.label}>{label}</span>
      <input id={inputId} className={classes} {...props} />
      <span className={styles.hint} aria-live="polite">
        {error || hint || ''}
      </span>
    </label>
  );
}

