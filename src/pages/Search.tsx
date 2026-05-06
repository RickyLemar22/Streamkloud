import { useEffect, useState } from 'react';
import { Song } from '@/types';
import { SongCard } from '@/components/SongCard';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function Search() {
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/songs`);
        const data = await res.json();
        setSongs(data);
      } catch (error) {
        console.error('Error fetching songs:', error);
      }
    };

    fetchSongs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-white text-3xl mb-6">Search</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}