'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import styles from './page.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    if (!supabase) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setLoading(false);
  }

  return (
    <div className={styles.page}>
      <div className={styles.imagePanel}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=80"
          alt=""
          className={styles.heroImage}
        />
        <div className={styles.imageOverlay} />
        <div className={styles.imageContent}>
          <blockquote className={styles.quote}>
            &ldquo;The world is a book, and those who do not travel read only one page.&rdquo;
          </blockquote>
          <cite className={styles.attribution}>Saint Augustine</cite>
        </div>
      </div>

      <div className={styles.formPanel}>
        <div className={styles.formInner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>✈️</span>
            <span className={styles.brandName}>We Off</span>
          </div>

          <div className={styles.copy}>
            <h1 className={styles.headline}>Trip planning,<br />together.</h1>
            <p className={styles.subline}>
              Coordinate flights, stays, activities, and expenses with your travel crew — all in one place.
            </p>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.googleBtn}
              onClick={signInWithGoogle}
              disabled={loading}
              type="button"
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Signing in…' : 'Continue with Google'}
            </button>
            <p className={styles.terms}>
              By continuing, you agree to our terms. No spam, ever.
            </p>
          </div>

          <div className={styles.features}>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🗺️</span>
              <span>Collaborative itineraries</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>💰</span>
              <span>Expense splitting</span>
            </div>
            <div className={styles.feature}>
              <span className={styles.featureIcon}>🤖</span>
              <span>AI travel assistant</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
