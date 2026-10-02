export interface LiveRateHistoryEntry {
  metal: string;
  purity: string;
  price: number;
  price_per_gram: number;
  price_per_10_gram: number;
  source: string;
  recorded_at: string;
}

const isValidRate = (value: unknown): value is number =>
  typeof value === 'number' &&
  !Number.isNaN(value) &&
  Number.isFinite(value) &&
  value > 0;

export const recordLiveRateHistory = async (entries: {
  metal: string;
  purity: string;
  pricePerGram: number;
  pricePer10Gram: number;
  source: string;
}[]): Promise<void> => {
  try {
    const { supabase } = await import('./supabase');

  const validEntries = entries.filter((entry) => {
    const valid =
      isValidRate(entry.pricePerGram) &&
      isValidRate(entry.pricePer10Gram) &&
      entry.pricePer10Gram > 0 &&
      entry.pricePerGram > 0 &&
      (entry.source === 'AIB' || entry.source === 'All India Bullion');
    return valid;
  });

    if (!validEntries.length) {
      return;
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

    const rowsToInsert: any[] = [];

    for (const entry of validEntries) {
      const pricePerGram = Number(entry.pricePerGram);
      const pricePer10Gram = Number(entry.pricePer10Gram);

      if (
        !Number.isFinite(pricePerGram) ||
        !Number.isFinite(pricePer10Gram) ||
        pricePerGram <= 0 ||
        pricePer10Gram <= 0
      ) {
        console.warn('Skipping invalid live rate', {
          metal: entry.metal,
          pricePerGram,
          pricePer10Gram,
        });
        continue;
      }

      const { data: recentRows } = await supabase
        .from('live_rate_history')
        .select('price_per_10_gram, recorded_at')
        .eq('metal', entry.metal)
        .eq('purity', entry.purity)
        .gte('recorded_at', fiveMinutesAgo)
        .order('recorded_at', { ascending: false })
        .limit(1);

      const isDuplicate = recentRows && recentRows.length > 0
        && Number(recentRows[0].price_per_10_gram) === Number(pricePer10Gram.toFixed(2));

      if (!isDuplicate) {
        rowsToInsert.push({
          metal: entry.metal,
          purity: entry.purity,
          price: pricePer10Gram,
          price_per_gram: pricePerGram,
          price_per_10_gram: pricePer10Gram,
          source: entry.source,
          recorded_at: new Date().toISOString(),
        });
      }
    }

    if (!rowsToInsert.length) {
      return;
    }

    const { error } = await supabase
      .from('live_rate_history')
      .insert(rowsToInsert);

    if (error) {
      console.error('[LIVE RATE HISTORY] Failed to record live rate history:', error);
    }
  } catch (error) {
    console.error('[LIVE RATE HISTORY] Error recording live rate history:', error);
  }
};

export const fetchLiveRateHistory = async (
  metal: string,
  days: number
): Promise<LiveRateHistoryEntry[]> => {
  try {
    const { supabase } = await import('./supabase');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('live_rate_history')
      .select('metal, purity, price, price_per_gram, price_per_10_gram, source, recorded_at')
      .eq('metal', metal)
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    const seen = new Set<string>();
    const deduped: LiveRateHistoryEntry[] = [];

    for (const row of data) {
      const key = `${row.metal}-${row.purity}-${Number(row.price_per_10_gram)}-${row.recorded_at?.slice(0, 16)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const price = Number(row.price ?? row.price_per_10_gram ?? 0);
      const pricePerGram = Number(row.price_per_gram ?? 0);
      const pricePer10Gram = Number(row.price_per_10_gram ?? price * 10);

      if (!isValidRate(price) && !isValidRate(pricePer10Gram)) continue;

      deduped.push({
        metal: row.metal,
        purity: row.purity,
        price: isValidRate(price) ? price : pricePer10Gram,
        price_per_gram: pricePerGram,
        price_per_10_gram: isValidRate(pricePer10Gram) ? pricePer10Gram : price * 10,
        source: row.source,
        recorded_at: row.recorded_at,
      });
    }

    return deduped;
  } catch (error) {
    console.error('Error fetching live rate history:', error);
    return [];
  }
};
