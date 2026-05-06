import { create } from 'zustand';
import { Song } from '../types';

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  queue: Song[];
  volume: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
  likedSongs: string[];
  setCurrentSong: (song: Song) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setQueue: (queue: Song[]) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playNext: () => void;
  playPrevious: () => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (songId: string) => void;
  toggleLike: (songId: string) => void;
  setLikedSongs: (songIds: string[]) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  volume: 0.5,
  isShuffled: false,
  repeatMode: 'none',
  likedSongs: [],
  setCurrentSong: (song) => set((state) => {
    const isInQueue = state.queue.some(s => s.id === song.id);
    const newQueue = isInQueue ? state.queue : [song, ...state.queue];
    return { 
      currentSong: song, 
      isPlaying: true,
      queue: newQueue
    };
  }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setQueue: (queue) => set({ queue }),
  setVolume: (volume) => set({ volume }),
  toggleShuffle: () => set((state) => ({ isShuffled: !state.isShuffled })),
  toggleRepeat: () => set((state) => {
    const modes: ('none' | 'one' | 'all')[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(state.repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    return { repeatMode: nextMode };
  }),
  addToQueue: (song) => set((state) => {
    if (state.queue.find(s => s.id === song.id)) return state;
    return { queue: [...state.queue, song] };
  }),
  removeFromQueue: (songId) => set((state) => ({
    queue: state.queue.filter(s => s.id !== songId)
  })),
  toggleLike: (songId) => set((state) => {
    const isLiked = state.likedSongs.includes(songId);
    if (isLiked) {
      return { likedSongs: state.likedSongs.filter(id => id !== songId) };
    }
    return { likedSongs: [...state.likedSongs, songId] };
  }),
  setLikedSongs: (songIds) => set({ likedSongs: songIds }),
  playNext: () => {
    const { currentSong, queue, isShuffled, repeatMode } = get();
    if (!currentSong || queue.length === 0) return;

    if (repeatMode === 'one') {
      set({ isPlaying: false }); // Briefly toggle to trigger effect if needed, or just seek to 0
      setTimeout(() => set({ isPlaying: true }), 0);
      return;
    }

    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    let nextIndex;

    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * queue.length);
      if (nextIndex === currentIndex && queue.length > 1) {
        nextIndex = (nextIndex + 1) % queue.length;
      }
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === 'all') {
          nextIndex = 0;
        } else {
          set({ isPlaying: false });
          return;
        }
      }
    }

    set({ currentSong: queue[nextIndex], isPlaying: true });
  },
  playPrevious: () => {
    const { currentSong, queue, repeatMode } = get();
    if (!currentSong || queue.length === 0) return;

    const currentIndex = queue.findIndex((s) => s.id === currentSong.id);
    let prevIndex = currentIndex - 1;

    if (prevIndex < 0) {
      if (repeatMode === 'all') {
        prevIndex = queue.length - 1;
      } else {
        // If at start and not repeating all, just restart the song
        prevIndex = 0;
      }
    }

    set({ currentSong: queue[prevIndex], isPlaying: true });
  },
}));
