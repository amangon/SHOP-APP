import { useEffect, useRef, useState } from 'react';

export interface LiveRateRealtimeUpdate {
  metal: string;
  purity: string;
  price_per_gram: number;
  price_per_10_gram: number;
  updated_at: string;
}

/**
 * Supabase Realtime is intentionally disabled.
 *
 * Live rates are now handled by:
 *
 * AIB
 * ↓
 * lib/live-rates.ts
 * ↓
 * hooks/useLiveRates.ts
 * ↓
 * 5-second polling
 *
 * This hook is kept only for backwards compatibility
 * so existing imports do not break.
 */
export const useLiveRateRealtime = (
  _onUpdate: (data: LiveRateRealtimeUpdate) => void,
  enabled: boolean = true
) => {
  const [isConnected, setIsConnected] =
    useState(false);

  const onUpdateRef =
    useRef(_onUpdate);

  useEffect(() => {
    onUpdateRef.current = _onUpdate;
  }, [_onUpdate]);

  useEffect(() => {
    /*
     * No Supabase Realtime subscription anymore.
     *
     * The actual live-rate polling is handled by
     * useLiveRates.ts.
     */
    if (!enabled) {
      setIsConnected(false);
      return;
    }

    setIsConnected(true);

    return () => {
      setIsConnected(false);
    };
  }, [enabled]);

  return {
    isConnected,
  };
};