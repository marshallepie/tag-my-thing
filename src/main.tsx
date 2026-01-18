import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';
import './lib/i18n';

// Suppress React Router v7 deprecation warnings
const router = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter {...router}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
