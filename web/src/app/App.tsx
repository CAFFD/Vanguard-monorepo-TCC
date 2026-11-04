import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRouter } from './router';
import { ToastProvider } from '../components/feedback/ToastContext';
import { ThemeProvider } from '../components/theme/ThemeContext';
import { AuthProvider } from '../features/auth/context/AuthContext';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};
