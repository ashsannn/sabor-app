'use client';

export default function Button({
  children,
  onClick,
  disabled = false,
  variant = 'primary', // 'primary' (orange), 'primary-green', 'secondary', 'danger-soft'
  fullWidth = false,
  className = '',
  ...props
}) {
  const baseStyle = {
    fontFamily: 'Karla, sans-serif',
    borderRadius: '4px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    padding: '12px 16px',
    transition: 'all 0.2s',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
  };

  const variants = {
    primary: {
      backgroundColor: '#E07A3F',
      color: 'white',
    },
    'primary-green': {
      backgroundColor: '#55814E',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#F9FAFB',
      color: '#666',
      border: '1px solid #DADADA',
    },
    'danger-soft': {
      backgroundColor: '#DC262615',
      color: '#DC2626',
    },
  };

  const variantStyle = variants[variant] || variants.primary;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`transition-all hover:opacity-90 active:scale-95 ${className}`}
      style={{
        ...baseStyle,
        ...variantStyle,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
