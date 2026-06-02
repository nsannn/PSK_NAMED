import React, { useState, useEffect, useRef } from 'react';
import { apiFetch } from '../utils/api';
import './NotificationDropdown.css';

export default function NotificationDropdown({ isMobile }) {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  async function fetchUnreadCount() {
    try {
      const data = await apiFetch('/api/notifications/unread-count');
      setUnreadCount(data.count);
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  }

  async function fetchNotifications() {
    setLoading(true);
    try {
      const data = await apiFetch('/api/notifications');
      setNotifications(data);
      // Also update count based on fetched list just in case
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(id) {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }

  async function handleMarkAllAsRead() {
    if (unreadCount === 0) return;
    try {
      await apiFetch('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  }

  return (
    <div className={`nd-container ${isMobile ? 'nd-container--mobile' : ''}`} ref={dropdownRef}>
      <button
        className={`${isMobile ? 'mobile-sidebar__link nd-mobile-btn' : 'btn btn--outline nd-toggle-btn'}`}
        onClick={() => setOpen(!open)}
        title="Notifications"
      >
        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="nd-badge nd-badge--mobile" style={{ position: 'absolute', right: 0 }}>{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </div>
        ) : (
          <>
            <span className="nd-icon">🔔</span>
            {unreadCount > 0 && (
              <span className="nd-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </>
        )}
      </button>

      {open && (
        <div className={`nd-dropdown ${isMobile ? 'nd-dropdown--mobile' : ''}`}>
          <div className="nd-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="nd-mark-all" onClick={handleMarkAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="nd-list">
            {loading && notifications.length === 0 ? (
              <div className="nd-empty">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="nd-empty">No notifications</div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`nd-item ${notif.isRead ? 'nd-item--read' : 'nd-item--unread'}`}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif.id)}
                >
                  <div className="nd-item-content">
                    <span className="nd-item-title">{notif.title}</span>
                    <span className="nd-item-message">{notif.message}</span>
                    <span className="nd-item-time">{formatTime(notif.createdAt)}</span>
                  </div>
                  {!notif.isRead && <div className="nd-unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
