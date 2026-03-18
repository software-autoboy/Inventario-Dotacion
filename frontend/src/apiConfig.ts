// Configuración de la URL base del backend
const getBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || '';
  // Elimina todas las barras al final si existen
  return url.replace(/\/+$/, '');
};

export const API_URL = getBaseUrl();
