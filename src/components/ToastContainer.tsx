import React from 'react';
import { ToastItem } from '../types';

interface ToastContainerProps {
  toasts: ToastItem[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  const styles = {
    info: 'bg-slate-900/95 text-white border-slate-700',
    warning: 'bg-amber-600/95 text-white border-amber-500',
    success: 'bg-emerald-600/95 text-white border-emerald-500',
  };

  return (
    <div
      aria-live="polite"
      className="no-print fixed bottom-20 md:bottom-5 right-4 left-4 md:left-auto z-[80] flex flex-col items-end gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto max-w-sm backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border text-sm font-medium transition-all duration-200 ${styles[toast.type]}`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};
