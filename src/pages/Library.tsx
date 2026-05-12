import { useEffect, useState } from 'react';
import { Playlist } from '@/types';
import { ListMusic, Plus, Layers, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthModal } from '@/store/useAuthModal';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type StoredUser = {
  id?: string | number;
  _id?: string | number;
  name?: string;
  displayName?: string;
  email?: string;
};

const getStoredUser = (): StoredUser | null => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const normalizePlaylists = (data: any): Playlist[] => {
  const list = Array.isArray(data) ? data : data?.playlists || data?.data || [];

  return list.map((playlist: any) => ({
    ...playlist,
    id: playlist.id || playlist._id,
    songIds: playlist.songIds || playlist.songs || playlist.song_ids || [],
  }));
};

export function Library() {
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

  const { open } = useAuthModal();

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
      setPlaylists([]);
      return;
    }

    const token = localStorage.getItem('token');

    const fetchPlaylists = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/playlists`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (response.ok) {
          const data = await response.json();
          setPlaylists(normalizePlaylists(data));
        }
      } catch (error) {
        console.error('Error fetching playlists:', error);
      }
    };

    fetchPlaylists();
  }, [user]);

  const openCreateModal = () => {
    if (!user) {
      open('login');
      return;
    }

    setPlaylistName('');
    setShowCreateModal(true);
  };

  const handleCreatePlaylist = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!playlistName.trim()) return;

    const token = localStorage.getItem('token');

    try {
      setCreating(true);

      const response = await fetch(`${API_BASE_URL}/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: playlistName.trim() }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create playlist.');
      }

      const playlist = data.playlist || data.data || data;

      setPlaylists((current) => [
        ...current,
        {
          ...playlist,
          id: playlist.id || playlist._id,
          name: playlist.name || playlistName.trim(),
          songIds: playlist.songIds || playlist.songs || playlist.song_ids || [],
        },
      ]);

      setPlaylistName('');
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert(error instanceof Error ? error.message : 'Failed to create playlist.');
    } finally {
      setCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 p-8 text-center">
        <Layers className="w-20 h-20 text-zinc-800 mb-6" />

        <h1 className="text-3xl font-black text-white mb-4">Your Library</h1>

        <p className="text-zinc-400 max-w-md mb-8">
          Log in to see your playlists and liked songs.
        </p>

        <Button
          onClick={() => open('login')}
          className="bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-full px-8 h-12"
        >
          Log In
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-x-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Layers className="w-6 h-6 text-orange-500" />
            </div>

            <h1 className="text-3xl lg:text-4xl font-black text-white">
              Library
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Your Playlists</h2>

            <Button
              onClick={openCreateModal}
              variant="outline"
              className="border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full gap-x-2"
            >
              <Plus className="w-4 h-4" />
              New Playlist
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                to={`/playlist/${playlist.id}`}
                className="group bg-zinc-900/40 hover:bg-zinc-800/60 p-4 rounded-xl transition-all duration-300 cursor-pointer"
              >
                <div className="relative aspect-square mb-4 shadow-2xl overflow-hidden rounded-lg bg-zinc-800 flex items-center justify-center">
                  <ListMusic className="w-12 h-12 text-zinc-700 group-hover:text-orange-500/40 transition-colors" />
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex flex-col gap-y-1">
                  <span className="font-bold text-white truncate">
                    {playlist.name}
                  </span>

                  <span className="text-zinc-400 text-sm truncate">
                    {playlist.songIds?.length || 0} songs
                  </span>
                </div>
              </Link>
            ))}

            {playlists.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-zinc-500 border-2 border-dashed border-zinc-900 rounded-3xl">
                <ListMusic className="w-12 h-12 mb-4 opacity-20" />
                <p>You haven't created any playlists yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create Playlist</h3>

              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlaylist} className="space-y-5">
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
    </div>
  );
}