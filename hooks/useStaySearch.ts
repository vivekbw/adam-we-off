'use client';

import { useState, useCallback, useRef } from 'react';
import type { AmadeusHotelOffer } from '@/lib/constants';

interface StaySearchState {
  offers: AmadeusHotelOffer[];
  loading: boolean;
  error: string | null;
  cityIata: string | null;
}

export function useStaySearch() {
  const [state, setState] = useState<StaySearchState>({
    offers: [],
    loading: false,
    error: null,
    cityIata: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (
      city: string,
      checkIn: string,
      checkOut: string,
      adults = 1,
      ratings?: number[],
      amenities?: string[]
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setState({
        offers: [],
        loading: true,
        error: null,
        cityIata: null,
      });

      try {
        const res = await fetch('/api/stays/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ city, checkIn, checkOut, adults, ratings, amenities }),
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
          cityIata: data.cityIata ?? null,
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
      cityIata: null,
    });
  }, []);

  return { ...state, search, clear };
}
