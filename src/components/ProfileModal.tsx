import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Loader2, User, Mail, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { useProfileModal } from '@/store/useProfileModal';

type StoredUser = {
  id?: string | number;
  name?: string;
  displayName?: string;
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

export function ProfileModal() {
  const { isOpen, close } = useProfileModal();
  const [user, setUser] = useState<StoredUser | null>(() => getStoredUser());
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    const syncAuth = () => setUser(getStoredUser());

    window.addEventListener('auth-change', syncAuth);
    window.addEventListener('storage', syncAuth);

    return () => {
      window.removeEventListener('auth-change', syncAuth);
      window.removeEventListener('storage', syncAuth);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('admin');
    window.dispatchEvent(new Event('auth-change'));
    window.dispatchEvent(new Event('authUpdated'));
    setUser(null);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/auth/change-password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            data.error ||
            'Failed to update password. Make sure your current password is correct.'
        );
      }
      
      setSuccess('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Make sure your current password is correct.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');

      const response = await fetch('/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email: user.email,
          password: deletePassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || data.success === false) {
        throw new Error(
          data.message ||
            data.error ||
            'Failed to delete account. Make sure your password is correct.'
        );
      }
      
      logout();
      close();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account. Make sure your password is correct.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const displayName = user.displayName || user.name || 'User';

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="bg-zinc-950 border-zinc-800 sm:max-w-[450px] p-6 lg:p-8 overflow-y-auto max-h-[90vh]">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-black text-white">
            User Profile
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Manage your account settings and security
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* User Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-x-4 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
              <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center text-black font-bold text-xl">
                {displayName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white font-bold flex items-center gap-x-2">
                  <User className="w-4 h-4 text-zinc-500" />
                  {displayName}
                </p>
                <p className="text-zinc-500 text-sm flex items-center gap-x-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="space-y-4">
            <h3 className="text-white font-bold flex items-center gap-x-2">
              <Lock className="w-4 h-4 text-orange-500" />
              Change Password
            </h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input 
                  id="currentPassword" 
                  type="password" 
                  placeholder="Current Password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-800 text-white h-11 rounded-xl focus-visible:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input 
                  id="newPassword" 
                  type="password" 
                  placeholder="New Password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-800 text-white h-11 rounded-xl focus-visible:ring-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input 
                  id="confirmPassword" 
                  type="password" 
                  placeholder="Confirm New Password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-800 text-white h-11 rounded-xl focus-visible:ring-orange-500"
                />
              </div>

              {success && (
                <p className="text-green-500 text-xs text-center">{success}</p>
              )}
              {error && !showDeleteConfirm && (
                <p className="text-red-500 text-xs text-center">{error}</p>
              )}

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-colors"
              >
                {loading && !showDeleteConfirm ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
              </Button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <h3 className="text-red-500 font-bold flex items-center gap-x-2">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </h3>
            
            {!showDeleteConfirm ? (
              <Button 
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full h-11 border-red-500/20 bg-red-500/5 text-red-500 hover:bg-red-500/10 rounded-xl"
              >
                Delete Account
              </Button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-4 p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <div className="flex items-start gap-x-3 text-red-500">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <p className="text-xs">
                    This action is permanent and cannot be undone. All your data will be deleted.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deletePassword">Confirm Password to Delete</Label>
                  <Input 
                    id="deletePassword" 
                    type="password" 
                    placeholder="Enter password to confirm" 
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    required
                    className="bg-zinc-900 border-red-500/20 text-white h-11 rounded-xl focus-visible:ring-red-500"
                  />
                </div>
                {error && showDeleteConfirm && (
                  <p className="text-red-500 text-xs text-center">{error}</p>
                )}
                <div className="flex gap-x-2">
                  <Button 
                    type="button"
                    variant="ghost"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 h-11 text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Permanently'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
