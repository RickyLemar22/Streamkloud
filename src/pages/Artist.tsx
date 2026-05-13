import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Song } from '@/types';
import { SongCard } from '@/components/SongCard';
import { Music, User, Disc3 } from 'lucide-react';

import { API_BASE_URL, getMediaUrl } from "@/lib/apiConfig";

const UPLOADS_BASE_URL = API_BASE_URL.replace('/api', '');

type ArtistData = {
  id: string | number;
  name: string;
  bio?: string;
  profile_image?: string;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  profileImage?: string;
};

type AlbumData = {
  id: string | number;
  title: string;
  artist_id?: string | number;
  artist?: string;
  cover_url?: string;
  coverUrl?: string;
  release_date?: string;
  releaseYear?: string | number;
};

const makeAbsoluteUploadUrl = (value?: string, fallbackFolder = 'covers') => {
  if (!value) return '';

  const cleanedValue = String(value).trim();

  if (!cleanedValue) return '';

  if (
    cleanedValue.startsWith('http://') ||
    cleanedValue.startsWith('https://') ||
    cleanedValue.startsWith('blob:')
  ) {
    return cleanedValue;
  }

  if (cleanedValue.startsWith('/uploads/')) {
    return `${UPLOADS_BASE_URL}${cleanedValue}`;
  }

  if (cleanedValue.startsWith('uploads/')) {
    return `${UPLOADS_BASE_URL}/${cleanedValue}`;
  }

  const filename = cleanedValue.split('/').pop();

  if (!filename) return '';

  return `${UPLOADS_BASE_URL}/uploads/${fallbackFolder}/${filename}`;
};

const getArtistImageUrl = (artist: ArtistData | null) => {
  if (!artist) return '';

  const image =
    artist.profile_image ||
    artist.imageUrl ||
    artist.image_url ||
    artist.image ||
    artist.profileImage;

  return makeAbsoluteUploadUrl(image, 'general');
};

const getCoverUrl = (item: any, fallbackArtist?: ArtistData | null) => {
  const cover =
    item.coverUrl ||
    item.cover_url ||
    item.coverImage ||
    item.cover_image ||
    item.song_cover ||
    item.songCover ||
    item.album_cover ||
    item.albumCover ||
    item.profile_image ||
    item.image ||
    item.imageUrl ||
    fallbackArtist?.profile_image ||
    fallbackArtist?.imageUrl ||
    fallbackArtist?.image_url ||
    fallbackArtist?.image ||
    fallbackArtist?.profileImage;

  return makeAbsoluteUploadUrl(cover, 'covers');
};

export function Artist() {
  const { name } = useParams();
  const navigate = useNavigate();

  const artistName = decodeURIComponent(name || '');

  const [artist, setArtist] = useState<ArtistData | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<AlbumData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchArtistProfile = async () => {
      try {
        setLoading(true);

        const [artistsRes, songsRes, albumsRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/artists`),
          fetch(`${API_BASE_URL}/songs?artist=${encodeURIComponent(artistName)}`),
          fetch(`${API_BASE_URL}/albums`),
        ]);

        const artistsData =
          artistsRes.status === 'fulfilled' && artistsRes.value.ok
            ? await artistsRes.value.json()
            : [];

        const songsData =
          songsRes.status === 'fulfilled' && songsRes.value.ok
            ? await songsRes.value.json()
            : [];

        const albumsData =
          albumsRes.status === 'fulfilled' && albumsRes.value.ok
            ? await albumsRes.value.json()
            : [];

        const foundArtist = artistsData.find(
          (a: any) =>
            String(a.name).toLowerCase() === artistName.toLowerCase()
        );

        const finalArtist = foundArtist
          ? {
              id: foundArtist._id || foundArtist.id,
              ...foundArtist,
              imageUrl: getMediaUrl(getArtistImageUrl(foundArtist)),
            }
          : null;

        setArtist(finalArtist);

        const artistId = foundArtist?._id || foundArtist?.id;

        setSongs(
          songsData.map((song: any) => ({
            id: song._id || song.id,
            ...song,
            audioUrl: song.url || song.audioUrl || song.file_url || song.fileUrl,
            coverUrl: getMediaUrl(getCoverUrl(song), finalArtist),
          }))
        );

        setAlbums(
          albumsData
            .filter((album: any) => {
              return (
                String(album.artist_id) === String(artistId) ||
                String(album.artistId) === String(artistId) ||
                String(album.artist || '').toLowerCase() ===
                  artistName.toLowerCase()
              );
            })
            .map((album: any) => ({
              id: album._id || album.id,
              ...album,
              coverUrl: getMediaUrl(getCoverUrl(album), finalArtist),
            }))
        );
      } catch (error) {
        console.error('Error fetching artist profile:', error);
      } finally {
        setLoading(false);
      }
    };

    if (artistName) fetchArtistProfile();
  }, [artistName]);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto bg-atmosphere p-6 pb-40 text-zinc-400">
        Loading artist profile...
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-atmosphere p-6 pb-40">
      <div className="mb-10 flex flex-col md:flex-row items-center md:items-end gap-6">
        <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden bg-zinc-800 border-4 border-zinc-900 flex items-center justify-center shadow-2xl">
          {artist && getArtistImageUrl(artist) ? (
            <img
              src={getArtistImageUrl(artist)}
              alt={artist.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User className="w-20 h-20 text-zinc-600" />
          )}
        </div>

        <div className="text-center md:text-left">
          <p className="text-sm uppercase tracking-widest text-zinc-400 mb-2">
            Artist
          </p>

          <h1 className="text-white text-4xl md:text-6xl font-black mb-4">
            {artist?.name || artistName}
          </h1>

          <p className="max-w-2xl text-zinc-300 leading-relaxed">
            {artist?.bio?.trim()
              ? artist.bio
              : 'No biography has been added for this artist yet.'}
          </p>
        </div>
      </div>

      <section className="mb-12">
        <div className="mb-6 flex items-center gap-3">
          <Disc3 className="w-6 h-6 text-orange-500" />
          <h2 className="text-white text-2xl font-bold">
            Albums by {artist?.name || artistName}
          </h2>
        </div>

        {albums.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {albums.map((album) => (
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
                      src={getMediaUrl(album.coverUrl)}
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
                  {album.release_date || album.releaseYear || 'Album'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
            <Disc3 className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">
              No albums available for this artist yet.
            </p>
          </div>
        )}
      </section>

      <section>
        <div className="mb-6 flex items-center gap-3">
          <Music className="w-6 h-6 text-orange-500" />
          <h2 className="text-white text-2xl font-bold">
            Songs by {artist?.name || artistName}
          </h2>
        </div>

        {songs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
            <Music className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">
              No songs available for this artist yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}