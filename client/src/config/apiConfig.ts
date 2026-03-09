// URL do backend - usa variável de ambiente no Vercel, localhost em dev
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
export const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
