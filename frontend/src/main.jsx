import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// ─── Keep-Alive: Ping BE on app load so free-tier Render instance wakes up ───
// Render free tier sleeps after 15 min — first request gets 502.
// This silent ping fires immediately when user opens the app,
// so by the time they log in and do anything, BE is already awake.
const pingBackend = () => {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const healthUrl = apiUrl.replace(/\/api$/, '') + '/health';
  fetch(healthUrl, { method: 'GET' })
    .then(() => console.log('[keep-alive] BE is awake ✅'))
    .catch(() => console.log('[keep-alive] BE waking up... ⏳'));
};

pingBackend();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);