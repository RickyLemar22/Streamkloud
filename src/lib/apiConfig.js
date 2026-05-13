export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://32.197.192.58/api';

export const BACKEND_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

export const getMediaUrl = (url) => {
  if (!url) return '';

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${BACKEND_BASE_URL}${url}`;
  }

  return url;
};