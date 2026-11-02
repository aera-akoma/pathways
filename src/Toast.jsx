import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Event-driven global Toast emitter
 * Usage:
 *   toast.success('Profile updated successfully!');
 *   toast.error('Could not save changes.');
 *   toast.info('Downloading file...');
 *   toast.warning('Please complete all required fields.');
 *   toast('General notification message');
 */
export const toast = (message, type = 'info', duration = 4000) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('podar-toast', {
      detail: {
        id: 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        message: String(message || ''),
        type,
        duration
      }
    }));
  }
};

toast.success = (message, duration = 4000) => toast(message, 'success', duration);
toast.error = (message, duration = 5000) => toast(message, 'error', duration);
toast.warning = (message, duration = 4500) => toast(message, 'warning', duration);
toast.info = (message, duration = 4000) => toast(message, 'info', duration);

// Helper to auto-detect sentiment from notify(msg) legacy calls
export function smartToast(message, explicitType = null) {
  if (!message) return;
  if (typeof message === 'object' && message.message) {
    message = message.message;
  }
  const text = String(message).trim();
  if (!text) return;

  if (explicitType && ['success', 'error', 'warning', 'info'].includes(explicitType)) {
    return toast(text, explicitType);
  }

  const lower = text.toLowerCase();
  if (
    lower.includes('error') ||
    lower.includes('failed') ||
    lower.includes('could not') ||
    lower.includes('unable to') ||
    lower.includes('invalid') ||
    lower.includes('incorrect') ||
    lower.includes('denied') ||
    lower.includes('forbidden') ||
    lower.includes('unauthorized') ||
    lower.includes('not found') ||
    lower.includes('cannot')
  ) {
    return toast.error(text);
  }

  if (
    lower.includes('success') ||
    lower.includes('saved') ||
    lower.includes('updated') ||
    lower.includes('created') ||
    lower.includes('added') ||
    lower.includes('deleted') ||
    lower.includes('verified') ||
    lower.includes('welcome') ||
    lower.includes('exported') ||
    lower.includes('copied') ||
    lower.includes('approved') ||
    lower.includes('sent')
  ) {
    return toast.success(text);
  }

  if (lower.includes('warning') || lower.includes('caution') || lower.includes('required') || lower.includes('missing')) {
    return toast.warning(text);
  }

  return toast.info(text);
}

/**
 * Toast Container component
 * Mount once at application root
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToastEvent = (e) => {
      const toastItem = e.detail;
      if (!toastItem || !toastItem.message) return;

      setToasts((prev) => {
        // Limit max concurrent toasts to 5
        const updated = [...prev, toastItem];
        return updated.slice(-5);
      });

      // Auto-dismiss
      const timeoutId = setTimeout(() => {
        removeToast(toastItem.id);
      }, toastItem.duration || 4000);

      return () => clearTimeout(timeoutId);
    };

    window.addEventListener('podar-toast', handleToastEvent);
    return () => window.removeEventListener('podar-toast', handleToastEvent);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="podar-toast-container" aria-live="polite" role="region">
      {toasts.map((t) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';

        return (
          <div
            key={t.id}
            className={`podar-toast-item ${t.type}`}
            role="alert"
          >
            <div className="podar-toast-icon">
              {isSuccess && <CheckCircle2 size={19} color="#15803d" />}
              {isError && <AlertCircle size={19} color="#b91c1c" />}
              {isWarning && <AlertTriangle size={19} color="#b45309" />}
              {!isSuccess && !isError && !isWarning && <Info size={19} color="#0284c7" />}
            </div>

            <div className="podar-toast-content">
              <div className="podar-toast-title">
                {isSuccess && 'Success'}
                {isError && 'Error'}
                {isWarning && 'Notice'}
                {!isSuccess && !isError && !isWarning && 'Information'}
              </div>
              <div className="podar-toast-msg">{t.message}</div>
            </div>

            <button
              type="button"
              className="podar-toast-close"
              onClick={() => removeToast(t.id)}
              aria-label="Close notification"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
