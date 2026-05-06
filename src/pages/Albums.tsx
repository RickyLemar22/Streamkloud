import { useEffect, useState } from 'react';
import { Album } from '@/types';
import { Disc } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function Albums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/albums`);

        if (!res.ok) {
          throw new Error('Failed to fetch albums');
        }

        const data = await res.json();

        const formattedAlbums = data.map((album: any) => ({
          id: album.id || album._id,
          title: album.title,
          artist: album.artist || album.artist_name || 'Unknown Artist',
          coverUrl: album.coverUrl || album.cover_url || album.coverImage || album.cover_image,
          createdAt: album.createdAt || album.created_at,
        }));

        setAlbums(formattedAlbums);
      } catch (error) {
        console.error('Error fetching albums:', error);
        setAlbums([]);
      }
    };

    fetchAlbums();
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-x-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
            <Disc className="w-6 h-6 text-orange-500" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white">All Albums</h1>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
          {albums.map((album) => (
            <div
              key={album.id}
              className="group bg-zinc-900/40 hover:bg-zinc-800/60 p-4 rounded-xl transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/album/${album.title}`)}
            >
              <div className="relative aspect-square mb-4 shadow-2xl overflow-hidden rounded-lg">
                <img
                  src={album.coverUrl || 'https://picsum.photos/seed/album/200/200'}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col gap-y-1">
                <span className="font-bold text-white truncate">{album.title}</span>
                <span className="text-zinc-400 text-sm truncate">{album.artist}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}