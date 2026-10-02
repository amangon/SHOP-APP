import { supabase } from './supabase';

export interface LiveRateEntry {
  metal: 'gold24k' | 'gold22k' | 'gold18k' | 'silver';
  purity: string;
  price_per_gram: number;
  price_per_10_gram: number;
  pricePer10Gram?: number;
}

export interface LiveRatesResponse {
  location: string;
  currency: string;
  rate_type: string;
  source: string;
  updated_at: string;
  rates: LiveRateEntry[];
}

export interface MetalRateEntry {
  metal: 'gold24k' | 'gold22k' | 'gold18k' | 'silver';
  label: string;
  purity: string;
  pricePerGram: number | null;
  pricePer10Gram: number | null;
  unit: string;
  updatedAt: string | null;
  icon: string;
  accent: string;
  iconColor: string;
  isLive: boolean;
}

const AIB_URL =
  'https://allindiabullion.com/gold-rate/uttar-pradesh/lucknow';

const log = (...args: any[]) => {
  console.log('[LIVE-RATES]', ...args);
};

const toNumber = (value: any): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const isValidRate = (value: number): boolean => {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    !Number.isNaN(value) &&
    value > 0
  );
};

const isRealisticBullionRate = (value: number, metal: 'gold' | 'silver'): boolean => {
  if (!isValidRate(value)) return false;
  if (metal === 'silver') {
    return value > 0 && value < 50000;
  }
  return value > 0 && value < 500000;
};

const normalizePerGram = (
  price: number,
  unit?: string | null,
): number => {
  const value = toNumber(price);
  const normalizedUnit = String(unit || '').toLowerCase();

  if (normalizedUnit.includes('kg')) {
    return value / 1000;
  }

  if (
    normalizedUnit.includes('10g') ||
    normalizedUnit.includes('10 gram') ||
    normalizedUnit.includes('10-gram')
  ) {
    return value / 10;
  }

  return value;
};

const buildRate = (
  metal: LiveRateEntry['metal'],
  purity: string,
  perGram: number,
): LiveRateEntry => ({
  metal,
  purity,
  price_per_gram: Number(perGram.toFixed(2)),
  price_per_10_gram: Number((perGram * 10).toFixed(2)),
});

const extractJsonLd = (html: string): Array<{ name: string; value: number }> => {
  const results: Array<{ name: string; value: number }> = [];

  const matches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  const walk = (value: any) => {
    if (!value) return;

    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }

    if (typeof value !== 'object') return;

    const name = typeof value.name === 'string' ? value.name : '';
    const numericValue = Number(value.value);

    if (
      name &&
      Number.isFinite(numericValue) &&
      Number.isFinite(Number(value.value))
    ) {
      results.push({
        name: name.trim(),
        value: numericValue,
      });
    }

    Object.values(value).forEach(walk);
  };

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1]);
      walk(parsed);
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }

  return results;
};

const findValue = (
  items: Array<{ name: string; value: number }>,
  names: string[],
): number | null => {
  for (const wanted of names) {
    const found = items.find(
      (item) =>
        item.name.trim().toLowerCase() === wanted.trim().toLowerCase(),
    );

    if (found && Number.isFinite(found.value)) {
      return found.value;
    }
  }

  return null;
};

const fetchAIBRates = async (): Promise<LiveRatesResponse | null> => {
  try {
    log('Fetching AIB Lucknow...');

    const response = await fetch(`${AIB_URL}?_=${Date.now()}`, {
      method: 'GET',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
    });

    log('AIB HTTP:', response.status);

    if (!response.ok) {
      throw new Error(`AIB HTTP ${response.status}`);
    }

    const html = await response.text();

    log('AIB HTML:', html.length, 'characters');

    const jsonLd = extractJsonLd(html);

    const gold24Per10g =
      findValue(jsonLd, [
        '24K gold per 10 grams',
        '24k gold per 10 grams',
      ]) ??
      findValue(jsonLd, [
        'Gold Retail 999',
      ]);

    const silverPerKg =
      findValue(jsonLd, [
        'Silver Retail 999',
      ]);

    if (!gold24Per10g || !silverPerKg) {
      throw new Error('AIB required rates not found');
    }

    const gold24PerGram = gold24Per10g / 10;
    const silverPerGram = silverPerKg / 1000;

    if (!isValidRate(gold24PerGram)) {
      throw new Error('AIB gold rate invalid');
    }

    if (!isRealisticBullionRate(silverPerGram, 'silver')) {
      throw new Error('AIB silver rate invalid or zero');
    }

    const rates: LiveRateEntry[] = [
      buildRate('gold24k', '24K', gold24PerGram),
      buildRate('gold22k', '22K', gold24PerGram * (22 / 24)),
      buildRate('gold18k', '18K', gold24PerGram * (18 / 24)),
      buildRate('silver', 'Silver 999', silverPerGram),
    ];

    log('AIB SUCCESS:', rates);

    return {
      location: 'Lucknow',
      currency: 'INR',
      rate_type: 'AIB Lucknow live retail reference rate',
      source: 'All India Bullion',
      updated_at: new Date().toISOString(),
      rates,
    };
  } catch (error) {
    log('AIB failed:', error);
    return null;
  }
};

