import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';

// A "More ▾" dropdown for nav links that don't need to be visible at all times
// keeps the primary nav row from wrapping awkwardly
export default function MoreNavMenu({ items }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="more-nav" ref={containerRef}>
      <button type="button" className="app-header__link more-nav__trigger" onClick={() => setOpen((o) => !o)}>
        More ▾
      </button>

      {open && (
        <div className="more-nav__dropdown">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `more-nav__item${isActive ? ' is-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
}
