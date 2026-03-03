'use client';

import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Copy, Check, Link2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useBuddies, type BuddyRow } from '@/hooks/useBuddies';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import styles from './BuddiesModal.module.css';

export interface BuddiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId?: string;
  onBuddyAdded?: (name: string) => void;
  onBuddyRemoved?: (name: string) => void;
}

export function BuddiesModal({ isOpen, onClose, tripId, onBuddyAdded, onBuddyRemoved }: BuddiesModalProps) {
  const { buddies, addBuddy, removeBuddy } = useBuddies(tripId ?? '');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && tripId) {
      setInviteLink(`${window.location.origin}/invite/${tripId}`);
    }
  }, [tripId]);

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    await addBuddy({ name: trimmed, email: email.trim() || undefined });
    setName('');
    setEmail('');
    toast.success(`${trimmed} added`);
    onBuddyAdded?.(trimmed);
  }

  async function handleRemove(buddy: BuddyRow) {
    await removeBuddy(buddy.id);
    toast.success(`${buddy.name} removed`);
    onBuddyRemoved?.(buddy.name);
  }

  async function handleCopy() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  }

  const activeBuddies = buddies.filter((b) => b.status === 'active');
  const invitedBuddies = buddies.filter((b) => b.status === 'invited');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Travelers</DialogTitle>
        </DialogHeader>

        <div className={styles.section}>
          <Label className={styles.sectionLabel}>Add a traveler</Label>
          <div className={styles.addForm}>
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Input
              placeholder="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <Button onClick={handleAdd} disabled={!name.trim()} size="sm">
              <UserPlus size={15} />
              Add
            </Button>
          </div>
        </div>

        {activeBuddies.length > 0 && (
          <div className={styles.section}>
            <Label className={styles.sectionLabel}>
              Members ({activeBuddies.length})
            </Label>
            <div className={styles.membersList}>
              {activeBuddies.map((buddy) => (
                <div key={buddy.id} className={styles.memberRow}>
                  <div
                    className={styles.avatar}
                    style={{ backgroundColor: buddy.color }}
                  >
                    {buddy.avatar ?? buddy.name[0]}
                  </div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>{buddy.name}</div>
                    <span className={styles.roleTag}>{buddy.role}</span>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className={styles.removeBtn}>
                        <Trash2 size={14} />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove {buddy.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          They will lose access to this trip.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleRemove(buddy)}>
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </div>
        )}

        {invitedBuddies.length > 0 && (
          <div className={styles.section}>
            <Label className={styles.sectionLabel}>
              Invited ({invitedBuddies.length})
            </Label>
            <div className={styles.membersList}>
              {invitedBuddies.map((buddy) => (
                <div key={buddy.id} className={styles.memberRow}>
                  <div className={styles.avatarInvited}>
                    <Mail size={14} />
                  </div>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberName}>{buddy.name}</div>
                    {buddy.email && (
                      <span className={styles.memberEmail}>{buddy.email}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={styles.removeBtn}
                    onClick={() => handleRemove(buddy)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {buddies.length === 0 && (
          <div className={styles.emptyState}>
            <UserPlus size={24} strokeWidth={1.5} />
            <p>No travelers yet. Add someone above to get started.</p>
          </div>
        )}

        <div className={styles.section}>
          <Label className={styles.sectionLabel}>
            <Link2 size={13} /> Invite link
          </Label>
          <div className={styles.inviteRow}>
            <Input value={inviteLink} readOnly className={styles.inviteInput} />
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
