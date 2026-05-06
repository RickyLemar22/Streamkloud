export interface Song {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  album?: string;
  albumId?: string;
  duration: number;
  audioUrl: string;
  coverUrl: string;
  genre?: string;
  plays?: number;
  lyrics?: string;
  createdAt?: string;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  imageUrl?: string;
  isVerified: boolean;
  createdAt: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  coverUrl: string;
  releaseYear: number;
  songIds: string[];
}

export interface Playlist {
  id: string;
  name: string;
  ownerId: string;
  songIds: string[];
  isPublic: boolean;
  createdAt: string;
}

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  role: 'user' | 'admin';
  subscription?: {
    plan: 'none' | 'daily' | 'weekly' | 'monthly' | 'annual';
    status: 'active' | 'expired' | 'canceled';
    expiryDate: string;
  };
}
