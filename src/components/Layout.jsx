import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Footer from './Footer';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [violationCount, setViolationCount] = useState(0);
  const [changesInQueueCount, setChangesInQueueCount] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // fetching a fresh count on every page load for the TT side, so the nav badge
  useEffect(() => {
    if (user?.role !== 'TIMETABLING_TEAM') return;
    api.get('/timetabling-team/violations')
      .then((v) => setViolationCount(v.length))
      .catch(() => {}); // nav badge is a nice-to-have - a failed fetch here shouldn't break the whole layout
    api.get('/timetabling-team/changes-in-queue')
      .then((c) => setChangesInQueueCount(c.length))
      .catch(() => {});
  }, [user]);

  const lecturerLinks = [
    { to: '/lecturer', label: 'Dashboard' },
    { to: '/lecturer/timetable', label: 'Timetable' },
    { to: '/lecturer/requests', label: 'Submit Constraint' },
    { to: '/lecturer/requests/history', label: 'My Requests' },
    { to: '/lecturer/requests/changes', label: 'Submit Change' },
    { to: '/lecturer/requests/changes/history', label: 'My Changes' },
  ];

  const teamLinks = [
    { to: '/timetabling-team', label: 'Dashboard' },
    { to: '/timetabling-team/timetable', label: 'Timetable' },
    { to: '/timetabling-team/requests', label: 'Constraints' },
    { to: '/timetabling-team/change-requests', label: 'Changes' },
    { to: '/timetabling-team/violations', label: violationCount > 0 ? `Violations (${violationCount})` : 'Violations' },
    { to: '/timetabling-team/changes-in-queue', label: changesInQueueCount > 0 ? `Changes in Queue (${changesInQueueCount})` : 'Changes in Queue' },
    { to: '/timetabling-team/session-management', label: 'Session Management' },
  ];

  const links = user?.role === 'LECTURER' ? lecturerLinks : teamLinks;

  // routes with sub-pages (e.g. /requests/:id) need exact matching so the parent link
  // doesn't stay highlighted while on a child page
  const exactMatchRoutes = new Set([
    '/lecturer', '/timetabling-team',
    '/lecturer/requests', '/lecturer/requests/changes',
    '/timetabling-team/requests', '/timetabling-team/change-requests',
  ]);

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
                end={exactMatchRoutes.has(link.to)}
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

      <Footer />
    </div>
  );
}
