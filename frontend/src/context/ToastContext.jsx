import { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const toastStyles = {
  success: {
    bg: 'bg-emerald-50 border-emerald-200',
    icon: CheckCircle,
    iconColor: 'text-emerald-500',
    text: 'text-emerald-800',
  },
  error: {
    bg: 'bg-red-50 border-red-200',
    icon: AlertCircle,
    iconColor: 'text-red-500',
    text: 'text-red-800',
  },
  warning: {
    bg: 'bg-amber-50 border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    text: 'text-amber-800',
  },
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
    text: 'text-blue-800',
  },
};

const Toast = ({ toast, onClose }) => {
  const style = toastStyles[toast.type] || toastStyles.info;
  const Icon = style.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg ${style.bg} animate-slide-in`}
      role="alert"
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${style.iconColor}`} />
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={`font-medium ${style.text}`}>{toast.title}</p>
        )}
        <p className={`text-sm ${style.text} ${toast.title ? 'mt-1' : ''}`}>
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onClose(toast.id)}
        className={`flex-shrink-0 p-1 rounded hover:bg-black/5 ${style.text}`}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = { id, ...toast };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    const duration = toast.duration || 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback({
    success: (message, options = {}) => addToast({ type: 'success', message, ...options }),
    error: (message, options = {}) => addToast({ type: 'error', message, ...options }),
    warning: (message, options = {}) => addToast({ type: 'warning', message, ...options }),
    info: (message, options = {}) => addToast({ type: 'info', message, ...options }),
  }, [addToast]);

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onClose={removeToast} />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export default ToastContext;
