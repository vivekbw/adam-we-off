'use client';

import Link from 'next/link';
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
      {showActions && (
        <div className={styles.right}>
          <button type="button" className={styles.actionBtn} onClick={onBuddiesClick}>
            Add Travel Buddies
          </button>
          <button type="button" className={styles.actionBtn} onClick={onSplitClick}>
            Split Costs
          </button>
        </div>
      )}
    </header>
  );
}
