import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextData {
  showToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto flex items-center p-4 rounded-md shadow-lg border w-80 translate-y-0 transition-all backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-[var(--color-success-bg)] border-[var(--color-success)] text-[var(--color-success)]'
                : 'bg-[var(--color-danger-bg)] border-[var(--color-danger)] text-[var(--color-danger)]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="mr-3 shrink-0" size={20} aria-hidden="true" />
            ) : (
              <AlertCircle className="mr-3 shrink-0" size={20} aria-hidden="true" />
            )}
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Fechar notificação"
              className="opacity-70 hover:opacity-100 ml-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current rounded"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
