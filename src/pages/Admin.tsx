import React, { useEffect, useState } from 'react';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../components/ui/card';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui/tabs';

import {
  Music,
  Users,
  Disc3,
  Upload,
  AlertCircle,
  CheckCircle2,
  Trash2,
  RefreshCw,
  UserCircle,
  LogOut,
  PlusCircle,
} from 'lucide-react';

type Song = {
  id: string | number;
  title: string;
  artist?: string;
  album?: string;
  genre?: string;
  file_url?: string;
  url?: string;
  coverImage?: string;
  cover_image?: string;
  duration?: number;
};

type Artist = {
  id: string | number;
  name: string;
  bio?: string;
  imageUrl?: string;
  profile_image?: string;
};

type Album = {
  id: string | number;
  title: string;
  artist?: string;
  artist_id?: number;
  release_date?: string;
};

type AppUser = {
  id: string | number;
  firebase_uid?: string | null;
  name: string;
  email: string;
  created_at?: string;
};

const getSafeId = (item: any, fallback: string) => {
  return item?.id ?? item?._id ?? fallback;
};

const Admin = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [album, setAlbum] = useState('');
  const [genre, setGenre] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistBio, setNewArtistBio] = useState('');
  const [newArtistImageUrl, setNewArtistImageUrl] = useState('');

  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumArtistId, setNewAlbumArtistId] = useState('');
  const [newAlbumReleaseDate, setNewAlbumReleaseDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingArtist, setCreatingArtist] = useState(false);
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const token = localStorage.getItem('token');
  const storedAdmin = localStorage.getItem('admin');

  let parsedAdmin: any = null;

  try {
    parsedAdmin = storedAdmin ? JSON.parse(storedAdmin) : null;
  } catch {
    parsedAdmin = null;
  }

  const isAdmin =
    !!token &&
    !!parsedAdmin &&
    ['super_admin', 'content_manager'].includes(parsedAdmin.role);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const jsonAuthHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

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

  const startUploadProgress = () => {
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    let progress = 0;

    const interval = setInterval(() => {
      progress += 1;
      setUploadProgress(progress);

      if (progress < 30) {
        setUploadStatus('Preparing files...');
      } else if (progress < 70) {
        setUploadStatus('Uploading song...');
      } else if (progress < 95) {
        setUploadStatus('Saving song details...');
      }

      if (progress >= 95) {
        clearInterval(interval);
      }
    }, 30);

    return interval;
  };

  const fetchSongs = async () => {
    const response = await fetch('/api/songs');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch songs.');
    }

    setSongs(
      data.map((s: any, index: number) => ({
        id: getSafeId(s, `song-${index}`),
        ...s,
        url: s.url || s.file_url,
        coverImage: s.coverImage || s.cover_image,
      }))
    );
  };

  const fetchArtists = async () => {
    const response = await fetch('/api/artists');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch artists.');
    }

    setArtists(
      data.map((a: any, index: number) => ({
        id: getSafeId(a, `artist-${index}`),
        ...a,
        imageUrl: a.imageUrl || a.profile_image,
      }))
    );
  };

  const fetchAlbums = async () => {
    const response = await fetch('/api/albums');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch albums.');
    }

    setAlbums(
      data.map((a: any, index: number) => ({
        id: getSafeId(a, `album-${index}`),
        ...a,
      }))
    );
  };

  const fetchUsers = async () => {
    const response = await fetch('/api/users', {
      headers: authHeaders,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch users.');
    }

    setUsers(
      data.map((u: any, index: number) => ({
        id: getSafeId(u, `user-${index}`),
        ...u,
      }))
    );
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');

      await Promise.all([
        fetchSongs(),
        fetchArtists(),
        fetchAlbums(),
        fetchUsers(),
      ]);
    } catch (err) {
      console.error('Admin fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAll();
    }
  }, [isAdmin]);

  const handleUploadSong = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('No admin token found. Please login as admin again.');
      return;
    }

    if (!title.trim() || !artist.trim() || !audioFile) {
      setError('Title, artist, and audio file are required.');
      return;
    }

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      setUploading(true);
      setError('');
      setSuccess('');
      setUploadProgress(0);
      setUploadStatus('Starting upload...');

      progressInterval = startUploadProgress();

      const duration = await getAudioDuration(audioFile);

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

      const response = await fetch('/api/songs/upload-song', {
        method: 'POST',
        headers: authHeaders,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Song upload failed.');
      }

      if (progressInterval) clearInterval(progressInterval);

      setUploadProgress(100);
      setUploadStatus('Done!');
      setSuccess('Song uploaded successfully.');

      setTitle('');
      setArtist('');
      setAlbum('');
      setGenre('');
      setAudioFile(null);
      setCoverFile(null);

      await fetchAll();
      setActiveTab('songs');
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);

      setUploadProgress(0);
      setUploadStatus('Upload failed.');

      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateArtist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newArtistName.trim()) {
      setError('Artist name is required.');
      return;
    }

    try {
      setCreatingArtist(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: jsonAuthHeaders,
        body: JSON.stringify({
          name: newArtistName.trim(),
          bio: newArtistBio.trim(),
          imageUrl: newArtistImageUrl.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create artist.');
      }

      setSuccess('Artist added successfully.');
      setNewArtistName('');
      setNewArtistBio('');
      setNewArtistImageUrl('');

      await fetchArtists();
      setActiveTab('artists');
    } catch (err) {
      console.error('Create artist error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create artist.');
    } finally {
      setCreatingArtist(false);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newAlbumTitle.trim() || !newAlbumArtistId) {
      setError('Album title and artist are required.');
      return;
    }

    try {
      setCreatingAlbum(true);
      setError('');
      setSuccess('');

      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: jsonAuthHeaders,
        body: JSON.stringify({
          title: newAlbumTitle.trim(),
          artist_id: Number(newAlbumArtistId),
          release_date: newAlbumReleaseDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create album.');
      }

      setSuccess('Album added successfully.');
      setNewAlbumTitle('');
      setNewAlbumArtistId('');
      setNewAlbumReleaseDate('');

      await fetchAlbums();
      setActiveTab('albums');
    } catch (err) {
      console.error('Create album error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create album.');
    } finally {
      setCreatingAlbum(false);
    }
  };

  const handleDeleteSong = async (songId: string | number) => {
    if (!token) {
      setError('No admin token found.');
      return;
    }

    const confirmDelete = window.confirm('Delete this song?');
    if (!confirmDelete) return;

    try {
      setError('');
      setSuccess('');

      const response = await fetch(`/api/songs/${songId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Delete failed.');
      }

      setSuccess('Song deleted successfully.');
      await fetchSongs();
    } catch (err) {
      console.error('Delete error:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete song.');
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black p-6">
        <Card className="w-full max-w-xl bg-zinc-900 text-white">
          <CardHeader>
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Please login using a valid admin account from the database.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm text-zinc-400">
              Your current session does not contain a valid admin token.
            </p>

            <p className="mt-3 text-xs text-zinc-500">
              Expected localStorage values: <strong>token</strong> and{' '}
              <strong>admin</strong>.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black px-4 py-4 text-white sm:px-6 lg:px-8 xl:px-12">
      <div className="mx-auto flex w-full max-w-[1900px] flex-col gap-6">
        <div className="flex items-center justify-end gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900"
            title={`${parsedAdmin?.name || 'Admin'} (${parsedAdmin?.role || 'admin'})`}
          >
            <UserCircle className="h-6 w-6" />
          </div>

          <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-red-500">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-500/10 p-3 text-green-500">
            <CheckCircle2 className="h-5 w-5" />
            {success}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-2">
            <TabsList className="w-full grid grid-cols-5 gap-2 rounded-2xl border border-white/10 bg-zinc-900/80 p-2 h-auto">
              <TabsTrigger value="overview" className="w-full rounded-xl py-3 text-sm sm:text-base font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-black text-zinc-400">Overview</TabsTrigger>
              <TabsTrigger value="songs" className="w-full rounded-xl py-3 text-sm sm:text-base font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-black text-zinc-400">Songs</TabsTrigger>
              <TabsTrigger value="artists" className="w-full rounded-xl py-3 text-sm sm:text-base font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-black text-zinc-400">Artists</TabsTrigger>
              <TabsTrigger value="albums" className="w-full rounded-xl py-3 text-sm sm:text-base font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-black text-zinc-400">Albums</TabsTrigger>
              <TabsTrigger value="users" className="w-full rounded-xl py-3 text-sm sm:text-base font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-black text-zinc-400">Users</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card onClick={() => setActiveTab('songs')} className="cursor-pointer bg-zinc-900 text-white transition hover:bg-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Songs
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{songs.length}</p>
                </CardContent>
              </Card>

              <Card onClick={() => setActiveTab('artists')} className="cursor-pointer bg-zinc-900 text-white transition hover:bg-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Artists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{artists.length}</p>
                </CardContent>
              </Card>

              <Card onClick={() => setActiveTab('albums')} className="cursor-pointer bg-zinc-900 text-white transition hover:bg-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Disc3 className="h-5 w-5" />
                    Albums
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{albums.length}</p>
                </CardContent>
              </Card>

              <Card onClick={() => setActiveTab('users')} className="cursor-pointer bg-zinc-900 text-white transition hover:bg-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserCircle className="h-5 w-5" />
                    Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{users.length}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-zinc-900 text-white">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Use these buttons to jump directly to management forms.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-3">
                <Button onClick={() => setActiveTab('songs')}>
                  <Upload className="mr-2 h-4 w-4" />
                  Add Song
                </Button>
                <Button onClick={() => setActiveTab('artists')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Artist
                </Button>
                <Button onClick={() => setActiveTab('albums')}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Album
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="songs" className="mt-6 space-y-6">
            <Card className="bg-zinc-900 text-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Add / Upload Song
                </CardTitle>
                <CardDescription>
                  Upload songs to local storage and save metadata in MySQL.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleUploadSong} encType="multipart/form-data" className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Song title" required />
                    </div>

                    <div className="space-y-2">
                      <Label>Artist</Label>
                      <Input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist name" required />
                    </div>

                    <div className="space-y-2">
                      <Label>Album</Label>
                      <Input value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Album optional" />
                    </div>

                    <div className="space-y-2">
                      <Label>Genre</Label>
                      <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre" />
                    </div>

                    <div className="space-y-2 xl:col-span-2">
                      <Label>Audio File</Label>
                      <Input type="file" accept="audio/*,.mp3,.wav" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} required />
                      {audioFile && <p className="text-xs text-zinc-400">Selected: {audioFile.name}</p>}
                    </div>

                    <div className="space-y-2 xl:col-span-2">
                      <Label>Cover Image</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                      {coverFile && <p className="text-xs text-zinc-400">Selected: {coverFile.name}</p>}
                    </div>
                  </div>

                  {uploading && (
                    <div className="space-y-2 rounded-lg border border-zinc-700 bg-zinc-950 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span
                          className={
                            uploadStatus === 'Done!'
                              ? 'text-green-500'
                              : uploadStatus === 'Upload failed.'
                              ? 'text-red-500'
                              : 'text-zinc-300'
                          }
                        >
                          {uploadStatus}
                        </span>
                        <span className="font-semibold text-orange-500">{uploadProgress}%</span>
                      </div>

                      <Progress
                        value={uploadProgress}
                        className="h-3 bg-zinc-800"
                      />
                    </div>
                  )}

                  <Button type="submit" disabled={uploading} className="w-full">
                    {uploading ? 'Uploading...' : 'Upload Song'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 text-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Existing Songs</CardTitle>
                  <CardDescription>Existing songs in MySQL.</CardDescription>
                </div>

                <Button variant="outline" onClick={fetchAll} disabled={loading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </CardHeader>

              <CardContent>
                {loading ? (
                  <p>Loading...</p>
                ) : songs.length === 0 ? (
                  <p className="text-zinc-400">No songs found.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {songs.map((song, index) => (
                      <div key={`song-${song.id}-${index}`} className="rounded-lg border border-zinc-700 p-3">
                        <div className="flex items-center gap-3">
                          {song.coverImage ? (
                            <img src={song.coverImage} alt={song.title} className="h-12 w-12 rounded object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-zinc-800">
                              <Music className="h-5 w-5" />
                            </div>
                          )}

                          <div className="min-w-0">
                            <p className="truncate font-medium">{song.title}</p>
                            <p className="truncate text-sm text-zinc-400">
                              {song.artist || 'Unknown Artist'} · {song.genre || 'Unknown Genre'}
                            </p>
                            {song.album && <p className="truncate text-xs text-zinc-500">Album: {song.album}</p>}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          {song.url && <audio src={song.url} controls className="w-full" />}

                          <Button variant="destructive" size="sm" onClick={() => handleDeleteSong(song.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="artists" className="mt-6 space-y-6">
            <Card className="bg-zinc-900 text-white">
              <CardHeader>
                <CardTitle>Add Artist</CardTitle>
                <CardDescription>Add a new artist to the MySQL artists table.</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleCreateArtist} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Artist Name</Label>
                      <Input value={newArtistName} onChange={(e) => setNewArtistName(e.target.value)} placeholder="Artist name" required />
                    </div>

                    <div className="space-y-2">
                      <Label>Bio</Label>
                      <Input value={newArtistBio} onChange={(e) => setNewArtistBio(e.target.value)} placeholder="Short bio optional" />
                    </div>

                    <div className="space-y-2">
                      <Label>Image URL</Label>
                      <Input value={newArtistImageUrl} onChange={(e) => setNewArtistImageUrl(e.target.value)} placeholder="Optional image URL" />
                    </div>
                  </div>

                  <Button type="submit" disabled={creatingArtist}>
                    {creatingArtist ? 'Adding Artist...' : 'Add Artist'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 text-white">
              <CardHeader>
                <CardTitle>Existing Artists</CardTitle>
                <CardDescription>Existing artists.</CardDescription>
              </CardHeader>

              <CardContent>
                {artists.length === 0 ? (
                  <p className="text-zinc-400">No artists found.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {artists.map((artistItem, index) => (
                      <div key={`artist-${artistItem.id}-${index}`} className="flex items-center gap-3 rounded-lg border border-zinc-700 p-3">
                        {artistItem.imageUrl ? (
                          <img src={artistItem.imageUrl} alt={artistItem.name} className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
                            <Users className="h-4 w-4" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate font-medium">{artistItem.name}</p>
                          {artistItem.bio && <p className="truncate text-sm text-zinc-400">{artistItem.bio}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="albums" className="mt-6 space-y-6">
            <Card className="bg-zinc-900 text-white">
              <CardHeader>
                <CardTitle>Add Album</CardTitle>
                <CardDescription>Add a new album and attach it to an artist.</CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleCreateAlbum} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Album Title</Label>
                      <Input value={newAlbumTitle} onChange={(e) => setNewAlbumTitle(e.target.value)} placeholder="Album title" required />
                    </div>

                    <div className="space-y-2">
                      <Label>Artist</Label>
                      <select
                        value={newAlbumArtistId}
                        onChange={(e) => setNewAlbumArtistId(e.target.value)}
                        required
                        className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 text-sm text-white"
                      >
                        <option value="">Select artist</option>
                        {artists.map((artistItem, index) => (
                          <option key={`artist-option-${artistItem.id}-${index}`} value={artistItem.id}>
                            {artistItem.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label>Release Date</Label>
                      <Input type="date" value={newAlbumReleaseDate} onChange={(e) => setNewAlbumReleaseDate(e.target.value)} />
                    </div>
                  </div>

                  <Button type="submit" disabled={creatingAlbum}>
                    {creatingAlbum ? 'Adding Album...' : 'Add Album'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 text-white">
              <CardHeader>
                <CardTitle>Existing Albums</CardTitle>
                <CardDescription>Existing albums.</CardDescription>
              </CardHeader>

              <CardContent>
                {albums.length === 0 ? (
                  <p className="text-zinc-400">No albums found.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {albums.map((albumItem, index) => (
                      <div key={`album-${albumItem.id}-${index}`} className="rounded-lg border border-zinc-700 p-3">
                        <p className="font-medium">{albumItem.title}</p>
                        <p className="text-sm text-zinc-400">{albumItem.artist || 'Unknown Artist'}</p>
                        <p className="text-xs text-zinc-500">Album ID: {albumItem.id}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            <Card className="bg-zinc-900 text-white">
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>Registered StreamKloud users.</CardDescription>
              </CardHeader>

              <CardContent>
                {users.length === 0 ? (
                  <p className="text-zinc-400">No users found.</p>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {users.map((user, index) => (
                      <div key={`user-${user.id}-${index}`} className="rounded-lg border border-zinc-700 p-3">
                        <p className="font-medium">{user.name}</p>
                        <p className="truncate text-sm text-zinc-400">{user.email}</p>
                        <p className="text-xs text-zinc-500">User ID: {user.id}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;