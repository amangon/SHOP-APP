import { withTimeout } from './supabase';

const AIB_URL =
  'https://allindiabullion.com/gold-rate/uttar-pradesh/lucknow';

export interface LiveRate {
  metal: string;
  purity: string;
  price_per_gram: number;
  price_per_10_gram: number;
}

export interface LiveRatesResponse {
  location: string;
  currency: string;
  rate_type: string;
  source: string;
  updated_at: string;
  rates: LiveRate[];
}

const isValidNumber = (value: unknown): value is number => {
  return (
    typeof value === 'number' &&
    Number.isFinite(value) &&
    value > 0
  );
};

const parseNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return isValidNumber(value) ? value : null;
  }

  const cleaned = String(value ?? '')
    .replace(/₹/g, '')
    .replace(/,/g, '')
    .trim();

  if (!cleaned) return null;

  const number = Number(cleaned);

  return isValidNumber(number) ? number : null;
};

const extractJsonLd = (html: string): unknown[] => {
  const blocks: unknown[] = [];

  const regex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  for (const match of html.matchAll(regex)) {
    const raw = match[1]?.trim();

    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        blocks.push(...parsed);
      } else {
        blocks.push(parsed);
      }
    } catch {
      // Ignore malformed JSON-LD blocks.
    }
  }

  return blocks;
};

const findDataset = (
  value: unknown
): Record<string, unknown>[] => {
  const result: Record<string, unknown>[] = [];

  const visit = (item: unknown) => {
    if (!item || typeof item !== 'object') {
      return;
    }

    if (Array.isArray(item)) {
      for (const child of item) {
        visit(child);
      }
      return;
    }

    const object =
      item as Record<string, unknown>;

    const type = object['@type'];

    if (
      type === 'Dataset' ||
      (Array.isArray(type) &&
        type.includes('Dataset'))
    ) {
      result.push(object);
    }

    if (object['@graph']) {
      visit(object['@graph']);
    }
  };

  visit(value);

  return result;
};

const parseAIBRates = (
  html: string
): LiveRatesResponse => {
  const values = {
    goldRetail999: null as number | null,
    gold24k: null as number | null,
    gold22k: null as number | null,
    gold18k: null as number | null,
    silver999: null as number | null,
    updatedAt: null as string | null,
  };

  const jsonLdBlocks = extractJsonLd(html);

  for (const block of jsonLdBlocks) {
    const datasets = findDataset(block);

    for (const dataset of datasets) {
      const temporalCoverage =
        dataset.temporalCoverage;

      if (
        typeof temporalCoverage === 'string'
      ) {
        const date = new Date(
          temporalCoverage
        );

        if (!Number.isNaN(date.getTime())) {
          values.updatedAt =
            date.toISOString();
        }
      }

      const variables =
        dataset.variableMeasured;

      if (!Array.isArray(variables)) {
        continue;
      }

      for (const item of variables) {
        if (
          !item ||
          typeof item !== 'object'
        ) {
          continue;
        }

        const variable =
          item as Record<string, unknown>;

        const name = String(
          variable.name ?? ''
        )
          .trim()
          .toLowerCase();

        const value =
          parseNumber(variable.value);

        if (!value) continue;

        if (
          name === 'gold retail 999'
        ) {
          values.goldRetail999 = value;
        } else if (
          name === 'silver retail 999'
        ) {
          values.silver999 = value;
        } else if (
          name === '24k gold per 10 grams'
        ) {
          values.gold24k = value;
        } else if (
          name === '22k gold per 10 grams'
        ) {
          values.gold22k = value;
        } else if (
          name === '18k gold per 10 grams'
        ) {
          values.gold18k = value;
        }
      }
    }
  }

  /*
   * AIB's explicit 24K value has priority.
   * Gold Retail 999 is fallback.
   */
  const gold24kPer10g =
    values.gold24k ??
    values.goldRetail999;

  if (!gold24kPer10g) {
    throw new Error(
      'AIB 24K / Gold Retail 999 rate not found'
    );
  }

  if (!values.silver999) {
    throw new Error(
      'AIB Silver Retail 999 rate not found'
    );
  }

  const gold22kPer10g =
    values.gold22k ??
    (gold24kPer10g * 22) / 24;

  const gold18kPer10g =
    values.gold18k ??
    (gold24kPer10g * 18) / 24;

  const gold24kPerGram =
    gold24kPer10g / 10;

  const gold22kPerGram =
    gold22kPer10g / 10;

  const gold18kPerGram =
    gold18kPer10g / 10;

  const silverPerGram =
    values.silver999 / 1000;

  const rates: LiveRate[] = [
    {
      metal: 'gold24k',
      purity: '24K',
      price_per_gram: Number(
        gold24kPerGram.toFixed(2)
      ),
      price_per_10_gram: Number(
        gold24kPer10g.toFixed(2)
      ),
    },
    {
      metal: 'gold22k',
      purity: '22K',
      price_per_gram: Number(
        gold22kPerGram.toFixed(2)
      ),
      price_per_10_gram: Number(
        gold22kPer10g.toFixed(2)
      ),
    },
    {
      metal: 'gold18k',
      purity: '18K',
      price_per_gram: Number(
        gold18kPerGram.toFixed(2)
      ),
      price_per_10_gram: Number(
        gold18kPer10g.toFixed(2)
      ),
    },
    {
      metal: 'silver',
      purity: 'Silver 999',
      price_per_gram: Number(
        silverPerGram.toFixed(2)
      ),
      price_per_10_gram: Number(
        (silverPerGram * 10).toFixed(2)
      ),
    },
  ];

  return {
    location: 'Lucknow',
    currency: 'INR',
    rate_type:
      'AIB Lucknow live retail reference rate',
    source: 'All India Bullion',
    updated_at:
      values.updatedAt ??
      new Date().toISOString(),
    rates,
  };
};

export const fetchLiveRates =
  async (): Promise<LiveRatesResponse> => {
    const response = await withTimeout(
      fetch(AIB_URL, {
        method: 'GET',
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'Cache-Control': 'no-cache',
        },
      }),
      15000,
      'AIB live rates'
    );

    if (!response.ok) {
      throw new Error(
        `AIB returned HTTP ${response.status}`
      );
    }

    const html =
      await response.text();

    if (!html || html.length < 500) {
      throw new Error(
        'AIB returned an invalid response'
      );
    }

    return parseAIBRates(html);
  };