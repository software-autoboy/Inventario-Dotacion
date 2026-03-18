// Configuración de la URL base del backend
const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || '';
  
  // 1. Quitar espacios en blanco
  url = url.trim();
  
  // 2. Quitar el punto final si existe (el error .app.)
  if (url.endsWith('.')) {
    url = url.slice(0, -1);
  }
  
  // 3. Quitar todas las barras al final (/////)
  url = url.replace(/\/+$/, '');
  
  return url;
};

export const API_URL = getBaseUrl();
