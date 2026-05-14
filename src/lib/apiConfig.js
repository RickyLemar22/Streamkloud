export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://api.streamkloud.me/api';

export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const getMediaUrl = (url) => {
  if (!url) return '';

  // Already full URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Local upload path
  if (url.startsWith('/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }

  // Relative upload path
  return `${BACKEND_BASE_URL}/${url}`;
};