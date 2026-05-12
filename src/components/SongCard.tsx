import React, { useState } from 'react';
import { Play, Pause, Plus, Heart, ListPlus, X } from 'lucide-react';
import { Song } from '@/types';
import { usePlayerStore } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';
import { usePlaylists } from '@/hooks/usePlaylists';
import { useNavigate } from 'react-router-dom';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SongCardProps {
  song: Song;
}

export const SongCard: React.FC<SongCardProps> = ({ song }) => {
  const {
    setCurrentSong,
    currentSong,
    isPlaying,
    setIsPlaying,
    addToQueue,
    likedSongs,
    toggleLike,
  } = usePlayerStore();

  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylists();

  const navigate = useNavigate();

  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

  const songId = String(song.id);
  const isActive = String(currentSong?.id) === songId;
  const isLiked = likedSongs.map(String).includes(songId);

  const isLocalSong = songId.startsWith('local-');
  const isAuthenticated = Boolean(localStorage.getItem('token'));

  const requireAuth = () => {
    if (isLocalSong) return true;

    if (!isAuthenticated) {
      navigate('/login', { state: { redirectAfterLogin: true } });
      return false;
    }

    return true;
  };

  const stopCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!requireAuth()) return;

    addToQueue(song);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!requireAuth()) return;

    toggleLike(song.id);
  };

  const handlePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!requireAuth()) return;

    if (isActive) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const handleAddSongToPlaylist = (
    e: React.MouseEvent,
    playlistId: string | number,
  ) => {
    e.stopPropagation();
    e.preventDefault();

    if (!requireAuth()) return;

    addSongToPlaylist(playlistId, song.id);
  };

  const openCreatePlaylistModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!requireAuth()) return;

    setPlaylistName('');
    setShowCreatePlaylist(true);
  };

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!playlistName.trim()) return;
    if (!requireAuth()) return;

    try {
      setCreating(true);

      const createdPlaylist: any = await createPlaylist(playlistName.trim());

      const newPlaylist =
        createdPlaylist?.playlist ||
        createdPlaylist?.data ||
        createdPlaylist;

      const newPlaylistId =
        newPlaylist?.id ||
        newPlaylist?._id ||
        newPlaylist?.playlist_id;

      if (newPlaylistId) {
        await addSongToPlaylist(newPlaylistId, song.id);
      }

      setPlaylistName('');
      setShowCreatePlaylist(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div
        className="group bg-zinc-900/40 hover:bg-zinc-800/60 p-3 sm:p-4 rounded-xl transition-all duration-300 cursor-pointer relative"
        onClick={handlePlay}
      >
        <div className="relative aspect-square mb-3 sm:mb-4 shadow-2xl">
          <img
            src={song.coverUrl || 'https://picsum.photos/seed/song/200/200'}
            alt={song.title}
            className="w-full h-full object-cover rounded-lg"
            referrerPolicy="no-referrer"
          />

          <div
            className="absolute top-2 right-2 flex gap-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={stopCardClick}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-white transition-colors focus:outline-none"
                  onClick={(e) => {
                    e.stopPropagation();

                    if (!requireAuth()) {
                      e.preventDefault();
                    }
                  }}
                  title="Add to playlist"
                >
                  <ListPlus className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 bg-zinc-900 border-zinc-800 text-zinc-300"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenuLabel>Add to Playlist</DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-zinc-800" />

                {playlists.length > 0 ? (
                  playlists.map((playlist) => (
                    <DropdownMenuItem
                      key={playlist.id}
                      onClick={(e) => handleAddSongToPlaylist(e, playlist.id)}
                      className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                    >
                      {playlist.name}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem
                    disabled
                    className="text-zinc-500 cursor-default"
                  >
                    No playlists yet
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator className="bg-zinc-800" />

                <DropdownMenuItem
                  onClick={openCreatePlaylistModal}
                  className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer text-orange-500"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Playlist
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={handleToggleLike}
              className={cn(
                'p-2 rounded-full bg-black/40 backdrop-blur-md transition-colors',
                isLiked ? 'text-orange-500' : 'text-white/70 hover:text-white',
              )}
              title={isLiked ? 'Unlike song' : 'Like song'}
            >
              <Heart
                className={cn('w-5 h-5', isLiked && 'fill-current')}
              />
            </button>
          </div>

          <div
            className="absolute bottom-2 right-2 flex gap-x-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300"
            onClick={stopCardClick}
          >
            <button
              type="button"
              onClick={handleAddToQueue}
              className="bg-zinc-900/80 text-white rounded-full p-3 shadow-xl hover:bg-zinc-800 transition"
              title="Add to queue"
            >
              <Plus className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handlePlay}
              className="bg-orange-500 text-black rounded-full p-3 shadow-xl hover:scale-105 transition"
              title={isActive && isPlaying ? 'Pause' : 'Play'}
            >
              {isActive && isPlaying ? (
                <Pause className="w-6 h-6 fill-black" />
              ) : (
                <Play className="w-6 h-6 fill-black ml-0.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-y-1">
          <span
            className={cn(
              'font-bold truncate',
              isActive ? 'text-orange-500' : 'text-white',
            )}
          >
            {song.title}
          </span>

          <span className="text-zinc-400 text-sm truncate flex items-center justify-between">
            <span>{song.artist}</span>

            {song.duration && (
              <span className="text-[10px] opacity-50">
                {Math.floor(song.duration / 60)}:
                {(song.duration % 60).toString().padStart(2, '0')}
              </span>
            )}
          </span>
        </div>
      </div>

      {showCreatePlaylist && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create Playlist</h3>

              <button
                type="button"
                onClick={() => setShowCreatePlaylist(false)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAndAdd} className="space-y-5">
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
                  onClick={() => setShowCreatePlaylist(false)}
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
};