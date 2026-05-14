import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthModal } from '@/store/useAuthModal';
import { API_BASE_URL } from '@/lib/apiConfig';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

import {
  Upload as UploadIcon,
  Music,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type StoredUser = {
  id?: string | number;
  _id?: string | number;
  name?: string;
  email?: string;
};

const getStoredUser = (): StoredUser | null => {
  try {
    const admin = localStorage.getItem('admin');
    const user = localStorage.getItem('user');
    return admin ? JSON.parse(admin) : user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export function Upload() {
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { open } = useAuthModal();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      setUser(getStoredUser());
      setLoading(false);
    };

    syncAuth();
    window.addEventListener('auth-change', syncAuth);
    window.addEventListener('storage', syncAuth);

    return () => {
      window.removeEventListener('auth-change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const getAudioDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const audio = new Audio();
      const objectUrl = URL.createObjectURL(file);

      audio.src = objectUrl;

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(audio.duration || 0);
      };

      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(0);
      };
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('Please log in before uploading songs.');
      return;
    }

    if (!audioFile || !title.trim() || !artist.trim()) {
      setError('Please fill in the song title, artist, and audio file.');
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      setError('No backend token found. Please log in again.');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(10);

    try {
      const duration = await getAudioDuration(audioFile);
      setProgress(35);

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('artist', artist.trim());
      formData.append('album', album.trim());
      formData.append('genre', genre.trim() || 'Unknown');
      formData.append('duration', String(duration || 0));
      formData.append('audio', audioFile);

      if (coverFile) {
        formData.append('coverImage', coverFile);
      }

      setProgress(60);

      const response = await fetch(`${API_BASE_URL}/songs/upload-song`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upload song.');
      }

      console.log('Song uploaded successfully:', data);

      setProgress(100);
      setSuccess(true);
      setUploading(false);

      setTitle('');
      setArtist('');
      setAlbum('');
      setGenre('');
      setAudioFile(null);
      setCoverFile(null);

      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An unexpected error occurred during upload.');
      setUploading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-y-4 p-8 text-white">
        <p className="text-xl font-medium">Please log in to upload songs.</p>

        <Button
          className="bg-orange-500 px-8 font-bold text-black hover:bg-orange-400"
          onClick={() => open('login')}
        >
          Log in
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-4 pb-40 lg:p-8 lg:pb-32">
      <div className="mx-auto max-w-2xl">
        <Card className="border-zinc-800 bg-zinc-900 text-white">
          <CardHeader className="p-4 lg:p-6">
            <CardTitle className="flex items-center gap-x-2 text-xl lg:text-2xl">
              <UploadIcon className="h-5 w-5 text-orange-500 lg:h-6 lg:w-6" />
              Upload New Song
            </CardTitle>

            <CardDescription className="text-xs text-zinc-400 lg:text-sm">
              Upload your music to StreamKloud using local backend storage.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 lg:p-6">
            {success ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle2 className="mb-4 h-16 w-16 text-green-500" />
                <h3 className="text-xl font-bold">Upload Successful!</h3>
                <p className="mt-2 text-zinc-400">
                  Your song has been added to the library. Redirecting...
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleUpload}
                className="space-y-6"
                method="POST"
                encType="multipart/form-data"
              >
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Song Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g. Gundi"
                      className="border-zinc-700 bg-zinc-800"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="artist">Artist *</Label>
                    <Input
                      id="artist"
                      placeholder="e.g. A Pass"
                      className="border-zinc-700 bg-zinc-800"
                      value={artist}
                      onChange={(e) => setArtist(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="album">Album</Label>
                    <Input
                      id="album"
                      placeholder="Optional album name"
                      className="border-zinc-700 bg-zinc-800"
                      value={album}
                      onChange={(e) => setAlbum(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Input
                      id="genre"
                      placeholder="e.g. Dancehall"
                      className="border-zinc-700 bg-zinc-800"
                      value={genre}
                      onChange={(e) => setGenre(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="audio" className="flex items-center gap-x-2">
                      <Music className="h-4 w-4" />
                      Audio File MP3/WAV *
                    </Label>

                    <Input
                      id="audio"
                      type="file"
                      accept="audio/*,.mp3,.wav"
                      className="cursor-pointer border-zinc-700 bg-zinc-800"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                      required
                    />

                    {audioFile && (
                      <p className="text-xs text-zinc-400">
                        Selected audio: {audioFile.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cover" className="flex items-center gap-x-2">
                      <ImageIcon className="h-4 w-4" />
                      Cover Image Optional
                    </Label>

                    <Input
                      id="cover"
                      type="file"
                      accept="image/*"
                      className="cursor-pointer border-zinc-700 bg-zinc-800"
                      onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    />

                    {coverFile && (
                      <p className="text-xs text-zinc-400">
                        Selected cover: {coverFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-zinc-400">
                      <span>Uploading...</span>
                      <span>{Math.round(progress)}%</span>
                    </div>

                    <Progress value={progress} className="h-2 bg-zinc-800" />
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-x-2 rounded-md border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-orange-500 py-6 font-bold text-black hover:bg-orange-400"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Song'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Upload;
