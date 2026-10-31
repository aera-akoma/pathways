import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Settings,
  X,
  Briefcase,
  Award,
  FileText,
  Calendar,
  Layers,
  ChevronRight,
  Filter
} from 'lucide-react';

export const getNotificationSettings = () => {
  try {
    const saved = localStorage.getItem('podar-notifications-settings');
    if (!saved) {
      return {
        enabled: true,
        jobAlerts: true,
        interviewReminders: true,
        weeklyDigest: true,
        collegeNotices: true,
        quizDeadlines: true,
        soundEffects: true
      };
    }
    const parsed = JSON.parse(saved);
    if (parsed.enabled === undefined) parsed.enabled = true;
    return parsed;
  } catch {
    return {
      enabled: true,
      jobAlerts: true,
      interviewReminders: true,
      weeklyDigest: true,
      collegeNotices: true,
      quizDeadlines: true,
      soundEffects: true
    };
  }
};

export const saveNotificationSettings = (settings) => {
  try {
    localStorage.setItem('podar-notifications-settings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('podar-notifications-changed', { detail: settings }));
  } catch (err) {
    console.warn('Failed to save notification settings:', err);
  }
};

function formatTimeAgo(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (isNaN(diffSec) || diffSec < 0) return 'Just now';
  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function NotificationBell({ session, student, navigate, notify }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [settings, setSettings] = useState(getNotificationSettings);
  const wrapRef = useRef(null);

  // Sync settings when changed from ProfileSettings or elsewhere
  useEffect(() => {
    const handleSettingsChange = (e) => {
      if (e.detail) {
        setSettings(e.detail);
      } else {
        setSettings(getNotificationSettings());
      }
    };
    window.addEventListener('podar-notifications-changed', handleSettingsChange);
    return () => window.removeEventListener('podar-notifications-changed', handleSettingsChange);
  }, []);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let url = '/api/notifications';
      if (session?.role === 'admin') {
        url += '?role=admin';
      } else if (student?.id || session?.id) {
        url += `?studentId=${student?.id || session?.id}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.warn('Notifications fetch note:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [session?.role, student?.id, session?.id]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleMaster = () => {
    const updated = { ...settings, enabled: !settings.enabled };
    setSettings(updated);
    saveNotificationSettings(updated);
    if (notify) {
      notify(updated.enabled ? 'Notifications enabled' : 'Notifications paused');
    }
  };

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: 1 } : n))
    );
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    } catch (err) {
      console.warn('Mark read error:', err);
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: 1 })));
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student?.id || session?.id,
          role: session?.role
        })
      });
      if (notify) notify('All marked as read');
    } catch (err) {
      console.warn('Mark all read error:', err);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Delete notification error:', err);
    }
  };

  const handleClearRead = async () => {
    setNotifications((prev) => prev.filter((n) => !n.read));
    try {
      const targetParam = session?.role === 'admin' ? '' : `?studentId=${student?.id || session?.id}`;
      await fetch(`/api/notifications/clear/read${targetParam}`, { method: 'DELETE' });
      if (notify) notify('Cleared read notifications');
    } catch (err) {
      console.warn('Clear read error:', err);
    }
  };

  const handleItemClick = (n) => {
    if (!n.read) {
      handleMarkAsRead(n.id);
    }
    setIsOpen(false);
    if (!navigate) return;

    if (n.type === 'program' || n.programId) {
      navigate('opportunities');
    } else if (n.type === 'verification') {
      navigate('certificates');
    } else if (n.type === 'test') {
      navigate('score');
    } else if (n.type === 'schedule') {
      navigate('roadmap');
    } else {
      navigate('dashboard');
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filteredNotifications = filter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications;

  const renderIcon = (type) => {
    switch (type) {
      case 'verification':
        return <Award size={15} />;
      case 'program':
        return <Briefcase size={15} />;
      case 'test':
        return <FileText size={15} />;
      case 'schedule':
        return <Calendar size={15} />;
      default:
        return <Bell size={15} />;
    }
  };

  const getCategoryLabel = (type) => {
    switch (type) {
      case 'verification':
        return 'Credential';
      case 'program':
        return 'Opportunity';
      case 'test':
        return 'Assessment';
      case 'schedule':
        return 'Schedule';
      default:
        return 'Notice';
    }
  };

  return (
    <div className="notif-bell-wrap" ref={wrapRef}>
      {/* Topbar Bell Button */}
      <button
        type="button"
        className={`notif-trigger-btn ${isOpen ? 'active' : ''} ${!settings.enabled ? 'is-muted' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        title={settings.enabled ? (unreadCount > 0 ? `${unreadCount} unread notifications` : 'Notifications') : 'Notifications paused'}
      >
        {settings.enabled ? (
          <Bell size={18} strokeWidth={2.1} />
        ) : (
          <BellOff size={18} strokeWidth={2.1} />
        )}

        {/* Crisp notification dot / counter */}
        {settings.enabled && unreadCount > 0 && (
          <span className="notif-indicator-dot">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}

        {!settings.enabled && (
          <span className="notif-indicator-muted" />
        )}
      </button>

      {/* Modern Popover Panel */}
      {isOpen && (
        <div className="notif-dropdown-card">
          {/* Header */}
          <div className="notif-card-header">
            <div className="notif-card-title-group">
              <span className="notif-card-title">Notifications</span>
              {settings.enabled && unreadCount > 0 && (
                <span className="notif-count-tag">{unreadCount}</span>
              )}
            </div>

            <div className="notif-card-header-actions">
              {settings.enabled && unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-micro-btn"
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                >
                  <CheckCheck size={15} />
                  <span>Mark all read</span>
                </button>
              )}

              <button
                type="button"
                className="notif-micro-btn icon-only"
                onClick={() => {
                  setIsOpen(false);
                  if (navigate) navigate('profile');
                }}
                title="Notification preferences"
              >
                <Settings size={15} />
              </button>

              <button
                type="button"
                className="notif-micro-btn icon-only mobile-close"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Master Pause Notice if notifications are toggled off */}
          {!settings.enabled && (
            <div className="notif-paused-notice">
              <div className="notif-paused-copy">
                <BellOff size={14} />
                <span>Notifications are currently paused</span>
              </div>
              <button
                type="button"
                className="notif-resume-link"
                onClick={toggleMaster}
              >
                Resume
              </button>
            </div>
          )}

          {/* Segmented Filter Pills */}
          <div className="notif-filter-bar">
            <div className="notif-segmented-control">
              <button
                type="button"
                className={`notif-segment-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
                <span className="notif-seg-count">{notifications.length}</span>
              </button>
              <button
                type="button"
                className={`notif-segment-btn ${filter === 'unread' ? 'active' : ''}`}
                onClick={() => setFilter('unread')}
              >
                Unread
                {unreadCount > 0 && (
                  <span className="notif-seg-count unread">{unreadCount}</span>
                )}
              </button>
            </div>

            {notifications.some((n) => n.read) && (
              <button
                type="button"
                className="notif-clear-read-btn"
                onClick={handleClearRead}
              >
                Clear read
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div className="notif-feed-list">
            {loading && notifications.length === 0 ? (
              <div className="notif-loading-state">
                <span className="notif-spinner" />
                <span>Loading updates…</span>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="notif-empty-state">
                <div className="notif-empty-icon-wrap">
                  <Bell size={20} strokeWidth={1.8} />
                </div>
                <p className="notif-empty-headline">
                  {filter === 'unread' ? 'No unread notifications' : 'All caught up'}
                </p>
                <p className="notif-empty-subline">
                  {filter === 'unread'
                    ? "You've reviewed all incoming alerts."
                    : 'We will notify you when job matching, test results, or reminders arrive.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-feed-row ${!n.read ? 'is-unread' : 'is-read'}`}
                  onClick={() => handleItemClick(n)}
                >
                  <div className={`notif-icon-badge ${n.type || 'default'}`}>
                    {renderIcon(n.type)}
                  </div>

                  <div className="notif-feed-body">
                    <div className="notif-feed-header-line">
                      <span className="notif-category-meta">{getCategoryLabel(n.type)}</span>
                      <span className="notif-timestamp">{formatTimeAgo(n.createdAt)}</span>
                    </div>

                    <h4 className="notif-title-text">{n.title}</h4>
                    <p className="notif-summary-text">{n.message}</p>
                  </div>

                  <div className="notif-hover-actions">
                    {!n.read && (
                      <button
                        type="button"
                        className="notif-row-action-btn"
                        onClick={(e) => handleMarkAsRead(n.id, e)}
                        title="Mark as read"
                        aria-label="Mark as read"
                      >
                        <Check size={13} strokeWidth={2.5} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="notif-row-action-btn delete"
                      onClick={(e) => handleDelete(n.id, e)}
                      title="Dismiss notification"
                      aria-label="Dismiss notification"
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>

                  {!n.read && <span className="notif-unread-ping" />}
                </div>
              ))
            )}
          </div>

          {/* Subdued Footer */}
          <div className="notif-card-footer">
            <span className="notif-footer-caption">
              {settings.enabled ? 'Live alerts active' : 'Alerts are paused'}
            </span>

            <button
              type="button"
              className="notif-footer-action-link"
              onClick={toggleMaster}
            >
              {settings.enabled ? 'Pause notifications' : 'Enable notifications'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
