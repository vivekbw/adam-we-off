'use client';

import type { ReactNode } from 'react';
import styles from './Tag.module.css';

export type TagVariant = 'green' | 'yellow' | 'blue' | 'red';

export interface TagProps {
  variant: TagVariant;
  children: ReactNode;
  className?: string;
}

export function Tag({ variant, children, className }: TagProps) {
  const classNames = [styles.tag, styles[variant], className].filter(Boolean).join(' ');

  return <span className={classNames}>{children}</span>;
}
