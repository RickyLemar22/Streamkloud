import { useEffect, useState } from 'react';

export interface Notification {
  id: string;
  userId?: string;
  user_id?: number;
  title: string;
  message: string;
  type: 'system' | 'subscription' | 'playlist' | 'social';
  isRead?: boolean;
  is_read?: boolean;
  createdAt?: any;
  created_at?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) return null;

  try {
    return JSON.parse(userInfo).token;
  } catch {
    return null;
  }
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    const token = getToken();

    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await res.json();

      const filtered = data.filter((n: Notification) => {
        const isAI =
          n.type === ('ai' as any) ||
          n.title?.toLowerCase().includes('ai recommendation') ||
          n.message?.toLowerCase().includes('ai-powered');

        return !isAI;
      });

      setNotifications(filtered);
      setUnreadCount(filtered.filter((n: Notification) => !(n.isRead ?? n.is_read)).length);
    } catch (error) {
      console.error('Fetch notifications error:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (notificationId: string) => {
    const token = getToken();
    if (!token) return;

    await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await fetchNotifications();
  };

  const markAllAsRead = async () => {
    const token = getToken();
    if (!token) return;

    await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await fetchNotifications();
  };

  const deleteNotification = async (notificationId: string) => {
    const token = getToken();
    if (!token) return;

    await fetch(`${API_BASE_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await fetchNotifications();
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}