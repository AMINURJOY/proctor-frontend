import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { notificationsApi } from '../services/api';
import { AppNotification } from '../types';

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await notificationsApi.getAll();
        setNotifications(response.data.data || response.data || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const filtered = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications;

  const handleMarkAsRead = async (id: string) => {
    await notificationsApi.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllAsRead = async () => {
    await notificationsApi.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    if (notification.caseId) {
      navigate(`/cases/${notification.caseId}`);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl mb-2" style={{ color: '#0b2652' }}>Notifications</h1>
          <p className="text-gray-600">All your notifications in one place</p>
        </div>
        <button onClick={handleMarkAllAsRead}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
          Mark All as Read
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm rounded-lg ${filter === 'all' ? 'text-white' : 'bg-gray-100 text-gray-700'}`}
          style={filter === 'all' ? { backgroundColor: '#0b2652' } : {}}>
          All
        </button>
        <button onClick={() => setFilter('unread')}
          className={`px-4 py-2 text-sm rounded-lg ${filter === 'unread' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
          Unread ({notifications.filter(n => !n.isRead).length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 border border-gray-100 text-center">
          <p className="text-gray-500 text-lg">No notifications</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 divide-y divide-gray-100">
          {filtered.map(n => (
            <div key={n.id}
              onClick={() => handleClick(n)}
              className={`flex items-start gap-4 p-4 cursor-pointer hover:bg-blue-50 transition-colors ${!n.isRead ? 'bg-blue-50/50' : ''}`}>
              <div className={`w-2.5 h-2.5 rounded-full mt-2 flex-shrink-0 ${!n.isRead ? 'bg-blue-500' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.isRead ? 'font-semibold' : 'font-medium'} text-gray-900`}>{n.title}</p>
                <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
              </div>
              <p className="text-xs text-gray-400 flex-shrink-0">{timeAgo(n.createdAt)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
