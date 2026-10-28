import { useEffect } from 'react';

// A panel that slides up from the bottom, leaving the button visible above it.
export default function Sheet({ title, onClose, className = '', children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <section className={`sheet ${className}`} aria-label={title}>
      <header className="sheet-head">
        <h2>{title}</h2>
        <button className="sheet-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      {children}
    </section>
  );
}
