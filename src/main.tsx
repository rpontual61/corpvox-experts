import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import AdminApp from './AdminApp.tsx';
import './index.css';

// Check if the current path is /observatorio
const isAdminArea = window.location.pathname.startsWith('/observatorio');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isAdminArea ? <AdminApp /> : <App />}
  </StrictMode>
);
