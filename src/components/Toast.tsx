import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastItem {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

let toastId = 0;

/** Fire a toast from anywhere: window.dispatchEvent(new CustomEvent('toast', { detail: { type, message } })) */
export function toast(type: ToastItem['type'], message: string) {
  window.dispatchEvent(new CustomEvent('toast', { detail: { type, message } }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((e: Event) => {
    const { type, message } = (e as CustomEvent).detail;
    const id = ++toastId;
    setToasts(prev => [...prev.slice(-2), { id, type, message }]); // max 3
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3200);
  }, []);

  useEffect(() => {
    window.addEventListener('toast', addToast);
    return () => window.removeEventListener('toast', addToast);
  }, [addToast]);

  const colorMap = {
    success: { bg: 'var(--success)', border: 'rgba(34,197,94,0.4)', icon: '✅' },
    error:   { bg: 'var(--danger)',  border: 'rgba(239,68,68,0.4)', icon: '❌' },
    info:    { bg: 'var(--accent)',  border: 'rgba(255,107,53,0.4)', icon: '💡' },
  };

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column-reverse', gap: 8, pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {toasts.map(t => {
          const c = colorMap[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 18px', borderRadius: 'var(--radius)',
                background: 'var(--bg-secondary)', border: `1px solid ${c.border}`,
                boxShadow: `0 8px 24px rgba(0,0,0,0.5), 0 0 12px ${c.border}`,
                fontSize: '0.84rem', fontWeight: 500, color: 'var(--text-primary)',
                pointerEvents: 'auto', maxWidth: 340, backdropFilter: 'blur(12px)',
              }}
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{c.icon}</span>
              <span style={{ flex: 1 }}>{t.message}</span>
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                borderRadius: '0 0 var(--radius) var(--radius)', overflow: 'hidden',
              }}>
                <motion.div
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 3, ease: 'linear' }}
                  style={{ height: '100%', background: c.bg, opacity: 0.6 }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
