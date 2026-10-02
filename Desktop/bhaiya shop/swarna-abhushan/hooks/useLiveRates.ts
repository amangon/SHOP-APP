import { useQuery } from '@tanstack/react-query';

import {
  fetchLiveRates,
  type LiveRatesResponse,
  type LiveRateEntry,
  getDisplayPrice,
  getWeightLabel,
} from '../lib/live-rates';

export const useLiveRates = (refetchInterval = 30000) => {
  return useQuery<LiveRatesResponse, Error>({
    queryKey: ['live-rates', 'lucknow'],
    queryFn: fetchLiveRates,

    staleTime: 15000,
    gcTime: 5 * 60 * 1000,

    refetchInterval,
    refetchIntervalInBackground: false,

    refetchOnWindowFocus: false,
    refetchOnReconnect: true,

    retry: 1,
    retryDelay: 2000,
  });
};

export {
  getDisplayPrice,
  getWeightLabel,
};

export type {
  LiveRateEntry,
  LiveRatesResponse,
};