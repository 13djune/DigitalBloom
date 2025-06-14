import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <div className="bg-[var(--bg-color)] rounded-full p-1 flex gap-1 shadow-md w-fit border border-[var(--primary-color)]">
      <button
        onClick={() => setDark(false)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          !dark
            ? 'bg-[var(--primary-color)] text-[var(--text-inverse-color)]'
            : 'text-[var(--primary-color)]'
        }`}
      >
        <FontAwesomeIcon icon={faSun} />
      </button>

      <button
        onClick={() => setDark(true)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          dark
            ? 'bg-[var(--primary-color)] text-[var(--text-inverse-color)]'
            : 'text-[var(--primary-color)]'
        }`}
      >
        <FontAwesomeIcon icon={faMoon} />
      </button>
    </div>
  );
}
