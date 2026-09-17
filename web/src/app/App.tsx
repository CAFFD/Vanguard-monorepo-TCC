import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { ToastProvider } from '../components/feedback/ToastContext';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </BrowserRouter>
  );
};
