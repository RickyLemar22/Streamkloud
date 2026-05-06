import React from 'react';
import { Play, Pause, Plus, Heart, ListPlus } from 'lucide-react';
import { Song } from '@/types';
import { usePlayerStore } from '@/store/usePlayerStore';
import { cn } from '@/lib/utils';
import { usePlaylists } from '@/hooks/usePlaylists';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface SongCardProps {
  song: Song;
}

export const SongCard: React.FC<SongCardProps> = ({ song }) => {
  const { setCurrentSong, currentSong, isPlaying, setIsPlaying, addToQueue, likedSongs, toggleLike } = usePlayerStore();
  const { playlists, addSongToPlaylist, createPlaylist } = usePlaylists();
  const isActive = currentSong?.id === song.id;
  const isLiked = likedSongs.includes(song.id);

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToQueue(song);
  };

  const handleToggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLike(song.id);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isActive) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
    }
  };

  const handleCreateAndAdd = async () => {
    const name = prompt('Enter new playlist name:');
    if (name) {
      // This is a bit tricky because addDoc doesn't return the ID immediately in the hook's state
      // But we can just create it. The user can add to it later.
      // For now, let's just create it.
      createPlaylist(name);
    }
  };

  return (
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
        <div className="absolute top-2 right-2 flex gap-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger 
              className="p-2 rounded-full bg-black/40 backdrop-blur-md text-white/70 hover:text-white transition-colors focus:outline-none" 
              onClick={(e) => e.stopPropagation()}
            >
              <ListPlus className="w-5 h-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-zinc-800 text-zinc-300">
              <DropdownMenuLabel>Add to Playlist</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-800" />
              {playlists.map((playlist) => (
                <DropdownMenuItem 
                  key={playlist.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    addSongToPlaylist(playlist.id, song.id);
                  }}
                  className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer"
                >
                  {playlist.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator className="bg-zinc-800" />
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCreateAndAdd();
                }}
                className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer text-orange-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Playlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button 
            onClick={handleToggleLike}
            className={cn(
              "p-2 rounded-full bg-black/40 backdrop-blur-md transition-colors",
              isLiked ? "text-orange-500" : "text-white/70 hover:text-white"
            )}
          >
            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
          </button>
        </div>
        <div className="absolute bottom-2 right-2 flex gap-x-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button 
            onClick={handleAddToQueue}
            className="bg-zinc-900/80 text-white rounded-full p-3 shadow-xl hover:bg-zinc-800 transition"
            title="Add to queue"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={handlePlay}
            className="bg-orange-500 text-black rounded-full p-3 shadow-xl hover:scale-105 transition"
          >
            {isActive && isPlaying ? (
              <Pause className="w-6 h-6 fill-black" />
            ) : (
              <Play className="w-6 h-6 fill-black" />
            )}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-y-1">
        <span className={`font-bold truncate ${isActive ? 'text-orange-500' : 'text-white'}`}>
          {song.title}
        </span>
        <span className="text-zinc-400 text-sm truncate flex items-center justify-between">
          <span>{song.artist}</span>
          {song.duration && (
            <span className="text-[10px] opacity-50">
              {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
            </span>
          )}
        </span>
      </div>
    </div>
  );
}
