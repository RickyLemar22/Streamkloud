import React, { useEffect, useState } from 'react';
import { uploadFile } from '../lib/storage';

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
  Edit,
  Save,
  X,
} from 'lucide-react';

type Song = {
  id: string | number;
  title: string;
  artist?: string;
  artist_id?: string | number;
  album?: string;
  album_id?: string | number;
  genre?: string;
  file_url?: string;
  url?: string;
  coverImage?: string;
  cover_image?: string;
  duration?: number;
  release_year?: string | number;
  year?: string | number;
  featured_artists?: string | string[];
  featuring?: string | string[];
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
  artist_id?: string | number;
  coverUrl?: string;
  cover_url?: string;
  releaseYear?: string | number;
  release_date?: string;
};

type AppUser = {
  id: string | number;
  firebase_uid?: string | null;
  name: string;
  email: string;
  created_at?: string;
  banned?: boolean;
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
  const [releaseYear, setReleaseYear] = useState('');
  const [featuredArtists, setFeaturedArtists] = useState<string[]>([]);
  const [featuredArtistInput, setFeaturedArtistInput] = useState('');
  const [filteredFeaturedArtists, setFilteredFeaturedArtists] = useState<Artist[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [newArtistName, setNewArtistName] = useState('');
  const [newArtistBio, setNewArtistBio] = useState('');
  const [newArtistImageFile, setNewArtistImageFile] = useState<File | null>(null);

  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumArtistId, setNewAlbumArtistId] = useState('');
  const [newAlbumReleaseDate, setNewAlbumReleaseDate] = useState('');
  const [newAlbumCoverFile, setNewAlbumCoverFile] = useState<File | null>(null);

  // Artist search helpers for song upload and album creation forms
  const [artistQuery, setArtistQuery] = useState('');
  const [filteredSongArtists, setFilteredSongArtists] = useState<Artist[]>([]);
  const [filteredAlbumArtists, setFilteredAlbumArtists] = useState<Artist[]>([]);
  const [editArtistImageFile, setEditArtistImageFile] = useState<File | null>(null);

  // user management
  const [userActionLoading, setUserActionLoading] = useState(false);

  // Edit state
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);

  // Edit form data
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editAlbum, setEditAlbum] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editArtistName, setEditArtistName] = useState('');
  const [editArtistBio, setEditArtistBio] = useState('');
  const [editArtistImageUrl, setEditArtistImageUrl] = useState('');
  const [editAlbumTitle, setEditAlbumTitle] = useState('');
  const [editAlbumArtistId, setEditAlbumArtistId] = useState('');
  const [editAlbumReleaseDate, setEditAlbumReleaseDate] = useState('');

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [creatingArtist, setCreatingArtist] = useState(false);
  const [creatingAlbum, setCreatingAlbum] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing state for inline edits
  const [editingSongId, setEditingSongId] = useState<string | number | null>(null);
  const [editingSongValues, setEditingSongValues] = useState<any>({});

  const [editingArtistId, setEditingArtistId] = useState<string | number | null>(null);
  const [editingArtistValues, setEditingArtistValues] = useState<any>({});

  const [editingAlbumId, setEditingAlbumId] = useState<string | number | null>(null);
  const [editingAlbumValues, setEditingAlbumValues] = useState<any>({});

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

      const results = await Promise.allSettled([
        fetchSongs(),
        fetchArtists(),
        fetchAlbums(),
        fetchUsers(),
      ]);

      const failedSections = ['songs', 'artists', 'albums', 'users'].filter(
        (_section, index) => results[index].status === 'rejected'
      );

      if (failedSections.length > 0) {
        console.warn('Some admin sections failed to load:', failedSections);
      }
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

  const addFeaturedArtist = (name?: string) => {
    const selectedName = (name || featuredArtistInput).trim();

    if (!selectedName) return;

    const alreadyAdded = featuredArtists.some(
      (artistName) => artistName.toLowerCase() === selectedName.toLowerCase()
    );

    const isMainArtist = artist.trim().toLowerCase() === selectedName.toLowerCase();

    if (alreadyAdded || isMainArtist) {
      setFeaturedArtistInput('');
      setFilteredFeaturedArtists([]);
      return;
    }

    setFeaturedArtists((previous) => [...previous, selectedName]);
    setFeaturedArtistInput('');
    setFilteredFeaturedArtists([]);
  };

  const removeFeaturedArtist = (name: string) => {
    setFeaturedArtists((previous) => previous.filter((artistName) => artistName !== name));
  };

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
      formData.append('release_year', releaseYear.trim());
      formData.append('year', releaseYear.trim());
      formData.append('duration', String(duration || 0));
      formData.append('featured_artists', JSON.stringify(featuredArtists));
      formData.append('featuring', featuredArtists.join(', '));
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
      setFeaturedArtists([]);
      setFeaturedArtistInput('');
      setFilteredFeaturedArtists([]);
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

      let imageUrl = '';
      if (newArtistImageFile) {
        imageUrl = await uploadFile(newArtistImageFile, 'general');
      }

      const response = await fetch('/api/artists', {
        method: 'POST',
        headers: jsonAuthHeaders,
        body: JSON.stringify({
          name: newArtistName.trim(),
          bio: newArtistBio.trim(),
          imageUrl: imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create artist.');
      }

      setSuccess('Artist added successfully.');
      setNewArtistName('');
      setNewArtistBio('');
      setNewArtistImageFile(null);

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

      let coverUrl = '';
      if (newAlbumCoverFile) {
        coverUrl = await uploadFile(newAlbumCoverFile, 'covers');
      }

      const response = await fetch('/api/albums', {
        method: 'POST',
        headers: jsonAuthHeaders,
        body: JSON.stringify({
          title: newAlbumTitle.trim(),
          artist_id: Number(newAlbumArtistId),
          release_date: newAlbumReleaseDate || null,
          coverUrl: coverUrl || null,
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
      setNewAlbumCoverFile(null);
      setArtistQuery('');

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

  // -------- Editing handlers --------
  const handleSaveSongEdit = async (songId: string | number) => {
    if (!token) {
      setError('No admin token found.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const formData = new FormData();
      formData.append('title', editingSongValues.title || '');
      formData.append('genre', editingSongValues.genre || '');
      if (editingSongValues.file_url) formData.append('file_url', editingSongValues.file_url);
      if (editingSongValues.artist_id) formData.append('artist_id', String(editingSongValues.artist_id));
      if (editingSongValues.album_id) formData.append('album_id', String(editingSongValues.album_id));
      if (editingSongValues.audioFile) formData.append('audio', editingSongValues.audioFile);
      if (editingSongValues.coverFile) formData.append('coverImage', editingSongValues.coverFile);

      const response = await fetch(`/api/songs/${songId}`, {
        method: 'PUT',
        headers: authHeaders, // Authorization only; let browser set Content-Type for FormData
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed.');

      setSuccess('Song updated successfully.');
      setEditingSongId(null);
      setEditingSongValues({});
      await fetchAll();
    } catch (err) {
      console.error('Save song edit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update song.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSongEdit = () => {
    setEditingSongId(null);
    setEditingSongValues({});
  };

  const handleSaveArtistEdit = async (artistId: string | number) => {
    if (!token) {
      setError('No admin token found.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      let imageUrl = editingArtistValues.imageUrl || '';
      if (editArtistImageFile) {
        imageUrl = await uploadFile(editArtistImageFile, 'general');
      }

      const body = {
        name: editingArtistValues.name || '',
        bio: editingArtistValues.bio || '',
        imageUrl,
      };

      const response = await fetch(`/api/artists/${artistId}`, {
        method: 'PUT',
        headers: jsonAuthHeaders,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update artist failed.');

      setSuccess('Artist updated successfully.');
      setEditingArtistId(null);
      setEditingArtistValues({});
      setEditArtistImageFile(null);
      await fetchArtists();
    } catch (err) {
      console.error('Save artist edit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update artist.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelArtistEdit = () => {
    setEditingArtistId(null);
    setEditingArtistValues({});
    setEditArtistImageFile(null);
  };

  const handleSaveAlbumEdit = async (albumId: string | number) => {
    if (!token) {
      setError('No admin token found.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const body = {
        title: editingAlbumValues.title || '',
        artistId: editingAlbumValues.artistId || editingAlbumValues.artist_id || null,
        coverUrl: editingAlbumValues.coverUrl || '',
        releaseYear: editingAlbumValues.releaseYear || editingAlbumValues.release_date || null,
      };

      const response = await fetch(`/api/albums/${albumId}`, {
        method: 'PUT',
        headers: jsonAuthHeaders,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update album failed.');

      setSuccess('Album updated successfully.');
      setEditingAlbumId(null);
      setEditingAlbumValues({});
      await fetchAlbums();
    } catch (err) {
      console.error('Save album edit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update album.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAlbumEdit = () => {
    setEditingAlbumId(null);
    setEditingAlbumValues({});
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
    <div className="h-screen min-h-screen w-full overflow-y-auto bg-black px-4 py-4 text-white sm:px-6 lg:px-8 xl:px-12">
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
            <TabsList className="grid min-w-[700px] grid-cols-5 bg-zinc-900">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="songs">Songs</TabsTrigger>
              <TabsTrigger value="artists">Artists</TabsTrigger>
              <TabsTrigger value="albums">Albums</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
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
                      <Label>Main Artist</Label>
                      <Input
                        value={artist}
                        onChange={(e) => {
                          setArtist(e.target.value);
                          const q = e.target.value.toLowerCase();
                          setFilteredSongArtists(artists.filter((a) => a.name.toLowerCase().includes(q)));
                        }}
                        placeholder="Search or type main artist name"
                        required
                      />
                      {artist && filteredSongArtists.length > 0 && (
                        <div className="max-h-48 overflow-y-auto bg-zinc-900 border border-zinc-800 mt-1 rounded">
                          {filteredSongArtists.map((a) => (
                            <div key={`suggest-${a.id}`} className="p-2 hover:bg-zinc-800 cursor-pointer" onClick={() => { setArtist(a.name); setFilteredSongArtists([]); }}>
                              {a.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2 xl:col-span-2">
                      <Label>Featured Artists Optional</Label>
                      <div className="flex gap-2">
                        <Input
                          value={featuredArtistInput}
                          onChange={(e) => {
                            setFeaturedArtistInput(e.target.value);
                            const q = e.target.value.trim().toLowerCase();
                            setFilteredFeaturedArtists(
                              q
                                ? artists.filter(
                                    (a) =>
                                      a.name.toLowerCase().includes(q) &&
                                      a.name.toLowerCase() !== artist.trim().toLowerCase() &&
                                      !featuredArtists.some((name) => name.toLowerCase() === a.name.toLowerCase())
                                  )
                                : []
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addFeaturedArtist();
                            }
                          }}
                          placeholder="Search or type featured artist name"
                        />
                        <Button type="button" variant="outline" onClick={() => addFeaturedArtist()}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add
                        </Button>
                      </div>

                      {featuredArtistInput && filteredFeaturedArtists.length > 0 && (
                        <div className="max-h-48 overflow-y-auto rounded border border-zinc-800 bg-zinc-900">
                          {filteredFeaturedArtists.map((a) => (
                            <div
                              key={`featured-suggest-${a.id}`}
                              className="cursor-pointer p-2 hover:bg-zinc-800"
                              onClick={() => addFeaturedArtist(a.name)}
                            >
                              {a.name}
                            </div>
                          ))}
                        </div>
                      )}

                      {featuredArtists.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {featuredArtists.map((name) => (
                            <span key={name} className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1 text-xs text-zinc-200">
                              {name}
                              <button type="button" className="text-zinc-400 hover:text-white" onClick={() => removeFeaturedArtist(name)}>
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Album</Label>
                      <Input value={album} onChange={(e) => setAlbum(e.target.value)} placeholder="Album optional" />
                    </div>

                    <div className="space-y-2">
                      <Label>Genre</Label>
                      <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre" />
                    </div>

                    <div className="space-y-2">
                      <Label>Year of Release</Label>
                      <Input
                        type="number"
                        min="1900"
                        max="2100"
                        value={releaseYear}
                        onChange={(e) => setReleaseYear(e.target.value)}
                        placeholder="e.g. 2017"
                      />
                    </div>

                    <div className="space-y-2 xl:col-span-2">
                      <Label>Audio File</Label>
                      <Input type="file" accept="audio/*,.mp3,.wav" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} required />
                      {audioFile && <p className="text-xs text-zinc-400">Selected: {audioFile.name}</p>}
                    </div>

                    <div className="space-y-2 xl:col-span-2">
                      <Label>Cover Image</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
                      {coverFile && (
                        <p className="text-xs text-zinc-400">Selected: {coverFile.name}</p>
                      )}
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
                            {(song.featured_artists || song.featuring) && (
                              <p className="truncate text-xs text-zinc-500">
                                Featuring:{' '}
                                {Array.isArray(song.featured_artists)
                                  ? song.featured_artists.join(', ')
                                  : song.featured_artists || song.featuring}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-3">
                          {editingSongId === song.id ? (
                            <form className="w-full grid gap-2" onSubmit={(e) => { e.preventDefault(); handleSaveSongEdit(song.id); }}>
                              <div className="grid gap-2 md:grid-cols-2">
                                <div className="space-y-1">
                                  <Label>Title</Label>
                                  <Input value={editingSongValues.title || ''} onChange={(e) => setEditingSongValues((p:any) => ({ ...p, title: e.target.value }))} />
                                </div>
                                <div className="space-y-1">
                                  <Label>Genre</Label>
                                  <Input value={editingSongValues.genre || ''} onChange={(e) => setEditingSongValues((p:any) => ({ ...p, genre: e.target.value }))} />
                                </div>
                              </div>

                              <div className="grid gap-2 md:grid-cols-2">
                                <div className="space-y-1">
                                  <Label>File URL</Label>
                                  <Input value={editingSongValues.file_url || ''} onChange={(e) => setEditingSongValues((p:any) => ({ ...p, file_url: e.target.value }))} />
                                </div>

                                <div className="space-y-1">
                                  <Label>Upload Audio (optional)</Label>
                                  <input type="file" accept="audio/*" onChange={(e:any) => setEditingSongValues((p:any) => ({ ...p, audioFile: e.target.files?.[0] }))} />
                                </div>
                              </div>

                              <div className="grid gap-2 md:grid-cols-2">
                                <div className="space-y-1">
                                  <Label>Cover Image (optional)</Label>
                                  <input type="file" accept="image/*" onChange={(e:any) => setEditingSongValues((p:any) => ({ ...p, coverFile: e.target.files?.[0] }))} />
                                </div>

                                <div className="flex items-end gap-2">
                                  <Button type="submit">Save</Button>
                                  <Button type="button" variant="ghost" onClick={handleCancelSongEdit}>Cancel</Button>
                                </div>
                              </div>
                            </form>
                          ) : (
                            <div className="flex items-center gap-2">
                              {song.url && <audio src={song.url} controls className="w-full" />}

                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => {
                                  setEditingSongId(song.id);
                                  setEditingSongValues({
                                    title: song.title || '',
                                    artist_id: song.artist_id || song.artist || '',
                                    album_id: song.album_id || song.album || '',
                                    genre: song.genre || '',
                                    file_url: song.file_url || song.url || '',
                                  });
                                  setActiveTab('songs');
                                }}>
                                  Edit
                                </Button>

                                <Button variant="destructive" size="sm" onClick={() => handleDeleteSong(song.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )}
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
                      <Label>Artist Image</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setNewArtistImageFile(e.target.files?.[0] || null)} />
                      {newArtistImageFile && (
                        <p className="text-xs text-zinc-400">Selected: {newArtistImageFile.name}</p>
                      )}
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

                        <div className="min-w-0 flex-1">
                          {editingArtistId === artistItem.id ? (
                            <div className="grid gap-2">
                              <Input value={editingArtistValues.name || artistItem.name || ''} onChange={(e) => setEditingArtistValues((p:any) => ({ ...p, name: e.target.value }))} />
                              <Input value={editingArtistValues.bio || artistItem.bio || ''} onChange={(e) => setEditingArtistValues((p:any) => ({ ...p, bio: e.target.value }))} />
                              <Input type="file" accept="image/*" onChange={(e) => setEditArtistImageFile(e.target.files?.[0] || null)} />
                              {editArtistImageFile && (
                                <p className="text-xs text-zinc-400">Selected: {editArtistImageFile.name}</p>
                              )}

                              <div className="flex gap-2 mt-2">
                                <Button onClick={() => handleSaveArtistEdit(artistItem.id)}>Save</Button>
                                <Button variant="ghost" onClick={handleCancelArtistEdit}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="truncate font-medium">{artistItem.name}</p>
                              {artistItem.bio && <p className="truncate text-sm text-zinc-400">{artistItem.bio}</p>}
                            </>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => {
                            setEditingArtistId(artistItem.id);
                            setEditingArtistValues({ name: artistItem.name || '', bio: artistItem.bio || '', imageUrl: artistItem.imageUrl || '' });
                          }}>Edit</Button>
                          {/* optionally: delete artist button could be added here */}
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
                      <Input
                        value={artistQuery}
                        onChange={(e) => {
                          setArtistQuery(e.target.value);
                          const q = e.target.value.toLowerCase();
                          setFilteredAlbumArtists(artists.filter((a) => a.name.toLowerCase().includes(q)));
                        }}
                        placeholder="Search or select artist"
                        required
                      />
                      {artistQuery && filteredAlbumArtists.length > 0 && (
                        <div className="max-h-48 overflow-y-auto bg-zinc-900 border border-zinc-800 mt-1 rounded">
                          {filteredAlbumArtists.map((a) => (
                            <div key={`suggest-album-${a.id}`} className="p-2 hover:bg-zinc-800 cursor-pointer" onClick={() => { setArtistQuery(a.name); setNewAlbumArtistId(String(a.id)); setFilteredAlbumArtists([]); }}>
                              {a.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Release Date</Label>
                      <Input type="date" value={newAlbumReleaseDate} onChange={(e) => setNewAlbumReleaseDate(e.target.value)} />
                    </div>

                    <div className="space-y-2">
                      <Label>Album Cover</Label>
                      <Input type="file" accept="image/*" onChange={(e) => setNewAlbumCoverFile(e.target.files?.[0] || null)} />
                      {newAlbumCoverFile && (
                        <p className="text-xs text-zinc-400">Selected: {newAlbumCoverFile.name}</p>
                      )}
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
                        {editingAlbumId === albumItem.id ? (
                          <div className="grid gap-2">
                            <Input value={editingAlbumValues.title || albumItem.title || ''} onChange={(e) => setEditingAlbumValues((p:any) => ({ ...p, title: e.target.value }))} />
                            <Input value={editingAlbumValues.artist || albumItem.artist || ''} onChange={(e) => setEditingAlbumValues((p:any) => ({ ...p, artist: e.target.value }))} />
                            <Input value={editingAlbumValues.releaseYear || ''} onChange={(e) => setEditingAlbumValues((p:any) => ({ ...p, releaseYear: e.target.value }))} />

                            <div className="flex gap-2 mt-2">
                              <Button onClick={() => handleSaveAlbumEdit(albumItem.id)}>Save</Button>
                              <Button variant="ghost" onClick={handleCancelAlbumEdit}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="font-medium">{albumItem.title}</p>
                            <p className="text-sm text-zinc-400">{albumItem.artist || 'Unknown Artist'}</p>
                            <p className="text-xs text-zinc-500">Album ID: {albumItem.id}</p>
                          </>
                        )}

                        <div className="mt-2 flex gap-2">
                          <Button variant="ghost" size="sm" onClick={() => { setEditingAlbumId(albumItem.id); setEditingAlbumValues({ title: albumItem.title || '', artist: albumItem.artist || '', releaseYear: albumItem.release_year || '' }); }}>Edit</Button>
                        </div>
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
                      <div key={`user-${user.id}-${index}`} className="rounded-lg border border-zinc-700 p-3 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="truncate text-sm text-zinc-400">{user.email}</p>
                            <p className="text-xs text-zinc-500">User ID: {user.id}</p>
                          </div>

                          <div className="flex gap-2">
                            <Button variant={user.banned ? 'destructive' : 'outline'} size="sm" onClick={async () => {
                              try {
                                const res = await fetch(`/api/users/${user.id}/ban`, { method: 'POST', headers: jsonAuthHeaders });
                                const d = await res.json();
                                if (!res.ok) throw new Error(d.message || 'Failed');
                                await fetchUsers();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'User action failed');
                              }
                            }}>
                              {user.banned ? 'Unban' : 'Ban'}
                            </Button>

                            <Button variant="destructive" size="sm" onClick={async () => {
                              if (!confirm('Delete this user?')) return;
                              try {
                                const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE', headers: jsonAuthHeaders });
                                const d = await res.json();
                                if (!res.ok) throw new Error(d.message || 'Delete failed');
                                await fetchUsers();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : 'Delete failed');
                              }
                            }}>
                              Delete
                            </Button>
                          </div>
                        </div>
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