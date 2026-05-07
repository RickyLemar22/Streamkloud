import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';

import { Sidebar } from './components/Sidebar';
import { Player } from './components/Player';
import Header from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';

import { Toaster } from 'sonner';

import { Home } from './pages/Home';
import { Search } from './pages/Search';
import { Upload } from './pages/Upload';
import { Artist } from './pages/Artist';
import { Album } from './pages/Album';
import { Playlist } from './pages/Playlist';
import { Albums } from './pages/Albums';
import { Genre } from './pages/Genre';
import { Subscription } from './pages/Subscription';
import { Library } from './pages/Library';
import AuthSuccess from './pages/AuthSuccess';
import Admin from './pages/Admin';

function getStoredAdmin() {
  const token = localStorage.getItem('token');
  const storedAdmin = localStorage.getItem('admin');

  if (!token || !storedAdmin) return null;

  try {
    const admin = JSON.parse(storedAdmin);

    if (
      admin &&
      typeof admin === 'object' &&
      ['super_admin', 'content_manager'].includes(admin.role)
    ) {
      return admin;
    }

    return null;
  } catch {
    return null;
  }
}

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const admin = getStoredAdmin();

  if (!admin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function PaymentCallbackRedirect() {
  const location = useLocation();

  return (
    <Navigate
      to={`/subscription${location.search || ''}`}
      replace
    />
  );
}

function AppContent() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-black lg:flex-row">
      {!isAdminPage && <Sidebar />}

      <main className="relative flex flex-1 flex-col overflow-hidden">
        {!isAdminPage && <Header />}

        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/search" element={<Search />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/artist/:name" element={<Artist />} />
          <Route path="/album/:name" element={<Album />} />
          <Route path="/playlist/:id" element={<Playlist />} />
          <Route path="/albums" element={<Albums />} />
          <Route path="/genre/:name" element={<Genre />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/library" element={<Library />} />
          <Route path="/auth-success" element={<AuthSuccess />} />

          {/* Flutterwave payment redirect route */}
          <Route path="/payment/callback" element={<PaymentCallbackRedirect />} />
          <Route path="/payment/success" element={<PaymentCallbackRedirect />} />
          <Route path="/payment/failed" element={<PaymentCallbackRedirect />} />

          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <Admin />
              </ProtectedAdminRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {!isAdminPage && <Player />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
      <AuthModal />
      <ProfileModal />
      <Toaster position="top-center" richColors />
    </Router>
  );
}