const fetchDatabaseFallback = async (): Promise<LiveRatesResponse> => {
  log('Using Supabase gold_rates fallback...');

  const { data, error } = await supabase
    .from('gold_rates')
    .select('*')
    .eq('is_current', true)
    .order('effective_date', { ascending: false });

  if (error) {
    throw error;
  }

  const rows = Array.isArray(data) ? data : [];

  const goldRows = rows.filter((row: any) =>
    String(row?.metal_name || '').toLowerCase().includes('gold'),
  );

  const silverRows = rows.filter((row: any) =>
    String(row?.metal_name || '').toLowerCase().includes('silver'),
  );

  const gold24 =
    goldRows.find((row: any) =>
      String(row?.purity || '').toLowerCase().includes('24'),
    ) || goldRows[0];

  const silver = silverRows[0];

  const rates: LiveRateEntry[] = [];

  if (gold24) {
    const goldPerGram = normalizePerGram(
      toNumber(gold24.price),
      gold24.unit,
    );

    if (goldPerGram > 0) {
      rates.push(
        buildRate('gold24k', '24K', goldPerGram),
        buildRate('gold22k', '22K', goldPerGram * (22 / 24)),
        buildRate('gold18k', '18K', goldPerGram * (18 / 24)),
      );
    }
  }

  if (silver) {
    const silverPerGram = normalizePerGram(
      toNumber(silver.price),
      silver.unit,
    );

    if (isRealisticBullionRate(silverPerGram, 'silver')) {
      rates.push(
        buildRate('silver', 'Silver 999', silverPerGram),
      );
    }
  }

  if (rates.length === 0) {
    throw new Error('No current rates found in gold_rates');
  }

  log('DB FALLBACK SUCCESS:', rates);

  return {
    location: 'Lucknow',
    currency: 'INR',
    rate_type: 'Current stored metal rate',
    source: 'Supabase',
    updated_at:
      gold24?.updated_at ||
      silver?.updated_at ||
      new Date().toISOString(),
    rates,
  };
};

export interface RateHistoryPoint {
  date: string;
  price: number;
  price_per_10_gram: number;
  recorded_at: string;
  metal: string;
}

export const fetchRateHistory = async (
  metal: string,
  days: number,
): Promise<RateHistoryPoint[]> => {
  try {
    const { supabase: sb } = await import('./supabase');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await sb
      .from('live_rate_history')
      .select('metal, purity, price, price_per_gram, price_per_10_gram, source, recorded_at')
      .eq('metal', metal)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    const seen = new Set<string>();
    const deduped: RateHistoryPoint[] = [];

    for (const row of data) {
      const key = `${row.metal}-${row.purity}-${Number(row.price_per_10_gram)}-${row.recorded_at?.slice(0, 16)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const price = Number(row.price ?? row.price_per_10_gram ?? 0);
      const pricePerGram = Number(row.price_per_gram ?? 0);
      const pricePer10Gram = Number(row.price_per_10_gram ?? price * 10);

      if (!isValidRate(price) && !isValidRate(pricePer10Gram)) continue;

      deduped.push({
        date: row.recorded_at,
        price: isValidRate(pricePerGram) ? pricePerGram : price / 10,
        price_per_10_gram: isValidRate(pricePer10Gram) ? pricePer10Gram : price,
        recorded_at: row.recorded_at,
        metal: row.metal,
      });
    }

    return deduped;
  } catch (error) {
    if (__DEV__) {
      console.error('Error fetching live rate history:', error);
    }
    return [];
  }
};

export const fetchLiveRates = async (): Promise<LiveRatesResponse> => {
  log('================================');
  log('Fetching live rates...');
  log('================================');

  const aibRates = await fetchAIBRates();

  if (aibRates) {
    return aibRates;
  }

  log('AIB unavailable, switching to DB fallback...');

  return fetchDatabaseFallback();
};

export const getDisplayPrice = (
  entry: LiveRateEntry,
  weight: number,
): number => {
  const perGram = toNumber(entry?.price_per_gram);
  return Number((perGram * weight).toFixed(2));
};

export const getWeightLabel = (
  metal: string,
  weight: number,
): string => {
  if (String(metal).toLowerCase() === 'silver') {
    if (weight === 1000) return '1 kg';
    if (weight === 500) return '500 gram';
  }

  if (Math.abs(weight - 11.66) < 0.01) return '11.66 gram';
  if (weight === 10) return '10 gram';
  if (weight === 5) return '5 gram';
  if (weight === 1) return '1 gram';

  return `${weight} gram`;
};