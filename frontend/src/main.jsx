// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { NotificationProvider } from './context/NotificationContext';
import { SitePreferencesProvider } from './context/SitePreferencesContext';


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SitePreferencesProvider>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </SitePreferencesProvider>
    </BrowserRouter>
  </React.StrictMode>
);
