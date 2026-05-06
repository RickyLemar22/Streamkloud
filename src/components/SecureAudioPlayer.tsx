import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

type SecureAudioPlayerProps = {
  songId: number;
  className?: string;
};

export default function SecureAudioPlayer({
  songId,
  className = '',
}: SecureAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const audio = audioRef.current;
    const token = localStorage.getItem('token');

    setError('');

    if (!audio) return;

    if (!token) {
      setError('Please log in to play this song.');
      return;
    }

    const streamUrl = `/api/songs/stream/${songId}/master.m3u8`;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        xhrSetup: (xhr) => {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        },
      });

      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error('[HLS ERROR]', data);

        if (data.response?.code === 403) {
          setError('Active subscription required to play this song.');
        } else if (data.response?.code === 401) {
          setError('Please log in again to play this song.');
        } else if (data.fatal) {
          setError('Unable to load protected stream.');
        }
      });

      hls.loadSource(streamUrl);
      hls.attachMedia(audio);
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      audio.src = streamUrl;
    } else {
      setError('Your browser does not support secure HLS playback.');
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [songId]);

  return (
    <div className={`w-full ${className}`}>
      <audio
        ref={audioRef}
        controls
        controlsList="nodownload"
        className="w-full"
      />

      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}