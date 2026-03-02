'use client';

import styles from './ValidationWarnings.module.css';

export interface ValidationWarning {
  type: string;
  msg: string;
  icon: string;
}

const DEFAULT_WARNINGS: ValidationWarning[] = [
  {
    type: 'warning',
    msg: 'Bangkok BKK → DPS departs 12:40pm on Jun 7 — confirm hotel checkout time vs ~1.5h airport travel',
    icon: '⚠️',
  },
  {
    type: 'warning',
    msg: 'Vietnam e-visa: apply at least 3 days before May 29',
    icon: '📋',
  },
  {
    type: 'info',
    msg: 'Phi Phi → Bali connection on Jun 9 — boat + flight same day, confirm timing',
    icon: '⏱️',
  },
  {
    type: 'warning',
    msg: 'Uluwatu stay (Jun 11–13) not yet booked — 2 nights unaccounted',
    icon: '🛏️',
  },
  {
    type: 'alert',
    msg: 'Adam: shellfish allergy — Phi Phi seafood scene, flag when booking',
    icon: '🚨',
  },
];

export interface ValidationWarningsProps {
  warnings?: ValidationWarning[];
}

export function ValidationWarnings({
  warnings = DEFAULT_WARNINGS,
}: ValidationWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.title}>Heads Up</span>
        <span className={styles.count}>{warnings.length}</span>
      </div>
      <div className={styles.list}>
        {warnings.map((w, i) => (
          <div key={i} className={`${styles.item} ${styles[w.type] ?? ''}`}>
            <span className={styles.icon}>{w.icon}</span>
            <span className={styles.msg}>{w.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
