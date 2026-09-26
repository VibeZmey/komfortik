import styles from './Button.module.css';

export function Button({
  children,
  variant = 'primary',
  type = 'button',
  className = '',
  disabled = false,
  fullWidth = false,
  ...props
}) {
  const classes = [
    styles.button,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

