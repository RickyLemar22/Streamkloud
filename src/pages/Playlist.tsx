import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Song, Playlist as PlaylistType } from '@/types';
import { SongCard } from '@/components/SongCard';
import { Play, ListMusic, Trash2, Music2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerStore } from '@/store/usePlayerStore';
import { usePlaylists } from '@/hooks/usePlaylists';

import { API_BASE_URL, getMediaUrl } from "@/lib/apiConfig";

export function Playlist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState<PlaylistType | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const { setQueue, setCurrentSong } = usePlayerStore();
  const { deletePlaylist, removeSongFromPlaylist } = usePlaylists();

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!id) return;

      try {
        const res = await fetch(`${API_BASE_URL}/playlists/${id}`);

        if (!res.ok) {
          navigate('/');
          return;
        }

        const data = await res.json();

        setPlaylist({
          id: String(data.id || data._id),
          name: data.name,
          ownerId: String(data.ownerId || data.user_id || data.userId || ''),
          songIds: data.songIds || data.song_ids || [],
          isPublic: Boolean(data.isPublic ?? data.is_public),
          createdAt: data.createdAt || data.created_at,
        } as PlaylistType);
      } catch (error) {
        console.error('Error fetching playlist:', error);
        navigate('/');
      }
    };

    fetchPlaylist();
  }, [id, navigate]);

  useEffect(() => {
    if (!playlist || !playlist.songIds || playlist.songIds.length === 0) {
      setSongs([]);
      return;
    }

    const fetchSongs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/songs?ids=${playlist.songIds.join(',')}`);

        if (!response.ok) {
          throw new Error('Failed to fetch playlist songs');
        }

        const fetchedSongs = await response.json();

        const formattedSongs = fetchedSongs.map((s: any) => ({
          id: String(s.id || s._id),
          ...s,
          audioUrl: s.audioUrl || s.audio_url || s.url || s.file_url,
          coverUrl: getMediaUrl(s.coverUrl || s.cover_url || s.coverImage || s.cover_image),
        }));

        const sortedSongs = playlist.songIds
          .map((sid) => formattedSongs.find((s: any) => String(s.id) === String(sid)))
          .filter(Boolean) as Song[];

        setSongs(sortedSongs);
      } catch (error) {
        console.error('Error fetching playlist songs:', error);
        setSongs([]);
      }
    };

    fetchSongs();
  }, [playlist]);

  const handlePlayAll = () => {
    if (songs.length > 0) {
      setQueue(songs);
      setCurrentSong(songs[0]);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    if (window.confirm('Are you sure you want to delete this playlist?')) {
      await deletePlaylist(id);
      navigate('/');
    }
  };

  if (!playlist) return null;

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
          <div className="w-48 h-48 lg:w-64 lg:h-64 rounded-xl bg-zinc-900 flex items-center justify-center shadow-2xl overflow-hidden relative group">
            <ListMusic className="w-24 h-24 text-zinc-800 group-hover:text-orange-500/20 transition-colors" />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-50" />
          </div>

          <div className="flex flex-col items-center md:items-start flex-1">
            <span className="text-xs lg:text-sm font-bold text-orange-500 uppercase tracking-widest mb-2">
              Playlist
            </span>

            <h1 className="text-4xl lg:text-7xl font-black text-white mb-2">
              {playlist.name}
            </h1>

            <p className="text-zinc-400 font-medium mb-6">{songs.length} songs</p>

            <div className="flex items-center gap-x-4">
              <Button
                onClick={handlePlayAll}
                disabled={songs.length === 0}
                className="bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-full px-8 h-12 gap-x-2"
              >
                <Play className="w-5 h-5 fill-black" />
                Play
              </Button>

              <Button
                variant="ghost"
                onClick={handleDelete}
                className="text-zinc-500 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">Songs</h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
            {songs.map((song) => (
              <div key={song.id} className="relative group">
                <SongCard song={song} />

                <button
                  onClick={() => removeSongFromPlaylist(playlist.id, song.id)}
                  className="absolute top-2 left-2 p-2 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                  title="Remove from playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {songs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <Music2 className="w-16 h-16 mb-4 opacity-20" />
              <p className="text-lg">This playlist is empty.</p>
              <p className="text-sm mt-2">Add some songs to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}