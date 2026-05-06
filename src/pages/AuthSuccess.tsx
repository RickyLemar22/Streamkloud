import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const token = params.get('token');
    const userParam = params.get('user');

    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    localStorage.setItem('token', token);
    localStorage.removeItem('admin');

    if (userParam) {
      try {
        const user = JSON.parse(userParam);

        localStorage.setItem(
          'user',
          JSON.stringify({
            id: user.id,
            name: user.name,
            displayName: user.displayName || user.name,
            email: user.email,
            role: user.role || 'user',
            userType: user.userType || 'user',
            photoURL: user.photoURL || '',
            subscription: user.subscription || null,
          })
        );
      } catch {
        localStorage.setItem(
          'user',
          JSON.stringify({
            role: 'user',
            userType: 'user',
          })
        );
      }
    }

    window.dispatchEvent(new Event('auth-change'));

    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center bg-black text-white">
      Signing you in...
    </div>
  );
}