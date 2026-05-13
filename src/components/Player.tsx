import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  ListMusic,
  Repeat1,
  Music,
  Heart,
  Mic2,
  Trash2,
  X,
} from "lucide-react";
import Hls from "hls.js";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Slider } from "./ui/slider";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { ScrollArea } from "./ui/scroll-area";
import { useAuthModal } from "@/store/useAuthModal";
import { API_BASE_URL, BACKEND_BASE_URL } from "@/lib/apiConfig";

export function Player() {
  const {
    currentSong,
    isPlaying,
    setIsPlaying,
    volume,
    setVolume,
    playNext,
    playPrevious,
    isShuffled,
    repeatMode,
    toggleShuffle,
    toggleRepeat,
    queue,
    setCurrentSong,
    likedSongs,
    toggleLike,
    removeFromQueue,
  } = usePlayerStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  const { open } = useAuthModal();

  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    BACKEND_BASE_URL;

  const getToken = () => localStorage.getItem("token") || "";

  const isLocalSong = (song?: any) => {
    return Boolean(song?.id?.toString().startsWith("local-"));
  };

  const toAbsoluteUrl = (url?: string) => {
    if (!url) return "";

    if (
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("blob:")
    ) {
      return url;
    }

    return `${API_BASE_URL}${url.startsWith("/") ? url : `/${url}`}`;
  };

  const getPlaybackUrl = (song: any) => {
    if (!song) return "";

    if (isLocalSong(song)) {
      return toAbsoluteUrl(song.audioUrl || song.url || song.file_url);
    }

    const rawUrl =
      song.audioUrl ||
      song.url ||
      song.file_url ||
      `/api/songs/stream/${song.id}/master.m3u8`;

    const absoluteUrl = toAbsoluteUrl(rawUrl);

    if (!absoluteUrl.includes(".m3u8")) {
      return absoluteUrl;
    }

    const token = getToken();
    const separator = absoluteUrl.includes("?") ? "&" : "?";

    return token
      ? `${absoluteUrl}${separator}token=${encodeURIComponent(token)}`
      : absoluteUrl;
  };

  const stopPlaybackCompletely = () => {
    setIsPlaying(false);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }

    setProgress(0);
    setDuration(0);
    setCurrentSong(null);
    setQueueOpen(false);
  };

  const requireAuthForSong = (song?: any) => {
    if (!song) return false;

    if (isLocalSong(song)) return true;

    const token = getToken();

    if (!token) {
      stopPlaybackCompletely();
      open("login");
      return false;
    }

    return true;
  };

  const isLiked = currentSong ? likedSongs.includes(currentSong.id) : false;

  const clampVolume = (value: unknown) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 0.8;
    return Math.min(1, Math.max(0, numericValue));
  };

  const safeVolume = clampVolume(volume);

  const handleVolumeChange = (val: number[]) => {
    const rawValue = Array.isArray(val) ? val[0] : val;
    const sliderValue = Number(rawValue);

    if (!Number.isFinite(sliderValue)) return;

    const nextVolume = clampVolume(sliderValue / 100);
    setVolume(nextVolume);

    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }
  };

  useEffect(() => {
    const stopOnLogout = () => {
      const token = getToken();

      if (!token) {
        stopPlaybackCompletely();
      }
    };

    window.addEventListener("auth-change", stopOnLogout);
    window.addEventListener("authUpdated", stopOnLogout);
    window.addEventListener("storage", stopOnLogout);

    return () => {
      window.removeEventListener("auth-change", stopOnLogout);
      window.removeEventListener("authUpdated", stopOnLogout);
      window.removeEventListener("storage", stopOnLogout);
    };
  }, []);

  useEffect(() => {
    if (!currentSong) return;

    const recentlyPlayed = JSON.parse(
      localStorage.getItem("recentlyPlayed") || "[]",
    );

    const updatedRecent = [
      currentSong,
      ...recentlyPlayed.filter((s: any) => s.id !== currentSong.id),
    ].slice(0, 10);

    localStorage.setItem("recentlyPlayed", JSON.stringify(updatedRecent));
    window.dispatchEvent(new Event("recentlyPlayedUpdated"));
  }, [currentSong]);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    audio.removeAttribute("src");
    audio.load();
    setProgress(0);
    setDuration(0);

    if (!currentSong) return;

    if (!requireAuthForSong(currentSong)) return;

    const playbackUrl = getPlaybackUrl(currentSong);

    if (!playbackUrl) return;

    const isHlsStream = playbackUrl.includes(".m3u8");

    if (isHlsStream && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        xhrSetup: (xhr) => {
          const token = getToken();

          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }
        },
      });

      hlsRef.current = hls;
      hls.loadSource(playbackUrl);
      hls.attachMedia(audio);

      hls.on(Hls.Events.ERROR, (_event, data) => {
        console.error("HLS playback error:", data);

        if (data.fatal) {
          setIsPlaying(false);
        }
      });
    } else if (isHlsStream && audio.canPlayType("application/vnd.apple.mpegurl")) {
      audio.src = playbackUrl;
      audio.load();
    } else {
      audio.src = playbackUrl;
      audio.load();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [currentSong?.id]);

  useEffect(() => {
    if (!audioRef.current) return;

    if (isPlaying && currentSong) {
      if (!requireAuthForSong(currentSong)) return;

      const playPromise = audioRef.current.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Playback failed:", error);

          if (error.name !== "AbortError") {
            setIsPlaying(false);
          }
        });
      }
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong, setIsPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = safeVolume;
    }

    if (safeVolume !== volume) {
      setVolume(safeVolume);
    }
  }, [safeVolume, volume, setVolume]);

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;

    const t = audioRef.current.currentTime;
    if (Number.isFinite(t)) setProgress(t);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;

    const d = audioRef.current.duration;
    if (Number.isFinite(d)) setDuration(d);
  };

  const handleSeek = (val: number[]) => {
    const time = val[0];

    if (audioRef.current && Number.isFinite(time)) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) return "0:00";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handlePrevious = () => {
    if (
      audioRef.current &&
      Number.isFinite(audioRef.current.currentTime) &&
      audioRef.current.currentTime > 3
    ) {
      audioRef.current.currentTime = 0;
      setProgress(0);
    } else {
      playPrevious();
    }
  };

  const handleQueueSongClick = (song: any) => {
    if (!requireAuthForSong(song)) return;
    setCurrentSong(song);
    setIsPlaying(true);
    setQueueOpen(false);
  };

  return (
    <>
      {showLyrics && currentSong && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-3xl z-[100] flex flex-col items-center justify-center p-8 lg:p-20 overflow-y-auto animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => setShowLyrics(false)}
            className="absolute top-8 right-8 text-zinc-400 hover:text-white transition-colors"
            title="Close lyrics"
          >
            <X className="w-8 h-8 text-orange-500" />
          </button>

          <div className="max-w-3xl w-full flex flex-col lg:flex-row gap-12 items-center lg:items-start">
            <div className="w-64 h-64 lg:w-96 lg:h-96 shrink-0 shadow-2xl rounded-2xl overflow-hidden">
              <img
                src={
                  currentSong.coverUrl ||
                  "https://picsum.photos/seed/song/200/200"
                }
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                alt={currentSong.title}
              />
            </div>

            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-4xl lg:text-6xl font-black text-white mb-4">
                {currentSong.title}
              </h2>

              <p className="text-xl lg:text-2xl text-zinc-400 mb-12">
                {currentSong.artist}
              </p>

              <div className="space-y-6 text-2xl lg:text-4xl font-bold text-zinc-300/40">
                {currentSong.lyrics ? (
                  currentSong.lyrics.split("\n").map((line, i) => (
                    <p
                      key={i}
                      className="hover:text-white transition-colors cursor-default"
                    >
                      {line}
                    </p>
                  ))
                ) : (
                  <p className="italic">Lyrics not available for this track.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {queueOpen && (
        <button
          type="button"
          onClick={() => setQueueOpen(false)}
          className="fixed inset-0 bg-black/20 z-[70]"
          aria-label="Close queue"
        />
      )}

      {queueOpen && (
        <div className="fixed right-4 bottom-28 w-80 max-w-[calc(100vw-2rem)] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl z-[90] overflow-hidden">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">Queue</h3>
              <p className="text-xs text-zinc-500">
                {queue.length} {queue.length === 1 ? "song" : "songs"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setQueueOpen(false)}
              className="text-zinc-500 hover:text-white transition-colors"
              title="Close queue"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <ScrollArea className="h-80">
            <div className="p-2 space-y-1">
              {queue.length === 0 ? (
                <div className="p-6 text-center">
                  <ListMusic className="w-10 h-10 mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm font-semibold text-zinc-300">
                    Queue is empty
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Play or add songs to see them here.
                  </p>
                </div>
              ) : (
                queue.map((song, idx) => (
                  <div
                    key={`${song.id}-${idx}`}
                    className={cn(
                      "w-full flex items-center gap-x-3 p-2 rounded-lg transition-colors text-left group",
                      currentSong?.id === song.id
                        ? "bg-orange-500/10 text-orange-500"
                        : "hover:bg-zinc-800 text-zinc-400 hover:text-white",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleQueueSongClick(song)}
                      className="flex-1 flex items-center gap-x-3 min-w-0 text-left"
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

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">
                          {song.title}
                        </p>
                        <p className="text-xs opacity-60 truncate">
                          {song.artist}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-x-2">
                      {currentSong?.id === song.id && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(song.id);
                        }}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      )}

      <div className="fixed bottom-20 lg:bottom-8 left-0 lg:left-1/2 lg:-translate-x-1/2 w-full lg:max-w-5xl px-0 lg:px-4 z-50">
        <div className="bg-zinc-900/95 lg:bg-zinc-900/90 backdrop-blur-xl border-t lg:border border-zinc-800/50 lg:rounded-3xl p-3 lg:p-4 flex items-center justify-between shadow-2xl shadow-black/50 overflow-hidden relative group">
          <div className="absolute top-0 left-0 w-full h-1 lg:h-1.5 group/progress">
            <Slider
              value={[Number.isFinite(progress) ? progress : 0]}
              max={Number.isFinite(duration) && duration > 0 ? duration : 100}
              step={0.1}
              onValueChange={handleSeek}
              disabled={!currentSong}
              className="w-full absolute top-0 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-x-3 lg:gap-x-4 w-full lg:w-1/4 min-w-0">
            <div className="relative w-12 h-12 lg:w-14 lg:h-14 shrink-0 overflow-hidden rounded-lg lg:rounded-xl shadow-lg bg-zinc-800 flex items-center justify-center">
              {currentSong ? (
                <img
                  src={
                    currentSong.coverUrl ||
                    "https://picsum.photos/seed/song/200/200"
                  }
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <Music className="w-6 h-6 text-zinc-600" />
              )}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <div className="lg:hidden text-xs font-bold text-orange-500 uppercase tracking-wider mb-0.5">
                Now Playing
              </div>

              <span className="text-white font-bold truncate text-sm lg:text-base">
                {currentSong ? currentSong.title : "None"}
              </span>

              <div className="flex items-center gap-x-2 truncate">
                {currentSong ? (
                  <>
                    <Link
                      to={`/artist/${currentSong.artist}`}
                      className="text-zinc-400 text-xs lg:text-sm hover:text-orange-500 transition-colors truncate"
                    >
                      {currentSong.artist}
                    </Link>

                    {currentSong.album && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <Link
                          to={`/album/${currentSong.album}`}
                          className="text-zinc-500 text-xs lg:text-sm hover:text-zinc-300 transition-colors truncate"
                        >
                          {currentSong.album}
                        </Link>
                      </>
                    )}
                  </>
                ) : (
                  <span className="text-zinc-400 text-xs lg:text-sm truncate">
                    Select a song to play
                  </span>
                )}
              </div>
            </div>

            {currentSong && (
              <button
                type="button"
                onClick={() => toggleLike(currentSong.id)}
                className={cn(
                  "ml-2 transition-colors",
                  isLiked
                    ? "text-orange-500"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
                title={isLiked ? "Unlike song" : "Like song"}
              >
                <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-x-2 sm:gap-x-3 lg:gap-x-6 px-2 lg:px-4">
            <button
              type="button"
              onClick={toggleShuffle}
              disabled={!currentSong}
              className={cn(
                "hidden sm:block transition-colors",
                isShuffled
                  ? "text-orange-500"
                  : "text-zinc-500 hover:text-zinc-300",
                !currentSong && "opacity-50 cursor-not-allowed",
              )}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>

            <button
              type="button"
              onClick={handlePrevious}
              disabled={!currentSong}
              className={cn(
                "text-zinc-400 hover:text-white transition-colors",
                !currentSong && "opacity-50 cursor-not-allowed",
              )}
              title="Previous"
            >
              <SkipBack className="w-5 h-5 lg:w-7 lg:h-7 fill-current" />
            </button>

            <button
              type="button"
              onClick={() => {
                if (!currentSong) return;
                if (!requireAuthForSong(currentSong)) return;
                setIsPlaying(!isPlaying);
              }}
              disabled={!currentSong}
              className={cn(
                "w-10 h-10 lg:w-14 lg:h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shrink-0",
                !currentSong && "opacity-50 cursor-not-allowed",
              )}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying && currentSong ? (
                <Pause className="w-5 h-5 lg:w-7 lg:h-7 fill-black" />
              ) : (
                <Play className="w-5 h-5 lg:w-7 lg:h-7 fill-black ml-0.5 lg:ml-1" />
              )}
            </button>

            <button
              type="button"
              onClick={playNext}
              disabled={!currentSong}
              className={cn(
                "text-zinc-400 hover:text-white transition-colors",
                !currentSong && "opacity-50 cursor-not-allowed",
              )}
              title="Next"
            >
              <SkipForward className="w-5 h-5 lg:w-7 lg:h-7 fill-current" />
            </button>

            <button
              type="button"
              onClick={toggleRepeat}
              disabled={!currentSong}
              className={cn(
                "hidden lg:block transition-colors",
                repeatMode !== "none"
                  ? "text-orange-500"
                  : "text-zinc-500 hover:text-zinc-300",
                !currentSong && "opacity-50 cursor-not-allowed",
              )}
              title="Repeat"
            >
              {repeatMode === "one" ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-x-6 w-1/4 justify-end">
            <button
              type="button"
              onClick={() => setShowLyrics(true)}
              disabled={!currentSong}
              className={cn(
                "transition-colors",
                showLyrics
                  ? "text-orange-500"
                  : "text-zinc-500 hover:text-zinc-300",
                !currentSong && "opacity-50 cursor-not-allowed",
              )}
              title="Lyrics"
            >
              <Mic2 className="w-5 h-5" />
            </button>

            <div className="hidden xl:flex items-center gap-x-2 text-zinc-500 text-xs font-mono">
              <span>{formatTime(progress)}</span>
              <span>/</span>
              <span>{formatTime(currentSong?.duration || duration)}</span>
            </div>

            <button
              type="button"
              onClick={() => setQueueOpen((prev) => !prev)}
              className={cn(
                "text-zinc-400 hover:text-white transition-colors relative",
                queueOpen && "text-orange-500",
              )}
              title="Open queue"
            >
              <ListMusic className="w-6 h-6" />

              {queue.length > 0 && (
                <span className="absolute -top-2 -right-2 min-w-4 h-4 px-1 rounded-full bg-orange-500 text-black text-[10px] font-bold flex items-center justify-center">
                  {queue.length}
                </span>
              )}
            </button>

            <div className="hidden md:flex items-center gap-x-3 w-32">
              <Volume2 className="w-5 h-5 text-zinc-400" />
              <Slider
                value={[safeVolume * 100]}
                max={100}
                step={1}
                onValueChange={handleVolumeChange}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <audio
          key={currentSong?.id || "none"}
          ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={playNext}
          onError={() => {
            console.error("Audio element error occurred");

            if (currentSong) {
              console.warn(`Failed to load song: ${currentSong.title}`);
            }

            setIsPlaying(false);
          }}
        />
      </div>
    </>
  );
}
