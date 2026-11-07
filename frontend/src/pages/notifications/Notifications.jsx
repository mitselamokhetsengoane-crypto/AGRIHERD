import { useState, useEffect } from 'react';
import api from '../../services/api';
import { formatDate } from '../../utils/formatters';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        setNotifications(response.data);
      } catch (error) {
        console.error("Failed to load notifications", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (error) {
      console.error("Failed to mark as read", error);
    }
  };

  if (loading) return <div className="p-8 text-center text-subtext">Loading notifications...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-maintext">Notifications</h1>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-xl shadow-sm border border-gray-100">
          <p className="text-subtext">You have no new notifications.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {notifications.map((notif) => (
            <div key={notif.id} className={`p-4 flex justify-between items-start ${!notif.is_read ? 'bg-green-50/50' : ''}`}>
              <div>
                <h3 className={`font-semibold ${!notif.is_read ? 'text-maintext' : 'text-subtext'}`}>
                  {notif.title}
                </h3>
                <p className="text-sm text-subtext mt-1">{notif.message}</p>
                <span className="text-xs text-gray-400 mt-2 block">{formatDate(notif.created_at)}</span>
              </div>
              {!notif.is_read && (
                <button 
                  onClick={() => markAsRead(notif.id)}
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