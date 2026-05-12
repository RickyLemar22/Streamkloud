import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Song } from '@/types';
import { SongCard } from '@/components/SongCard';
import { Search as SearchIcon, User, Disc3, Music } from 'lucide-react';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UPLOADS_BASE_URL = API_BASE_URL.replace('/api', '');

type Artist = {
  id: string | number;
  name: string;
  bio?: string;
  profile_image?: string;
  imageUrl?: string;
  image_url?: string;
  image?: string;
};

type Album = {
  id: string | number;
  title: string;
  artist?: string;
  artist_id?: string | number;
  cover_url?: string;
  coverUrl?: string;
  release_date?: string;
};

const getArtistImageUrl = (artist: Artist) => {
  const image =
    artist.profile_image ||
    artist.imageUrl ||
    artist.image_url ||
    artist.image;

  if (!image) return '';

  const cleaned = String(image).trim();

  if (cleaned.startsWith('http')) return cleaned;

  const filename = cleaned.split('/').pop();

  if (!filename) return '';

  return `${UPLOADS_BASE_URL}/uploads/general/${filename}`;
};

const getCoverUrl = (item: any) => {
  const cover =
    item.coverUrl ||
    item.cover_url ||
    item.coverImage ||
    item.cover_image ||
    item.image ||
    item.imageUrl;

  if (!cover) return '';

  const cleaned = String(cover).trim();

  if (cleaned.startsWith('http')) return cleaned;

  if (cleaned.startsWith('/uploads/')) {
    return `${UPLOADS_BASE_URL}${cleaned}`;
  }

  const filename = cleaned.split('/').pop();

  if (!filename) return '';

  return `${UPLOADS_BASE_URL}/uploads/covers/${filename}`;
};

export function Search() {
  const navigate = useNavigate();
  const location = useLocation();

  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        setLoading(true);

        const [songsRes, artistsRes, albumsRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/songs`),
          fetch(`${API_BASE_URL}/artists`),
          fetch(`${API_BASE_URL}/albums`),
        ]);

        const songsData =
          songsRes.status === 'fulfilled' && songsRes.value.ok
            ? await songsRes.value.json()
            : [];

        const artistsData =
          artistsRes.status === 'fulfilled' && artistsRes.value.ok
            ? await artistsRes.value.json()
            : [];

        const albumsData =
          albumsRes.status === 'fulfilled' && albumsRes.value.ok
            ? await albumsRes.value.json()
            : [];

        setSongs(
          songsData.map((song: any) => ({
            id: song._id || song.id,
            ...song,
            audioUrl: song.url || song.audioUrl || song.file_url || song.fileUrl,
            coverUrl: getCoverUrl(song),
          }))
        );

        setArtists(
          artistsData.map((artist: any) => ({
            id: artist._id || artist.id,
            ...artist,
            imageUrl: getArtistImageUrl(artist),
          }))
        );

        setAlbums(
          albumsData.map((album: any) => ({
            id: album._id || album.id,
            ...album,
            coverUrl: getCoverUrl(album),
          }))
        );
      } catch (error) {
        console.error('Error fetching search data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchData();
  }, []);

  const query = new URLSearchParams(location.search).get('q') || '';
  const normalizedQuery = query.trim().toLowerCase();

  const filteredSongs = useMemo(() => {
    if (!normalizedQuery) return songs;

    return songs.filter((song: any) => {
      return (
        String(song.title || '').toLowerCase().includes(normalizedQuery) ||
        String(song.artist || '').toLowerCase().includes(normalizedQuery) ||
        String(song.genre || '').toLowerCase().includes(normalizedQuery) ||
        String(song.album || '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [songs, normalizedQuery]);

  const filteredArtists = useMemo(() => {
    if (!normalizedQuery) return artists;

    return artists.filter((artist) => {
      return (
        String(artist.name || '').toLowerCase().includes(normalizedQuery) ||
        String(artist.bio || '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [artists, normalizedQuery]);

  const filteredAlbums = useMemo(() => {
    if (!normalizedQuery) return albums;

    return albums.filter((album) => {
      return (
        String(album.title || '').toLowerCase().includes(normalizedQuery) ||
        String(album.artist || '').toLowerCase().includes(normalizedQuery) ||
        String(album.release_date || '').toLowerCase().includes(normalizedQuery)
      );
    });
  }, [albums, normalizedQuery]);

  const hasResults =
    filteredSongs.length > 0 ||
    filteredArtists.length > 0 ||
    filteredAlbums.length > 0;

  return (
    <div className="flex-1 overflow-y-auto bg-atmosphere p-4 lg:p-8 pb-40">
      <div className="mb-8">
        <h1 className="text-white text-3xl lg:text-4xl font-black mb-2">
          Search
        </h1>
        {query ? (
          <p className="text-zinc-400">
            Showing results for <span className="text-white font-semibold">{query}</span>
          </p>
        ) : (
          <p className="text-zinc-500">
            Use the search bar at the top to find songs, artists, albums, and genres.
          </p>
        )}
      </div>

      {loading ? (
        <p className="text-zinc-500">Loading search data...</p>
      ) : !hasResults ? (
        <div className="py-14 text-center bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
          <SearchIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500">No matching results found.</p>
        </div>
      ) : (
        <>
          {filteredArtists.length > 0 && (
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <User className="w-6 h-6 text-orange-500" />
                <h2 className="text-white text-2xl font-bold">Artists</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredArtists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() =>
                      navigate(`/artist/${encodeURIComponent(artist.name)}`)
                    }
                    className="group cursor-pointer text-center"
                  >
                    <div className="aspect-square rounded-full overflow-hidden bg-zinc-800 border-4 border-zinc-900 mb-3 flex items-center justify-center">
                      {artist.imageUrl ? (
                        <img
                          src={artist.imageUrl}
                          alt={artist.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="w-16 h-16 text-zinc-600" />
                      )}
                    </div>

                    <h3 className="text-white font-bold truncate">
                      {artist.name}
                    </h3>

                    <p className="text-zinc-500 text-sm">Artist</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredAlbums.length > 0 && (
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <Disc3 className="w-6 h-6 text-orange-500" />
                <h2 className="text-white text-2xl font-bold">Albums</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() =>
                      navigate(`/album/${encodeURIComponent(album.title)}`)
                    }
                    className="group cursor-pointer"
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-800 mb-3 flex items-center justify-center">
                      {album.coverUrl ? (
                        <img
                          src={album.coverUrl}
                          alt={album.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Disc3 className="w-16 h-16 text-zinc-600" />
                      )}
                    </div>

                    <h3 className="text-white font-bold truncate">
                      {album.title}
                    </h3>

                    <p className="text-zinc-500 text-sm truncate">
                      {album.artist || album.release_date || 'Album'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredSongs.length > 0 && (
            <section className="mb-12">
              <div className="mb-6 flex items-center gap-3">
                <Music className="w-6 h-6 text-orange-500" />
                <h2 className="text-white text-2xl font-bold">Songs</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filteredSongs.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}