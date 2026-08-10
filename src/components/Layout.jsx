import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const lecturerLinks = [
    { to: '/lecturer', label: 'Dashboard' },
    { to: '/lecturer/timetable', label: 'Timetable' },
    { to: '/lecturer/requests', label: 'Constraint Requests' },
  ];

  const teamLinks = [
    { to: '/timetabling-team', label: 'Dashboard' },
    { to: '/timetabling-team/timetable', label: 'Timetable' },
    { to: '/timetabling-team/requests', label: 'Constraint Requests' },
  ];

  const links = user?.role === 'LECTURER' ? lecturerLinks : teamLinks;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__crest">NTU</span>
          <span className="app-header__title">Timetabling Requests Management</span>
        </div>

        {user && (
          <nav className="app-header__nav">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/lecturer' || link.to === '/timetabling-team'}
                className={({ isActive }) => `app-header__link${isActive ? ' is-active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        )}

        {user && (
          <div className="app-header__user">
            <span className="app-header__user-name">{user.fullName}</span>
            <span className="app-header__user-role">{user.role.replace('_', ' ')}</span>
            <button className="btn btn--ghost" onClick={handleLogout}>Log out</button>
          </div>
        )}
      </header>

      <main className="app-main">{children}</main>
    </div>
  );
}
