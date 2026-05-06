import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Song, Artist } from "@/types";
import { SongCard } from "@/components/SongCard";
import { Button } from "@/components/ui/button";
import { usePlayerStore } from "@/store/usePlayerStore";
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

const CATEGORIES = [
  { icon: Flame, label: "Trending", path: "/" },
  { icon: BarChart3, label: "Charts", path: "/search" },
  { icon: Music, label: "Afrobeats", path: "/genre/Afrobeats" },
  { icon: Headphones, label: "Amapiano", path: "/genre/Amapiano" },
  { icon: Folder, label: "Local Media", path: "local" },
  { icon: Globe, label: "Global Hits", path: "/search" },
];

export function Home() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState<Song[]>([]);
  const {
    setQueue,
    setCurrentSong,
    addToQueue,
    currentSong,
    isPlaying,
    setIsPlaying,
  } = usePlayerStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Test health check first
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
          id: s._id,
          ...s,
          audioUrl: s.url,
          coverUrl: s.coverImage,
        }));
        setSongs(fetchedSongs);
        setArtists(artistsData.map((a: any) => ({ id: a._id, ...a })));

        if (fetchedSongs.length > 0) setQueue(fetchedSongs);
      } catch (error) {
        console.error("Error fetching home data:", error);
      }
    };

    fetchData();
  }, [setQueue]);

  useEffect(() => {
    const loadRecentlyPlayed = () => {
      const recent = JSON.parse(localStorage.getItem("recentlyPlayed") || "[]");
      setRecentlyPlayed(recent.slice(0, 5));
    };

    loadRecentlyPlayed();
    window.addEventListener("recentlyPlayedUpdated", loadRecentlyPlayed);
    return () =>
      window.removeEventListener("recentlyPlayedUpdated", loadRecentlyPlayed);
  }, []);

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
        localSongs.forEach((song) => addToQueue(song));
      }
    };
    input.click();
  };

  const handlePlaySong = (song: Song) => {
    if (currentSong?.id === song.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentSong(song);
    }
  };

  const isAuthenticated = Boolean(localStorage.getItem("token"));
  const recentlyReleased = songs.slice(0, 6);
  const resumeListeningSongs = isAuthenticated
    ? recentlyPlayed.filter(Boolean).slice(0, 6)
    : [];

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
            <SongCard key={`${title}-${song.id}`} song={song} />
          ))}
        </div>
      </section>
    );
  };

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

      {/* Resume Listening */}
      <SongSection
        title="Resume Listening"
        songsList={recentlyPlayed}
        subtitle="Pick up right where you left off"
      />

      {/* Featured Songs */}
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
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-zinc-900/20 rounded-2xl border border-dashed border-zinc-800">
            <Music className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-500">No featured songs available yet.</p>
          </div>
        )}
      </section>

      {/* Artists */}
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
            {artists.map((artist) => (
              <div
                key={artist.id}
                className="group cursor-pointer text-center"
                onClick={() => navigate(`/artist/${artist.name}`)}
              >
                <div className="relative aspect-square mb-3 lg:mb-4 overflow-hidden rounded-full shadow-2xl border-4 border-zinc-900/50 group-hover:border-orange-500/50 transition-all">
                  {artist.imageUrl ? (
                    <img
                      src={
                        artist.imageUrl ||
                        "https://picsum.photos/seed/artist/200/200"
                      }
                      alt={artist.name}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
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

      {/* Crafted for you */}
      <SongSection
        title="Crafted for you"
        songsList={songs.slice().reverse().slice(0, 6)}
        subtitle="Personalized picks based on your taste"
      />

      {/* Fresh releases */}
      <SongSection
        title="Fresh releases"
        songsList={songs.slice(0, 6)}
        subtitle="The latest tracks hitting the scene"
      />

      {/* Classic oldies */}
      <SongSection
        title="Classic oldies"
        songsList={songs.length > 10 ? songs.slice(10, 16) : songs.slice(0, 3)}
        subtitle="Timeless hits that never go out of style"
      />

      {/* Moods */}
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
                      src={song.coverUrl}
                      className="w-10 h-10 rounded object-cover"
                      referrerPolicy="no-referrer"
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

      {/* Create a mix */}
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
                  src={song.coverUrl}
                  className="aspect-square rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Playlists for you */}
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
            <div key={playlist.title} className="group cursor-pointer">
              <div className="relative aspect-square mb-3 lg:mb-4 overflow-hidden rounded-2xl shadow-2xl">
                <img
                  src={`https://picsum.photos/seed/${playlist.seed}/400/400`}
                  className="w-full h-full object-cover transition duration-500 group-hover:scale-110"
                  referrerPolicy="no-referrer"
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
