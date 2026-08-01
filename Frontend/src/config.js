export const SERVER_URL = import.meta.env.PROD 
  ? import.meta.env.VITE_SERVER_URL 
  : `${window.location.protocol}//${window.location.hostname}:8080`;
