import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Song } from '@/types';
import { SongCard } from '@/components/SongCard';

import { API_BASE_URL } from "@/lib/apiConfig";

export function Genre() {
  const { name } = useParams();
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    const fetchGenreSongs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/songs?genre=${name}`);
        const data = await res.json();
        setSongs(data);
      } catch (error) {
        console.error('Error fetching genre songs:', error);
      }
    };

    if (name) fetchGenreSongs();
  }, [name]);

  return (
    <div className="p-6">
      <h1 className="text-white text-3xl mb-6">{name}</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>
    </div>
  );
}