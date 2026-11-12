import { useEffect, useState } from 'react';
import notificationService from '../../services/notificationService';
import { formatDate } from '../../utils/formatters';

const Notifications = () => {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [list, count] = await Promise.all([
        notificationService.list(onlyUnread),
        notificationService.unreadCount(),
      ]);
      setItems(list);
      setUnread(count);
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onlyUnread]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not mark as read.');
    }
  };

  const handleMarkAll = async () => {
    try {
      await notificationService.markAllRead();
      await load();
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not mark all as read.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Notifications</h1>
        <div className="flex items-center gap-3">
          <label className="text-sm text-subtext flex items-center gap-2">
            <input
              type="checkbox"
              checked={onlyUnread}
              onChange={(e) => setOnlyUnread(e.target.checked)}
            />
            Unread only
          </label>
          <button
            onClick={handleMarkAll}
            className="text-sm text-primary hover:underline"
            disabled={unread === 0}
          >
            Mark all read ({unread})
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-error text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-subtext">Loading notifications...</div>
      ) : items.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">No notifications yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {items.map((n) => (
            <div
              key={n.id}
              className={`p-4 flex justify-between items-start ${n.is_read ? '' : 'bg-green-50/50'}`}
            >
              <div>
                <h3 className={`font-semibold ${n.is_read ? 'text-maintext' : 'text-subtext'}`}>
                  {n.title}
                </h3>
                <p className="text-sm text-subtext mt-1">{n.message}</p>
                <span className="text-xs text-gray-400 mt-2 block">
                  {formatDate(n.created_at)}
                </span>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="text-xs text-primary hover:underline"
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;