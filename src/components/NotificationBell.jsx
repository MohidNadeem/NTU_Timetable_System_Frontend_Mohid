import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// Shared across every role that uses Layout (Lecturer, Timetabling Team, Admin)
// a small bell with an unread-count badge, opening a dropdown of recent notifications.
export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  const loadUnreadCount = () => {
    api.get('/notifications/unread-count').then((r) => setUnreadCount(r.count)).catch(() => {});
  };

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 60000); // light polling, not real-time push
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      api.get('/notifications').then(setNotifications).catch(() => {}).finally(() => setLoading(false));
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.isRead) {
      try {
        await api.put(`/notifications/${n.id}/read`, {});
        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch { /* non-critical */ }
    }
    setOpen(false);
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all', {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* non-critical */ }
  };

  return (
    <div className="notif-bell" ref={containerRef}>
      <button className="notif-bell__trigger" onClick={toggleOpen} aria-label="Notifications">
        🔔
        {unreadCount > 0 && <span className="notif-bell__badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-bell__dropdown">
          <div className="notif-bell__header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-bell__mark-all" onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          {loading && <p className="status" style={{ padding: 12 }}>Loading…</p>}

          {!loading && notifications.length === 0 && (
            <p className="card__body" style={{ padding: 12 }}>Nothing yet.</p>
          )}

          {!loading && notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-bell__item${n.isRead ? '' : ' notif-bell__item--unread'}`}
              onClick={() => handleNotificationClick(n)}
            >
              <p className="notif-bell__message">{n.message}</p>
              <span className="notif-bell__time">{timeAgo(n.createdAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
