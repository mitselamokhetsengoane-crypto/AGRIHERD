import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import AppIcon from './AppIcon';

const NotificationBell = ({ to = '/app/notifications' }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      setUnreadCount(await notificationService.unreadCount());
    } catch (error) {
      console.error('Could not load unread notification count.', error);
    }
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('notifications-updated', refresh);
    return () => window.removeEventListener('notifications-updated', refresh);
  }, [refresh]);

  return (
    <Link
      to={to}
      aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
      className="relative inline-flex items-center justify-center rounded-md p-2 text-subtext transition hover:bg-background hover:text-primary"
    >
      <AppIcon name="notification" />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-xs leading-5 text-white">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};

export default NotificationBell;
