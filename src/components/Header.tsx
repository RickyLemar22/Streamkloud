import { FormEvent, useEffect, useState } from 'react';
import { Bell, LogOut, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Input } from './ui/input';
import { AuthModal } from './AuthModal';
import { ProfileModal } from './ProfileModal';
import { Logo } from './Logo';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthModal } from '@/store/useAuthModal';
import { useProfileModal } from '@/store/useProfileModal';
import { formatDistanceToNow } from 'date-fns';

type StoredUser = {
  id?: string | number;
  name?: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  userType?: string;
};

type Notification = {
  id: string | number;
  title: string;
  message: string;
  isRead?: boolean;
  createdAt?: string | Date;
};

const getStoredUser = (): StoredUser | null => {
  try {
    const admin = localStorage.getItem('admin');
    const user = localStorage.getItem('user');
    return admin ? JSON.parse(admin) : user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const { open: openAuth } = useAuthModal();
  const { open: openProfile } = useProfileModal();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const isAuthenticated = Boolean(user && token);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  useEffect(() => {
    if (location.pathname !== '/search') {
      setSearchQuery('');
      return;
    }

    const params = new URLSearchParams(location.search);
    setSearchQuery(params.get('q') || '');
  }, [location.pathname, location.search]);

  const handleTopSearchChange = (value: string) => {
    setSearchQuery(value);

    const trimmedValue = value.trim();

    if (trimmedValue) {
      navigate(`/search?q=${encodeURIComponent(trimmedValue)}`);
    } else if (location.pathname === '/search') {
      navigate('/search');
    }
  };

  const handleTopSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedValue = searchQuery.trim();

    if (trimmedValue) {
      navigate(`/search?q=${encodeURIComponent(trimmedValue)}`);
    } else {
      navigate('/search');
    }
  };

  useEffect(() => {
    const syncAuth = () => setUser(getStoredUser());

    window.addEventListener('auth-change', syncAuth);
    window.addEventListener('storage', syncAuth);

    return () => {
      window.removeEventListener('auth-change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!user || !token) {
      setNotifications([]);
      setShowNotifications(false);
      return;
    }

    fetch('/api/notifications', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.notifications || [];
        setNotifications(list);
      })
      .catch(() => setNotifications([]));
  }, [user]);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    window.dispatchEvent(new Event('auth-change'));
    window.dispatchEvent(new Event('authUpdated'));
    setUser(null);
    navigate('/');
  };

  const markAsRead = async (id: string | number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );

    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch(`/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => null);
  };

  const markAllAsRead = async () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true }))
    );

    const token = localStorage.getItem('token');
    if (!token) return;

    await fetch('/api/notifications/read-all', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).catch(() => null);
  };

  const displayName = user?.displayName || user?.name || user?.email || 'User';

  return (
    <header className="h-16 lg:h-20 bg-zinc-950/50 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none flex items-center justify-between px-2 sm:px-3 lg:px-8 sticky top-0 z-40 shrink-0 border-b border-zinc-900/50 lg:border-none">
      <form
        onSubmit={handleTopSearchSubmit}
        className="hidden lg:flex flex-1 max-w-2xl relative group"
      >
        <Input
          value={searchQuery}
          onChange={(event) => handleTopSearchChange(event.target.value)}
          placeholder="Search songs, artists..."
          className="bg-zinc-900/50 border-zinc-800/50 h-12 pl-6 pr-12 rounded-full text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-orange-500/50 transition-all duration-300 group-hover:bg-zinc-900"
        />

        <button
          type="submit"
          className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 group-hover:text-zinc-300 transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
      </form>

      <Link to="/" className="lg:hidden group shrink-0">
        <Logo className="scale-[0.78] sm:scale-90 origin-left" />
      </Link>

      <div className="flex items-center gap-x-1.5 sm:gap-x-3 lg:gap-x-6 shrink-0">
        {isAuthenticated && (
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-zinc-400 hover:text-white transition-colors p-1.5 lg:p-2"
            >
              <Bell className="w-5 h-5 lg:w-6 lg:h-6" />

              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 lg:top-1.5 lg:right-1.5 w-4 h-4 bg-orange-500 text-[10px] font-bold text-black flex items-center justify-center rounded-full border border-zinc-950">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />

                <div className="absolute right-0 mt-2 w-72 sm:w-80 lg:w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h3 className="font-bold text-white">Notifications</h3>

                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-orange-500 hover:text-orange-400 font-medium"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`p-4 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer relative ${
                            !notification.isRead ? 'bg-orange-500/5' : ''
                          }`}
                        >
                          {!notification.isRead && (
                            <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 bg-orange-500 rounded-full" />
                          )}

                          <div className="flex flex-col gap-y-1">
                            <p
                              className={`text-sm ${
                                notification.isRead ? 'text-zinc-300' : 'text-white font-medium'
                              }`}
                            >
                              {notification.title}
                            </p>

                            <p className="text-xs text-zinc-500 line-clamp-2">
                              {notification.message}
                            </p>

                            <p className="text-[10px] text-zinc-600 mt-1">
                              {notification.createdAt
                                ? formatDistanceToNow(new Date(notification.createdAt), {
                                    addSuffix: true,
                                  })
                                : 'Just now'}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
                        <p className="text-zinc-500 text-sm">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {user ? (
          <div className="flex items-center gap-x-1.5 sm:gap-x-2 lg:gap-x-4">
            <Avatar
              className="w-8 h-8 sm:w-9 sm:h-9 lg:w-11 lg:h-11 border-2 border-orange-500/20 cursor-pointer hover:border-orange-500/50 transition-colors"
              onClick={openProfile}
            >
              <AvatarImage src={user.photoURL || ''} />

              <AvatarFallback className="bg-orange-500 text-black font-bold text-[10px] sm:text-xs lg:text-base">
                {displayName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2) || 'U'}
              </AvatarFallback>
            </Avatar>

            <Button
              variant="outline"
              onClick={logout}
              className="h-8 sm:h-9 lg:h-11 border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800 rounded-lg lg:rounded-xl gap-x-1 lg:gap-x-2 px-2 sm:px-3 lg:px-5 text-[11px] sm:text-xs lg:text-sm font-medium transition-all active:scale-95"
            >
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
              <span>Logout</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-x-1.5 sm:gap-x-2 lg:gap-x-4">
            <Button
              variant="ghost"
              onClick={() => openAuth('signup')}
              className="text-zinc-100 hover:text-white hover:bg-zinc-900/50 rounded-full px-2 sm:px-3 lg:px-6 h-8 sm:h-9 lg:h-12 text-xs sm:text-sm lg:text-base font-bold transition-all active:scale-95"
            >
              Sign up
            </Button>

            <Button
              onClick={() => openAuth('login')}
              className="bg-warm-gradient text-zinc-950 font-black rounded-full px-3 sm:px-4 lg:px-10 h-8 sm:h-9 lg:h-12 text-xs sm:text-sm lg:text-base shadow-lg lg:shadow-xl shadow-orange-500/30 ring-2 ring-orange-500/20 hover:ring-orange-500/50 transition-all active:scale-95"
            >
              Log in
            </Button>
          </div>
        )}
      </div>

      <AuthModal />
      <ProfileModal />
    </header>
  );
}

export default Header;