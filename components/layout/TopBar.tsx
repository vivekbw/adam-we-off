'use client';

import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import styles from './TopBar.module.css';

export interface TopBarProps {
  pathname: string;
  tripName?: string;
  onBuddiesClick: () => void;
  onSplitClick: () => void;
}

export function TopBar({ pathname, tripName, onBuddiesClick, onSplitClick }: TopBarProps) {
  const isHome = pathname === '/';
  const showBreadcrumb = !isHome;
  const showActions = !isHome;
  const { user, loading, signOut } = useUser();

  return (
    <header className={styles.bar}>
      <div className={styles.left}>
        <Link href="/" className={styles.logo}>
          ✈️ We Off
        </Link>
        {showBreadcrumb && (
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link href="/" className={styles.breadcrumbLink}>
              Home
            </Link>
            <span className={styles.separator}>/</span>
            <span>{tripName ?? 'Trip Overview'}</span>
          </nav>
        )}
      </div>
      <div className={styles.right}>
        {showActions && (
          <>
            <button type="button" className={styles.actionBtn} onClick={onBuddiesClick}>
              Travelers
            </button>
            <button type="button" className={styles.actionBtn} onClick={onSplitClick}>
              Split Costs
            </button>
          </>
        )}
        {!loading && user && (
          <div className={styles.userSection}>
            {user.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt=""
                className={styles.userAvatar}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={styles.userAvatarFallback}>
                {(user.email ?? '?')[0].toUpperCase()}
              </div>
            )}
            <button
              type="button"
              className={styles.signOutBtn}
              onClick={signOut}
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
        {!loading && !user && (
          <Link href="/login" className={styles.actionBtn}>
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
