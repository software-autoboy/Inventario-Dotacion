// Configuración de la URL base del backend
const base_url = import.meta.env.VITE_API_URL || '';
export const API_URL = base_url.endsWith('/') ? base_url.slice(0, -1) : base_url;
