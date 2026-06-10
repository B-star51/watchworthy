import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register the service worker so WatchWorthy is installable + works offline.
// Production only — leaving it off in `npm run dev` keeps Vite HMR clean.
// To test the install prompt locally: `npm run build && npm run preview`.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      /* SW registration failed — app still works, just not offline/installable */
    });
  });
}
