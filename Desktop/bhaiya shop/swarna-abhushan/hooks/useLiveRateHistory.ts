import { useQuery } from '@tanstack/react-query';
import { fetchRateHistory } from '../lib/live-rates';

export const useLiveRateHistory = (metal: string, days: number) => {
  return useQuery({
    queryKey: ['live-rate-history', metal, days],
    queryFn: () => fetchRateHistory(metal, days),
    staleTime: 1000 * 60 * 5,
    retry: false,
    enabled: !!metal && days > 0,
  });
};
