import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { AppError } from './utils/errorHandler';

window.onerror = (message, source, lineno, colno, error) => {
  if (error instanceof AppError) {
    console.error(`Uncaught AppError: ${error.errorCode} - ${error.message}`);
  } else {
    console.error('Uncaught error:', error);
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();
