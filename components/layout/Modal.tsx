'use client';

import { useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Modal.module.css';

export interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  title: string;
  wide?: boolean;
  isOpen: boolean;
}

export function Modal({ children, onClose, title, wide = false, isOpen }: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            className={`${styles.card} ${wide ? styles.cardWide : styles.cardDefault}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className={styles.header}>
              <h2 id="modal-title" className={styles.title}>
                {title}
              </h2>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onClose}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className={styles.body}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
