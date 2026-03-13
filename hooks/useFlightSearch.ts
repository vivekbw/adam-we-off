'use client';

import { useState, useCallback, useRef } from 'react';
import type { AmadeusFlightOffer } from '@/lib/constants';

interface FlightSearchState {
  offers: AmadeusFlightOffer[];
  loading: boolean;
  error: string | null;
  originIata: string | null;
  destIata: string | null;
}

export function useFlightSearch() {
  const [state, setState] = useState<FlightSearchState>({
    offers: [],
    loading: false,
    error: null,
    originIata: null,
    destIata: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (from: string, to: string, date: string, adults = 1) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        offers: [],
        loading: true,
        error: null,
        originIata: null,
        destIata: null,
      });

      try {
        const res = await fetch('/api/flights/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to, date, adults }),
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          setState((s) => ({
            ...s,
            loading: false,
            error: data.error ?? 'Search failed',
          }));
          return;
        }

        setState({
          offers: data.offers ?? [],
          loading: false,
          error: null,
          originIata: data.originIata ?? null,
          destIata: data.destIata ?? null,
        });
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setState((s) => ({
          ...s,
          loading: false,
          error: 'Network error',
        }));
      }
    },
    []
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setState({
      offers: [],
      loading: false,
      error: null,
      originIata: null,
      destIata: null,
    });
  }, []);

  return { ...state, search, clear };
}
