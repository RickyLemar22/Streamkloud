import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Song, Artist } from "@/types";
import { SongCard } from "@/components/SongCard";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useAuthModal } from "@/store/useAuthModal";
import {
  Flame,
  BarChart3,
  Music,
  Headphones,
  Folder,
  Globe,
  ChevronRight,
  Play,
  User,
  Zap,
  Music2,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const CATEGORIES = [
  { icon: Flame, label: "Trending", path: "/" },
  { icon: BarChart3, label: "Charts", path: "/search" },
  { icon: Music, label: "Afrobeats", path: "/genre/Afrobeats" },
  { icon: Headphones, label: "Amapiano", path: "/genre/Amapiano" },
  { icon: Folder, label: "Local Media", path: "local" },
  { icon: Globe, label: "Global Hits", path: "/search" },
];

const getUploadUrl = (
  image?: string | null,
  folder: "covers" | "general" = "covers",
) => {
  if (!image) return "";

  if (image.startsWith("http")) return image;

  if (image.startsWith("/uploads")) {
    return getMediaUrl(image);
  }

  return getMediaUrl(`/uploads/${folder}/${image}`);
};

const getSongCoverUrl = (song: any) => {
  return getUploadUrl(
    song.coverImage ||
      song.coverUrl ||
      song.cover_image ||
      song.album_cover ||
      song.image ||
      song.imageUrl,
    "covers",
  );
};

const getArtistImageUrl = (artist: any) => {
  const image =
    artist.image_url ||
    artist.image ||
    artist.profile_image ||
    artist.profileImage ||
    artist.photo ||
    artist.imageUrl;

  if (!image) return "";

  const filename = String(image).split("/").pop();

  if (!filename) return "";

  return getMediaUrl(`/uploads/general/${filename}`);
};

const isLocalSong = (song: any) => {
  return (
    String(song?.id || "").startsWith("local-") ||
    String(song?.audioUrl || "").startsWith("blob:") ||
    String(song?.url || "").startsWith("blob:") ||
    song?.artist === "Local File" ||
    song?.genre === "Local"
  );
};

export function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(localStorage.getItem("token")),
  );

  const {
    setQueue,
    setCurrentSong,
    addToQueue,
    currentSong,
    isPlaying,
    setIsPlaying,
  } = usePlayerStore();

  const navigate = useNavigate();
  const { open } = useAuthModal();

  const requireAuth = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setIsPlaying(false);
      open("login");
      return false;
    }

    return true;
  };

  useEffect(() => {
    const syncAuth = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("token")));
    };

    syncAuth();

    window.addEventListener("storage", syncAuth);
    window.addEventListener("authUpdated", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("authUpdated", syncAuth);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const healthRes = await fetch("/api/health").catch((err) => ({
          ok: false,
          statusText: err.message,
        }));

        console.log(
          "Backend Health Check:",
          healthRes.ok ? "OK" : "FAILED",
          healthRes.statusText || "",
        );

        const [songsRes, artistsRes] = await Promise.all([
          fetch("/api/songs"),
          fetch("/api/artists").catch(() => null),
        ]);

        if (!songsRes.ok) {
          throw new Error(`Failed to fetch songs: Songs(${songsRes.status})`);
        }

        const songsData = await songsRes.json();

        const artistsData =
          artistsRes && artistsRes.ok ? await artistsRes.json() : [];

        const fetchedSongs = songsData.map((s: any) => ({
          id: s._id || s.id,
          ...s,
          audioUrl: s.url || s.audioUrl || s.file_url || s.fileUrl,
          coverUrl: getSongCoverUrl(s),
        }));

        const fetchedArtists = artistsData.map((a: any) => ({
          id: a._id || a.id,
          ...a,
          imageUrl: getArtistImageUrl(a),
        }));

        setSongs(fetchedSongs);
        setArtists(fetchedArtists);

        if (fetchedSongs.length > 0) {
          setQueue(fetchedSongs);
        }
      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };

    fetchData();
  }, [setQueue]);

  useEffect(() => {
    const loadRecentlyPlayed = () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setRecentlyPlayed([]);
        return;
      }

      const recent = JSON.parse(localStorage.getItem("recentlyPlayed") || "[]");

      const databaseSongIds = new Set(
        songs.map((song: any) => String(song.id)),
      );

      const validRecent = recent
        .filter((song: any) => {
          if (!song || isLocalSong(song)) return false;
          return databaseSongIds.has(String(song.id));
        })
        .map((song: any) => {
          const freshSong = songs.find(
            (s: any) => String(s.id) === String(song.id),
          );

          return freshSong || song;
        })
        .slice(0, 5);

      setRecentlyPlayed(validRecent);
    };

    loadRecentlyPlayed();

    window.addEventListener("recentlyPlayedUpdated", loadRecentlyPlayed);
    window.addEventListener("authUpdated", loadRecentlyPlayed);

    return () => {
      window.removeEventListener("recentlyPlayedUpdated", loadRecentlyPlayed);
      window.removeEventListener("authUpdated", loadRecentlyPlayed);
    };
  }, [songs]);

  const handleLocalMedia = () => {
    const input = document.createElement("input");

    input.type = "file";
    input.accept = "audio/*";
    input.multiple = true;

    input.onchange = (e: any) => {
      const files = Array.from(e.target.files as FileList);

      const localSongs: Song[] = files.map((file) => ({
        id: `local-${Math.random()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local File",
        duration: 0,
        audioUrl: URL.createObjectURL(file),
        coverUrl: "https://picsum.photos/seed/local/400/400",
        genre: "Local",
        createdAt: new Date().toISOString(),
      }));

      if (localSongs.length > 0) {
        setCurrentSong(localSongs[0]);
        setIsPlaying(true);

        localSongs.forEach((song) => addToQueue(song));
      }
    };

    input.click();
  };

  const handlePlaySong = (song: Song) => {
    if (!requireAuth()) return;

    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
      setIsPlaying(true);
    }
  };

  const AuthSongCard = ({ song }: { song: Song }) => (
    <div
      onClickCapture={(e) => {
        if (!isAuthenticated) {
          e.preventDefault();
          e.stopPropagation();
          open("login");
          return;
        }

        handlePlaySong(song);
      }}
    >
      <SongCard song={song} />
    </div>
  );

  const SongSection = ({
    title,
    songsList,
    subtitle,
  }: {
    title: string;
    songsList: Song[];
    subtitle?: string;
  }) => {
    if (songsList.length === 0) return null;

    return (
      <section className="mb-12 lg:mb-16">
        <div className="flex flex-col mb-6 lg:mb-8 group cursor-pointer w-fit">
          <div className="flex items-center gap-x-2">
            <h2 className="text-2xl lg:text-3xl font-bold text-white">
              {title}
            </h2>
            <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8 text-zinc-500 group-hover:text-white transition-colors" />
          </div>

          {subtitle && <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
          {songsList.map((song) => (
            <AuthSongCard key={`${title}-${song.id}`} song={song} />
          ))}
        </div>
      </section>
    );
  };

  const resumeListeningSongs = isAuthenticated
    ? recentlyPlayed.filter(Boolean).slice(0, 6)
    : [];

  return (
    <div className="flex-1 overflow-y-auto bg-atmosphere p-4 lg:p-8 pb-40 lg:pb-32">
      <div className="flex items-center gap-x-3 lg:gap-x-4 mb-8 lg:mb-12 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.label}
            onClick={() =>
              cat.path === "local" ? handleLocalMedia() : navigate(cat.path)
            }
            className="flex items-center gap-x-2 lg:gap-x-3 bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/50 px-4 lg:px-6 py-2 lg:py-3 rounded-full text-zinc-300 hover:text-white transition-all duration-300 whitespace-nowrap group"
          >
            <cat.icon className="w-4 h-4 lg:w-5 lg:h-5 group-hover:text-orange-500 transition-colors" />

            <span className="font-medium text-sm lg:text-base">
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      <SongSection
        title="Start Listening"
        songsList={resumeListeningSongs}
        subtitle=" Kick-start your music journey"
      />

      <section className="mb-12 lg:mb-16">
        <div className="flex items-center gap-x-2 mb-6 lg:mb-8 group cursor-pointer w-fit">
          <h2 className="text-2xl lg:text-3xl font-bold text-white">
            Featured Songs
          </h2>

          <ChevronRight className="w-6 h-6 lg:w-8 lg:h-8 text-zinc-500 group-hover:text-white transition-colors" />
        </div>

        {songs.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
            {songs.slice(0, 12).map((song) => (
              <AuthSongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
            <Music className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No featured songs available yet.</p>
          </div>
        )}
      </section>

      {artists.length > 0 && (
        <section className="mb-12 lg:mb-16">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-white">
              Artists
            </h2>

            <button
              onClick={() => navigate("/search")}
              className="text-zinc-500 hover:text-white text-xs lg:text-sm font-bold transition-colors"
            >
              See all →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
            {artists.map((artist: any) => (
              <div
                key={artist.id}
                className="group cursor-pointer text-center"
                onClick={() => navigate(`/artist/${artist.name}`)}
              >
                <div className="relative aspect-square mb-3 lg:mb-4 overflow-hidden rounded-full shadow-2xl border-4 border-zinc-900/50 group-hover:border-orange-500/50 transition-all">
                  {artist.imageUrl ? (
                    <img
                      src={artist.imageUrl}
                      alt={artist.name}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-zinc-800 flex items-center justify-center">
                      <User className="w-1/2 h-1/2 text-zinc-600" />
                    </div>
                  )}
                </div>

                <h3 className="font-bold text-white truncate text-sm lg:text-base">
                  {artist.name}
                </h3>

                <p className="text-zinc-500 text-xs lg:text-sm">Artist</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <SongSection
        title="Crafted for you"
        songsList={songs.slice().reverse().slice(0, 6)}
        subtitle="Personalized picks based on your taste"
      />

      <SongSection
        title="Fresh releases"
        songsList={songs.slice(0, 6)}
        subtitle="The latest tracks hitting the scene"
      />

      <SongSection
        title="Classic oldies"
        songsList={songs.length > 10 ? songs.slice(10, 16) : songs.slice(0, 3)}
        subtitle="Timeless hits that never go out of style"
      />

      <div className="mb-12 lg:mb-16">
        <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6 lg:mb-8">
          Moods & Vibes
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Nightclub feel",
              icon: Music2,
              color: "from-purple-600 to-blue-900",
              songs: songs.slice(0, 3),
            },
            {
              title: "Streaming energy",
              icon: Zap,
              color: "from-yellow-500 to-orange-700",
              songs: songs.slice(3, 6),
            },
            {
              title: "African pulse",
              icon: Globe,
              color: "from-orange-600 to-red-900",
              songs: songs.slice(6, 9),
            },
          ].map((mood) => (
            <div
              key={mood.title}
              className={`p-6 rounded-2xl bg-gradient-to-br ${mood.color} shadow-xl group cursor-pointer`}
            >
              <div className="flex items-center gap-x-2 mb-4">
                <mood.icon className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white">{mood.title}</h3>
              </div>

              <div className="space-y-3">
                {mood.songs.map((song) => (
                  <div
                    key={song.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySong(song);
                    }}
                    className="flex items-center gap-x-3 bg-black/20 p-2 rounded-lg hover:bg-black/40 transition-colors"
                  >
                    <img
                      src={
                        song.coverUrl ||
                        "https://picsum.photos/seed/song/200/200"
                      }
                      className="w-10 h-10 rounded object-cover"
                      referrerPolicy="no-referrer"
                      alt={song.title}
                    />

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {song.title}
                      </p>
                      <p className="text-xs text-white/60 truncate">
                        {song.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section className="mb-12 lg:mb-16">
        <div
          onClick={() => navigate("/search")}
          className="bg-gradient-to-r from-orange-500 to-red-600 rounded-3xl p-8 lg:p-12 relative overflow-hidden group cursor-pointer"
        >
          <div className="relative z-10 max-w-lg">
            <h2 className="text-3xl lg:text-5xl font-black text-white mb-4 lg:mb-6">
              Create your own mix
            </h2>

            <p className="text-white/80 text-lg mb-8">
              Combine your favorite artists and genres into a unique listening
              experience.
            </p>

            <Button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/search");
              }}
              className="bg-white text-black hover:bg-zinc-200 rounded-full px-8 h-12 font-bold"
            >
              Start Mixing
            </Button>
          </div>

          <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 group-hover:opacity-30 transition-opacity">
            <div className="grid grid-cols-3 gap-2 rotate-12 translate-x-12">
              {songs.slice(0, 9).map((song, i) => (
                <img
                  key={i}
                  src={
                    song.coverUrl || "https://picsum.photos/seed/song/200/200"
                  }
                  className="aspect-square rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                  alt={song.title}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12 lg:mb-16">
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <h2 className="text-2xl lg:text-3xl font-bold text-white">
            Playlists for you
          </h2>

          <button className="text-zinc-500 hover:text-white text-xs lg:text-sm font-bold transition-colors">
            Explore more →
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 lg:gap-6">
          {[
            { title: "Daily Mix 1", desc: "Afrobeats & more", seed: "mix1" },
            { title: "Chill Vibes", desc: "Relax and unwind", seed: "chill" },
            { title: "Workout Hits", desc: "Keep the energy up", seed: "gym" },
            { title: "Focus Flow", desc: "Deep work beats", seed: "focus" },
            { title: "Party Time", desc: "Weekend ready", seed: "party" },
          ].map((playlist) => (
            <div
              key={playlist.title}
              onClick={requireAuth}
              className="group cursor-pointer"
            >
              <div className="relative aspect-square mb-3 lg:mb-4 overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src={`https://picsum.photos/seed/${playlist.seed}/400/400`}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
                  alt={playlist.title}
                />

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform">
                    <Play className="w-6 h-6 text-white fill-current ml-1" />
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-white truncate text-sm lg:text-base">
                {playlist.title}
              </h3>

              <p className="text-zinc-500 text-xs lg:text-sm truncate">
                {playlist.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}