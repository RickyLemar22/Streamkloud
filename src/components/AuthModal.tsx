import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

import { Chrome, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuthModal } from '../store/useAuthModal';

export function AuthModal() {
  const { isOpen, close, mode, setMode } = useAuthModal();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [displayName, setDisplayName] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [resetCode, setResetCode] = useState('');

  const [verificationPurpose, setVerificationPurpose] = useState<'signup' | 'reset'>('signup');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveBackendAuth = (data: any) => {
    if (data.token) {
      localStorage.setItem('token', data.token);
    }

    if (data.admin) {
      localStorage.setItem('admin', JSON.stringify(data.admin));
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-change'));
      return;
    }

    if (data.userType === 'admin') {
      localStorage.setItem(
        'admin',
        JSON.stringify({
          id: data.id || data._id,
          name: data.name,
          email: data.email,
          role: data.role,
          userType: 'admin',
          isAdmin: true,
        })
      );

      localStorage.removeItem('user');
      window.dispatchEvent(new Event('auth-change'));
      return;
    }

    localStorage.removeItem('admin');

    const userData = data.user || data;

    localStorage.setItem(
      'user',
      JSON.stringify({
        id: userData.id || userData._id,
        name: userData.name,
        displayName: userData.displayName || userData.name,
        email: userData.email,
        role: userData.role || 'user',
        userType: userData.userType || 'user',
        photoURL: userData.photoURL || '',
        subscription: userData.subscription,
      })
    );

    window.dispatchEvent(new Event('auth-change'));
  };

  const tryAdminLogin = async () => {
    const response = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) return null;

    saveBackendAuth(data);
    return data;
  };

  const backendUserLogin = async () => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Login failed.');
    }

    saveBackendAuth(data);
    return data;
  };

  const backendRegisterUser = async () => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: displayName.trim(),
        email,
        password,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed.');
    }

    return data;
  };

  const resendVerificationCode = async () => {
    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to resend verification code.');
    }

    return data;
  };

  const sendPasswordResetCode = async () => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send password reset code.');
    }

    return data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('Display name is required.');
        }

        await backendRegisterUser();

        setVerificationPurpose('signup');
        setVerificationCode('');
        setMode('verify');
        return;
      }

      const adminData = await tryAdminLogin();

      if (adminData) {
        close();
        navigate('/admin');
        return;
      }

      const userData = await backendUserLogin();

      close();

      if (userData.userType === 'admin' || userData.admin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      if (verificationPurpose === 'reset') {
        setResetCode(verificationCode);
        setVerificationCode('');
        setPassword('');
        setMode('reset');
        return;
      }

      const response = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Invalid verification code.');
      }

      if (data.token || data.user || data.admin || data.userType) {
        saveBackendAuth(data);
      }

      setVerificationCode('');
      setLoading(false);
      close();
      navigate('/');
      return;
    } catch (err: any) {
      setError(err.message || 'Failed to verify code.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await sendPasswordResetCode();

      setVerificationPurpose('reset');
      setVerificationCode('');
      setResetCode('');
      setMode('verify');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !resetCode || !password) {
      setError('Email, reset code, and new password are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: resetCode,
          newPassword: password,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password.');
      }

      setPassword('');
      setResetCode('');
      setVerificationCode('');
      setMode('login');
    } catch (err: any) {
      setError(err.message || 'Password reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);

    try {
      throw new Error('Google login is not configured yet.');
    } catch (err: any) {
      setError(err.message || 'Google login failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError(null);

    try {
      if (verificationPurpose === 'reset') {
        await sendPasswordResetCode();
      } else {
        await resendVerificationCode();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent className="border-zinc-800 bg-zinc-950 p-6 sm:max-w-[400px] lg:p-8">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-center text-2xl font-black text-white">
            {mode === 'login'
              ? 'Welcome Back'
              : mode === 'verify'
              ? verificationPurpose === 'reset'
                ? 'Enter Reset Code'
                : 'Verify Email'
              : mode === 'forgot'
              ? 'Forgot Password'
              : mode === 'reset'
              ? 'Reset Password'
              : 'Create Account'}
          </DialogTitle>

          <DialogDescription className="text-center text-zinc-500">
            {mode === 'login'
              ? 'Log in to access your library, playlists, or admin dashboard'
              : mode === 'verify'
              ? `We sent a 6-digit code to ${email}`
              : mode === 'forgot'
              ? 'Enter your account email to receive a reset code'
              : mode === 'reset'
              ? 'Enter your new password'
              : 'Join StreamKloud to start your music journey'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {mode === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-zinc-400">
                  6-Digit Code
                </Label>

                <Input
                  id="code"
                  placeholder="123456"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  required
                  className="h-14 rounded-xl border-zinc-800 bg-zinc-900 text-center text-2xl font-bold tracking-[0.5em] text-white focus-visible:ring-orange-500"
                />
              </div>

              {error && <p className="text-center text-xs text-red-500">{error}</p>}

              <Button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="h-12 w-full rounded-xl bg-orange-500 font-bold text-black hover:bg-orange-400"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : verificationPurpose === 'reset' ? (
                  'Continue'
                ) : (
                  'Verify & Continue'
                )}
              </Button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                className="w-full text-sm text-zinc-500 transition-colors hover:text-white"
              >
                Didn&apos;t receive a code? Resend
              </button>
            </form>
          ) : mode === 'forgot' ? (
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="forgot-email" className="text-zinc-400">
                  Email Address
                </Label>

                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-white focus-visible:ring-orange-500"
                />
              </div>

              {error && <p className="text-center text-xs text-red-500">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-orange-500 font-bold text-black hover:bg-orange-400"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send Reset Code'}
              </Button>

              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-center text-sm text-zinc-500 transition-colors hover:text-white"
              >
                Back to Login
              </button>
            </form>
          ) : mode === 'reset' ? (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-zinc-400">
                  New Password
                </Label>

                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-xl border-zinc-800 bg-zinc-900 pr-12 text-white focus-visible:ring-orange-500"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && <p className="text-center text-xs text-red-500">{error}</p>}

              <Button
                type="submit"
                disabled={loading || password.length < 6}
                className="h-12 w-full rounded-xl bg-orange-500 font-bold text-black hover:bg-orange-400"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Reset Password'}
              </Button>
            </form>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading}
                className="h-12 w-full gap-x-3 rounded-xl border-zinc-800 bg-zinc-900/50 text-white hover:bg-zinc-800"
              >
                {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Chrome className="h-5 w-5" />}
                Continue with Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-zinc-800" />
                </div>

                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-zinc-950 px-2 text-zinc-500">
                    Or continue with email
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-zinc-400">
                      Display Name
                    </Label>

                    <Input
                      id="name"
                      placeholder="John Paul"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-white focus-visible:ring-orange-500"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-zinc-400">
                    Email
                  </Label>

                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl border-zinc-800 bg-zinc-900 text-white focus-visible:ring-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-zinc-400">
                    Password
                  </Label>

                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 rounded-xl border-zinc-800 bg-zinc-900 pr-12 text-white focus-visible:ring-orange-500"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-xs text-zinc-400 transition-colors hover:text-white"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {error && <p className="text-center text-xs text-red-500">{error}</p>}

                <Button
                  type="submit"
                  disabled={loading || googleLoading}
                  className="h-12 w-full rounded-xl bg-orange-500 font-bold text-black hover:bg-orange-400"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : mode === 'login' ? 'Log In' : 'Sign Up'}
                </Button>
              </form>
            </>
          )}
        </div>

        <div className="text-center text-sm">
          <span className="text-zinc-500">
            {mode === 'login'
              ? "Don't have an account? "
              : mode === 'verify'
              ? 'Entered wrong email? '
              : mode === 'forgot' || mode === 'reset'
              ? 'Remembered your password? '
              : 'Already have an account? '}
          </span>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setPassword('');
              setVerificationCode('');
              setResetCode('');
              setMode(mode === 'login' ? 'signup' : 'login');
            }}
            className="font-bold text-orange-500 hover:underline"
          >
            {mode === 'login' ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AuthModal;