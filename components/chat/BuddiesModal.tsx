'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/layout/Modal';
import { BUDDIES } from '@/lib/constants';
import styles from './BuddiesModal.module.css';

export interface BuddiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId?: string;
}

export function BuddiesModal({ isOpen, onClose, tripId }: BuddiesModalProps) {
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && tripId) {
      setInviteLink(window.location.origin + '/invite/' + tripId);
    }
  }, [tripId]);

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = inviteLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Modal title="Trip Buddies" isOpen={isOpen} onClose={onClose}>
      <div className={styles.inviteSection}>
        <label className={styles.inviteLabel}>Invite link</label>
        <div className={styles.inviteRow}>
          <input
            type="text"
            className={styles.inviteInput}
            value={inviteLink}
            readOnly
          />
          <button
            type="button"
            className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ''}`}
            onClick={handleCopy}
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
      <label className={styles.membersLabel}>Current members</label>
      <div className={styles.membersList}>
        {BUDDIES.map((buddy) => (
          <div key={buddy.id} className={styles.memberRow}>
            <div
              className={styles.avatar}
              style={{ backgroundColor: buddy.color }}
            >
              {buddy.avatar}
            </div>
            <div className={styles.memberInfo}>
              <div className={styles.memberName}>{buddy.name}</div>
              <span className={styles.editorTag}>Editor</span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
