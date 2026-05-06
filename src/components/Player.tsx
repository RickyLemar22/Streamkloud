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
} from "lucide-react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { Slider } from "./ui/slider";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ScrollArea } from "./ui/scroll-area";

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
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showLyrics, setShowLyrics] = useState(false);

  const isLiked = currentSong ? likedSongs.includes(currentSong.id) : false;

  const clampVolume = (value: unknown) => {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue)) {
      return 0.8;
    }

    return Math.min(1, Math.max(0, numericValue));
  };

  const safeVolume = clampVolume(volume);

  const handleVolumeChange = (val: number[]) => {
    const rawValue = Array.isArray(val) ? val[0] : val;
    const sliderValue = Number(rawValue);

    if (!Number.isFinite(sliderValue)) {
      return;
    }

    const nextVolume = clampVolume(sliderValue / 100);

    setVolume(nextVolume);

    if (audioRef.current) {
      audioRef.current.volume = nextVolume;
    }
  };

  useEffect(() => {
    if (currentSong) {
      const recentlyPlayed = JSON.parse(
        localStorage.getItem("recentlyPlayed") || "[]",
      );
      const updatedRecent = [
        currentSong,
        ...recentlyPlayed.filter((s: any) => s.id !== currentSong.id),
      ].slice(0, 10); // Keep last 10
      localStorage.setItem("recentlyPlayed", JSON.stringify(updatedRecent));
      // Dispatch custom event to notify Home page
      window.dispatchEvent(new Event("recentlyPlayedUpdated"));
    }
  }, [currentSong]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentSong) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Playback failed:", error);
            // Don't immediately set to false if it's just a loading issue
            if (error.name !== "AbortError") {
              setIsPlaying(false);
            }
          });
        }
      } else {
        audioRef.current.pause();
      }
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
    if (audioRef.current) {
      const t = audioRef.current.currentTime;
      if (Number.isFinite(t)) {
        setProgress(t);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const d = audioRef.current.duration;
      if (Number.isFinite(d)) {
        setDuration(d);
      }
    }
  };

  const handleSeek = (val: number[]) => {
    const time = val[0];
    if (audioRef.current && Number.isFinite(time)) {
      audioRef.current.currentTime = time;
      setProgress(time);
    }
  };

  const formatTime = (time: number) => {
    if (!Number.isFinite(time) || time < 0) {
      return "0:00";
    }

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

  return (
    <>
      {/* Lyrics Overlay */}
      {showLyrics && currentSong && (
        <div className="fixed inset-0 bg-zinc-950/95 backdrop-blur-3xl z-40 flex flex-col items-center justify-center p-8 lg:p-20 overflow-y-auto animate-in fade-in zoom-in duration-300">
          <button
            onClick={() => setShowLyrics(false)}
            className="absolute top-8 right-8 text-zinc-400 hover:text-white transition-colors"
          >
            <Mic2 className="w-8 h-8 text-orange-500" />
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

      <div className="fixed bottom-20 lg:bottom-8 left-0 lg:left-1/2 lg:-translate-x-1/2 w-full lg:max-w-5xl px-0 lg:px-4 z-50">
        <div className="bg-zinc-900/95 lg:bg-zinc-900/90 backdrop-blur-xl border-t lg:border border-zinc-800/50 lg:rounded-3xl p-3 lg:p-4 flex items-center justify-between shadow-2xl shadow-black/50 overflow-hidden relative group">
          {/* Progress Bar Background */}
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

          {/* Song Info / Mobile Now Playing */}
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
                onClick={() => toggleLike(currentSong.id)}
                className={cn(
                  "ml-2 transition-colors",
                  isLiked
                    ? "text-orange-500"
                    : "text-zinc-500 hover:text-zinc-300",
                )}
              >
                <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-x-2 sm:gap-x-3 lg:gap-x-6 px-2 lg:px-4">
            <button
              onClick={toggleShuffle}
              disabled={!currentSong}
              className={cn(
                "hidden sm:block transition-colors",
                isShuffled
                  ? "text-orange-500"
                  : "text-zinc-500 hover:text-zinc-300",
                !currentSong && "opacity-50 cursor-not-allowed",
              )}
            >
              <Shuffle className="w-4 h-4 lg:w-5 lg:h-5" />
            </button>

            <button
              onClick={handlePrevious}
              disabled={!currentSong}
              className={cn(
                "text-zinc-400 hover:text-white transition-colors",
                !currentSong && "opacity-50 cursor-not-allowed",
              )}
            >
              <SkipBack className="w-5 h-5 lg:w-7 lg:h-7 fill-current" />
            </button>

            <button
              onClick={() => currentSong && setIsPlaying(!isPlaying)}
              disabled={!currentSong}
              className={cn(
                "w-10 h-10 lg:w-14 lg:h-14 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shrink-0",
                !currentSong && "opacity-50 cursor-not-allowed",
              )}
            >
              {isPlaying && currentSong ? (
                <Pause className="w-5 h-5 lg:w-7 lg:h-7 fill-black" />
              ) : (
                <Play className="w-5 h-5 lg:w-7 lg:h-7 fill-black ml-0.5 lg:ml-1" />
              )}
            </button>

            <button
              onClick={playNext}
              disabled={!currentSong}
              className={cn(
                "text-zinc-400 hover:text-white transition-colors",
                !currentSong && "opacity-50 cursor-not-allowed",
              )}
            >
              <SkipForward className="w-5 h-5 lg:w-7 lg:h-7 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              disabled={!currentSong}
              className={cn(
                "hidden lg:block transition-colors",
                repeatMode !== "none"
                  ? "text-orange-500"
                  : "text-zinc-500 hover:text-zinc-300",
                !currentSong && "opacity-50 cursor-not-allowed",
              )}
            >
              {repeatMode === "one" ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Extra Controls */}
          <div className="hidden lg:flex items-center gap-x-6 w-1/4 justify-end">
            <button
              onClick={() => setShowLyrics(!showLyrics)}
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

            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={queue.length === 0}
                className={cn(
                  "text-zinc-400 hover:text-white transition-colors",
                  queue.length === 0 && "opacity-50 cursor-not-allowed",
                )}
              >
                <ListMusic className="w-6 h-6" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 bg-zinc-900 border-zinc-800 p-0 overflow-hidden"
              >
                <DropdownMenuLabel className="p-4 border-b border-zinc-800 bg-zinc-900/50">
                  <h3 className="font-bold text-white">Queue</h3>
                  <p className="text-xs text-zinc-500">{queue.length} songs</p>
                </DropdownMenuLabel>
                <ScrollArea className="h-80">
                  <div className="p-2 space-y-1">
                    {queue.map((song, idx) => (
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
                          onClick={() => setCurrentSong(song)}
                          className="flex-1 flex items-center gap-x-3 min-w-0"
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
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromQueue(song.id);
                            }}
                            className="p-1.5 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>

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
          src={currentSong?.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={playNext}
          onError={(e) => {
            // Use a simple log instead of logging the entire event object which can cause circular structure errors
            console.error("Audio element error occurred");
            if (currentSong) {
              console.warn(`Failed to load song: ${currentSong.title}`);
            }
          }}
        />
      </div>
    </>
  );
}
