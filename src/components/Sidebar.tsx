import React, { useEffect, useState } from 'react';
import {
  Home,
  Music,
  Diamond,
  Layers,
  Plus,
  ListMusic,
  Settings,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Logo } from './Logo';
import { useAuthModal } from '@/store/useAuthModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '@/lib/apiConfig';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Music, label: 'Discover', path: '/search' },
  { icon: Diamond, label: 'Pro Plans', path: '/subscription' },
  { icon: Layers, label: 'Library', path: '/library' },
];

type StoredUser = {
  id?: string | number;
  name?: string;
  displayName?: string;
  email?: string;
  role?: string;
  userType?: string;
  isAdmin?: boolean;
  subscription?: any;
};

type Playlist = {
  id: string | number;
  name: string;
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

export function Sidebar() {
  const location = useLocation();
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const { open } = useAuthModal();

  const [subscription, setSubscription] = useState<any>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

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
    if (!user) {
      setSubscription(null);
      setPlaylists([]);
      return;
    }

    setSubscription(user.subscription || null);

    const token = localStorage.getItem('token');

    fetch(`${API_BASE_URL}/playlists`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.playlists || [];
        setPlaylists(list);
      })
      .catch(() => setPlaylists([]));
  }, [user]);

  const createPlaylist = async (name: string) => {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ name }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create playlist.');
    }

    const playlist = data.playlist || data.data || data;

    setPlaylists((current) => [
      {
        id: playlist.id || playlist._id || playlist.playlist_id,
        name: playlist.name || name,
      },
      ...current,
    ]);
  };

  const handleAuthLink = (e: React.MouseEvent, path: string) => {
    if (!user) {
      e.preventDefault();
      open('login');
    }
  };

  const handleCreatePlaylist = () => {
    if (!user) {
      open('login');
      return;
    }

    setPlaylistName('');
    setShowCreateModal(true);
  };

  const handleSubmitPlaylist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playlistName.trim()) return;

    try {
      setCreating(true);
      await createPlaylist(playlistName.trim());
      setPlaylistName('');
      setShowCreateModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create playlist.');
    } finally {
      setCreating(false);
    }
  };

  const isAdmin =
    user?.isAdmin || user?.userType === 'admin' || user?.role === 'admin';

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col h-full bg-black text-zinc-400 w-72 p-8 gap-y-12 border-r border-zinc-900 shrink-0">
        <Link to="/" className="group">
          <Logo />
        </Link>

        <nav className="space-y-6 flex-1 overflow-y-auto no-scrollbar">
          <div className="space-y-2">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-4 mb-4">
              Menu
            </p>

            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={(e) => {
                    if (item.label === 'Library') handleAuthLink(e, item.path);
                  }}
                  className={cn(
                    'flex items-center gap-x-6 font-medium transition-all duration-300 px-4 py-3 rounded-xl group',
                    isActive
                      ? 'bg-warm-gradient text-black shadow-lg shadow-orange-500/20'
                      : 'hover:text-white',
                  )}
                >
                  <item.icon
                    className={cn(
                      'w-7 h-7 transition-colors',
                      isActive ? 'text-black' : 'group-hover:text-white',
                    )}
                  />
                  <span className="text-lg">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="space-y-2 pt-6">
            <div className="flex items-center justify-between px-4 mb-4">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                Playlists
              </p>

              <button
                type="button"
                onClick={handleCreatePlaylist}
                className="text-zinc-500 hover:text-white transition-colors"
                title="Create Playlist"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              {playlists.map((playlist) => {
                const isActive = location.pathname === `/playlist/${playlist.id}`;

                return (
                  <Link
                    key={playlist.id}
                    to={`/playlist/${playlist.id}`}
                    className={cn(
                      'flex items-center gap-x-4 px-4 py-2 hover:text-white transition-colors group truncate',
                      isActive ? 'text-orange-500' : '',
                    )}
                  >
                    <ListMusic
                      className={cn(
                        'w-5 h-5 shrink-0',
                        isActive
                          ? 'text-orange-500'
                          : 'group-hover:text-orange-500 transition-colors',
                      )}
                    />

                    <span className="text-sm font-medium truncate">
                      {playlist.name}
                    </span>
                  </Link>
                );
              })}

              {playlists.length === 0 && user && (
                <p className="px-4 text-xs text-zinc-600 italic">
                  No playlists yet
                </p>
              )}
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-2 pt-6">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-4 mb-4">
                Admin
              </p>

              <Link
                to="/admin"
                className={cn(
                  'flex items-center gap-x-6 px-4 py-3 hover:text-white transition-colors group',
                  location.pathname === '/admin' ? 'text-orange-500' : '',
                )}
              >
                <Settings className="w-7 h-7 group-hover:text-orange-500 transition-colors" />
                <span className="text-lg font-bold">Admin Panel</span>
              </Link>
            </div>
          )}

          {user && subscription && (
            <div className="mt-auto pt-8 border-t border-zinc-900">
              <div className="bg-zinc-900/50 rounded-2xl p-4 border border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Plan
                  </span>

                  <span
                    className={cn(
                      'text-[10px] font-black px-2 py-0.5 rounded-full uppercase',
                      subscription.plan === 'trial'
                        ? 'bg-orange-500/10 text-orange-500'
                        : 'bg-emerald-500/10 text-emerald-500',
                    )}
                  >
                    {subscription.plan}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase">
                    Status
                  </span>

                  <span className="text-xs text-white font-medium">
                    {subscription.status}
                  </span>
                </div>

                {subscription.expiryDate && (
                  <p className="text-[10px] text-zinc-600 mt-2">
                    Expires:{' '}
                    {new Date(subscription.expiryDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-900 z-[60] px-4">
        <nav className="flex items-center justify-around h-full max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  if (item.label === 'Library') handleAuthLink(e, item.path);
                }}
                className={cn(
                  'flex flex-col items-center gap-y-1 transition-colors relative py-2',
                  isActive ? 'text-white' : 'text-zinc-500',
                )}
              >
                <item.icon
                  className={cn('w-6 h-6', isActive && 'text-orange-500')}
                />

                <span className="text-[10px] font-medium uppercase tracking-wider">
                  {item.label}
                </span>

                {isActive && (
                  <div className="absolute -bottom-1 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create Playlist</h3>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPlaylist} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Playlist name
                </label>

                <Input
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="bg-zinc-900 border-zinc-800 text-white"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-x-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowCreateModal(false)}
                  className="text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={creating || !playlistName.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-full px-6"
                >
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}