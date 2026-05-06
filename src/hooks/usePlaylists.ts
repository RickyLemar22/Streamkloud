import { useEffect, useState } from 'react';

export interface Playlist {
  id: string;
  name: string;
  user_id?: number;
  songIds: string[];
  isPublic: boolean;
  created_at?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getToken = () => {
  const userInfo = localStorage.getItem('userInfo');
  if (!userInfo) return null;

  try {
    return JSON.parse(userInfo).token;
  } catch {
    return null;
  }
};

export function usePlaylists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylists = async () => {
    const token = getToken();

    if (!token) {
      setPlaylists([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE_URL}/playlists`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch playlists');
      }

      const data = await res.json();
      setPlaylists(data);
    } catch (error) {
      console.error('Fetch playlists error:', error);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const createPlaylist = async (name: string, isPublic: boolean = false) => {
    const token = getToken();
    if (!token) return;

    await fetch(`${API_BASE_URL}/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, isPublic }),
    });

    await fetchPlaylists();
  };

  const addSongToPlaylist = async (playlistId: string, songId: string) => {
    const token = getToken();
    if (!token) return;

    await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ songId }),
    });

    await fetchPlaylists();
  };

  const removeSongFromPlaylist = async (playlistId: string, songId: string) => {
    const token = getToken();
    if (!token) return;

    await fetch(`${API_BASE_URL}/playlists/${playlistId}/songs/${songId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await fetchPlaylists();
  };

  const deletePlaylist = async (playlistId: string) => {
    const token = getToken();
    if (!token) return;

    await fetch(`${API_BASE_URL}/playlists/${playlistId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    await fetchPlaylists();
  };

  return {
    playlists,
    loading,
    createPlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    deletePlaylist,
  };
}