import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';

import { COLORS, FONT_FAMILY } from '../../constants/theme';
import {
  LoadingScreen,
  EmptyState,
  ErrorState,
} from '../../components';

import { fetchLiveRates } from '../../lib/live-rates';
import { fetchGoldRateHistoryWindow } from '../../services/api';

import { GoldRate } from '../../types';

/* =========================================================
   HELPERS
========================================================= */

const numberValue = (
  value: unknown,
  fallback = 0,
): number => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const formatMoney = (
  value: unknown,
  decimals = 2,
) => {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return '₹0.00';
  }

  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

const formatWholeMoney = (value: unknown) => {
  const n = Number(value);

  if (!Number.isFinite(n)) {
    return '₹0';
  }

  return `₹${n.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
};

const formatDateTime = (
  value?: string | null,
) => {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/* =========================================================
   AIB → APP RATE
========================================================= */

const normalizeLiveRates = (
  source: any,
): GoldRate[] => {
  const entries = Array.isArray(source?.rates)
    ? source.rates
    : [];

  return entries
    .map((item: any, index: number) => {
      const metal = String(
        item?.metal ?? '',
      )
        .trim()
        .toLowerCase();

      const purity = String(
        item?.purity ?? '',
      ).trim();

      const price = numberValue(
        item?.price_per_gram,
      );

      if (price <= 0) {
        return null;
      }

      const isSilver =
        metal.includes('silver');

      return {
        id: `aib-${isSilver ? 'silver' : 'gold'}-${purity || index}`,
        metal_name: isSilver ? 'Silver' : 'Gold',
        purity: isSilver
          ? '999'
          : purity || '24K',
        price,
        unit: 'per gram',
        effective_date:
          item?.updated_at ||
          source?.updated_at ||
          new Date().toISOString(),
        updated_at:
          item?.updated_at ||
          source?.updated_at ||
          new Date().toISOString(),
        previous_price: null,
        price_difference: null,
        price_difference_percent: null,
      } as GoldRate;
    })
    .filter(Boolean) as GoldRate[];
};

/* =========================================================
   SUMMARY CARD
========================================================= */

const RateSummaryCard = ({
  rate,
  title,
  iconColor,
  borderColor,
}: {
  rate?: GoldRate;
  title: string;
  iconColor: string;
  borderColor: string;
}) => {
  return (
    <View
      style={[
        styles.summaryCard,
        {
          borderColor,
        },
      ]}
    >
      <View style={styles.summaryHeader}>
        <View style={styles.summaryIcon}>
          <MaterialIcons
            name="workspace-premium"
            size={28}
            color={iconColor}
          />
        </View>

        <View style={styles.summaryTitleWrap}>
          <Text
            style={styles.summaryTitle}
            numberOfLines={1}
          >
            {title}
          </Text>

          <Text style={styles.summaryPurity}>
            {rate?.purity || '—'}
          </Text>
        </View>
      </View>

      <Text
        style={styles.summaryPrice}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatMoney(rate?.price)}
      </Text>

      <Text style={styles.summaryUnit}>
        per gram
      </Text>

      <View style={styles.summaryLiveRow}>
        <View style={styles.summaryLiveDot} />

        <Text style={styles.summaryLiveText}>
          Live AIB rate
        </Text>
      </View>
    </View>
  );
};

/* =========================================================
   STAT
========================================================= */

const StatBox = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statLabel}>
        {label}
      </Text>

      <Text
        style={styles.statValue}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
};

/* =========================================================
   PROFESSIONAL RATE CHART
========================================================= */

const ProfessionalRateChart = ({
  points,
  currentPrice,
  metalLabel,
}: {
  points: { price: number; recorded_at: string }[];
  currentPrice?: number;
  metalLabel: string;
}) => {
  const { width } = useWindowDimensions();

  const chartPoints = useMemo(() => {
    const clean = points
      .map((point) => ({
        price: Number(point.price),
        recorded_at: point.recorded_at,
      }))
      .filter(
        (point) =>
          Number.isFinite(point.price) &&
          point.price > 0 &&
          Boolean(point.recorded_at),
      )
      .sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() -
          new Date(b.recorded_at).getTime(),
      );

    if (
      Number.isFinite(currentPrice) &&
      Number(currentPrice) > 0
    ) {
      const last = clean[clean.length - 1];

      if (
        !last ||
        Math.abs(last.price - Number(currentPrice)) > 0.005
      ) {
        clean.push({
          price: Number(currentPrice),
          recorded_at: new Date().toISOString(),
        });
      }
    }

    return clean;
  }, [points, currentPrice]);

  const chartLineColor = metalLabel.toLowerCase().includes('silver')
    ? '#D9D9D9'
    : COLORS.gold;

  if (chartPoints.length === 0) {
    return (
      <View style={styles.chartMessage}>
        <Text style={styles.messageText}>
          No historical data available.
        </Text>
        <Text style={styles.hintText}>
          Live {metalLabel} rate is available above.
        </Text>
      </View>
    );
  }

  const cardWidth = Math.max(width - 66, 270);
  const yAxisWidth = 38;
  const rightPadding = 10;
  const plotWidth = Math.max(
    cardWidth - yAxisWidth - rightPadding,
    205,
  );
  const plotHeight = 210;

  const values = chartPoints.map((point) => point.price);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const rawRange = maxValue - minValue;
  const valuePadding =
    rawRange === 0
      ? Math.max(maxValue * 0.01, 1)
      : rawRange * 0.12;
  const minY = minValue - valuePadding;
  const maxY = maxValue + valuePadding;
  const range = Math.max(maxY - minY, 1);

  const positions = chartPoints.map((point, index) => {
    const xRatio =
      chartPoints.length === 1
        ? 0.5
        : index / (chartPoints.length - 1);
    const yRatio =
      (maxY - point.price) / range;

    return {
      ...point,
      x: yAxisWidth + xRatio * plotWidth,
      y: yRatio * (plotHeight - 30) + 12,
    };
  });

  const tickValues = Array.from(
    { length: 5 },
    (_, index) =>
      maxY - ((maxY - minY) / 4) * index,
  );

  const formatAxis = (value: number) => {
    if (value >= 100000) {
      return `₹${(value / 1000).toFixed(0)}k`;
    }
    if (value >= 1000) {
      return `₹${(value / 1000).toFixed(1)}k`;
    }
    return `₹${Math.round(value)}`;
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  };

  const firstDate = chartPoints[0].recorded_at;
  const lastDate = chartPoints[chartPoints.length - 1].recorded_at;

  return (
    <View style={styles.proChart}>
      <View style={styles.proChartLegendRow}>
        <View style={styles.proChartLegendLeft}>
          <View
            style={[
              styles.proChartLegendDot,
              { backgroundColor: chartLineColor },
            ]}
          />
          <Text style={styles.proChartLegendText}>
            {metalLabel} · Per gram
          </Text>
        </View>

        <Text
          style={[
            styles.proChartCurrentText,
            { color: chartLineColor },
          ]}
        >
          {formatMoney(chartPoints[chartPoints.length - 1].price)}
        </Text>
      </View>

      <View style={styles.chartPlot}>
        {tickValues.map((value, index) => {
          const top =
            12 +
            (index / 4) * (plotHeight - 30);

          return (
            <View
              key={`grid-${index}`}
              style={[
                styles.proGridLine,
                {
                  top,
                  left: yAxisWidth,
                  right: rightPadding,
                },
              ]}
            >
              <Text style={styles.proYAxisLabel}>
                {formatAxis(value)}
              </Text>
            </View>
          );
        })}

        {positions.slice(0, -1).map((point, index) => {
          const next = positions[index + 1];
          const dx = next.x - point.x;
          const dy = next.y - point.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle =
            (Math.atan2(dy, dx) * 180) / Math.PI;
          const midX = (point.x + next.x) / 2;
          const midY = (point.y + next.y) / 2;

          return (
            <View
              key={`segment-${index}`}
              style={[
                styles.proLine,
                {
                  left: midX - length / 2,
                  top: midY - 1.5,
                  width: length,
                  backgroundColor: chartLineColor,
                  transform: [{ rotate: `${angle}deg` }],
                },
              ]}
            />
          );
        })}

        {positions.map((point, index) => {
          const isCurrent = index === positions.length - 1;

          return (
            <View
              key={`point-${index}`}
              style={[
                styles.proPointOuter,
                {
                  left: point.x - (isCurrent ? 7 : 4.5),
                  top: point.y - (isCurrent ? 7 : 4.5),
                  backgroundColor: isCurrent
                    ? '#121212'
                    : chartLineColor,
                  borderColor: chartLineColor,
                },
                isCurrent && styles.proPointOuterCurrent,
              ]}
            >
              <View
                style={[
                  styles.proPointInner,
                  { backgroundColor: chartLineColor },
                  isCurrent && styles.proPointInnerCurrent,
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.proXAxisRow}>
        <Text style={styles.proXAxisLabel}>
          {formatDate(firstDate)}
        </Text>
        <Text style={styles.proXAxisLabel}>
          {formatDate(lastDate)}
        </Text>
      </View>
    </View>
  );
};

/* =========================================================
   SCREEN
========================================================= */

export default function RatesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [selectedMetal, setSelectedMetal] =
    useState<'gold' | 'silver'>('gold');

  const [selectedRateId, setSelectedRateId] =
    useState('');

  const [historyDays, setHistoryDays] =
    useState(7);

  const [refreshing, setRefreshing] =
    useState(false);

  /* =======================================================
     LIVE AIB QUERY
  ======================================================= */

  const {
    data: liveData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['aib-live-rates', 'lucknow'],
    queryFn: fetchLiveRates,

    staleTime: 0,

    gcTime: 1000 * 60 * 10,

    refetchInterval: 5000,

    refetchIntervalInBackground: false,

    refetchOnReconnect: true,

    refetchOnWindowFocus: true,

    retry: 2,

    retryDelay: 1500,
  });

  /* =======================================================
     BANNER
  ======================================================= */

  const { data: banners } =
    useQuery({
      queryKey: ['banners'],
      queryFn: async () => {
        const response =
          await import('../../services/api');

        return response.fetchActiveBanners();
      },

      staleTime: 1000 * 60 * 10,

      retry: 1,
    });

  /* =======================================================
     NORMALIZED RATES
  ======================================================= */

  const liveRates = useMemo(() => {
    return normalizeLiveRates(
      liveData,
    );
  }, [liveData]);

  /* =======================================================
     GOLD / SILVER
  ======================================================= */

  const goldRates = useMemo(() => {
    return liveRates.filter((rate) =>
      String(rate.metal_name)
        .toLowerCase()
        .includes('gold'),
    );
  }, [liveRates]);

  const silverRates = useMemo(() => {
    return liveRates.filter((rate) =>
      String(rate.metal_name)
        .toLowerCase()
        .includes('silver'),
    );
  }, [liveRates]);

  /* =======================================================
     MAIN RATES
  ======================================================= */

  const gold24K =
    goldRates.find(
      (rate) =>
        String(rate.purity).toUpperCase() ===
        '24K',
    ) || goldRates[0];

  const gold22K =
    goldRates.find(
      (rate) =>
        String(rate.purity).toUpperCase() ===
        '22K',
    );

  const gold18K =
    goldRates.find(
      (rate) =>
        String(rate.purity).toUpperCase() ===
        '18K',
    );

  const silver999 =
    silverRates.find(
      (rate) =>
        String(rate.purity).toUpperCase() ===
        '999',
    ) || silverRates[0];

  /* =======================================================
     SELECTED RATES
  ======================================================= */

  const selectedRates =
    selectedMetal === 'gold'
      ? goldRates
      : silverRates;

  const selectedRate =
    selectedRates.find(
      (rate) =>
        rate.id === selectedRateId,
    ) ||
    selectedRates[0];

  /* =======================================================
     KEEP SELECTED RATE VALID
  ======================================================= */

  useEffect(() => {
    if (
      selectedRates.length > 0 &&
      !selectedRates.some(
        (rate) =>
          rate.id === selectedRateId,
      )
    ) {
      setSelectedRateId(
        selectedRates[0].id,
      );
    }
  }, [
    selectedMetal,
    selectedRates,
    selectedRateId,
  ]);

  /* =======================================================
     HISTORY QUERY
  ======================================================= */

  const {
    data: history = [],
    isLoading: historyLoading,
    error: historyError,
    refetch: refetchHistory,
  } = useQuery({
    queryKey: [
      'gold-rate-history',
      selectedRate?.purity,
      historyDays,
      selectedRate?.metal_name,
    ],

    queryFn: () =>
      fetchGoldRateHistoryWindow(
        selectedRate?.purity || '',
        historyDays,
        selectedRate?.metal_name ||
          'Gold',
      ),

    enabled:
      Boolean(selectedRate?.purity),

    staleTime: 1000 * 60,

    retry: 1,
  });

  /* =======================================================
     BANNER
  ======================================================= */

  const activeBanner =
    Array.isArray(banners) &&
    banners.length > 0
      ? banners[0]
      : undefined;

  /* =======================================================
     STATUS
  ======================================================= */

  const hasRates =
    goldRates.length > 0 ||
    silverRates.length > 0;

  /* =======================================================
     REFRESH
  ======================================================= */

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        refetch(),
        refetchHistory(),
      ]);
    } catch (refreshError) {
      console.error(
        '[RATES] Refresh failed:',
        refreshError,
      );
    } finally {
      setRefreshing(false);
    }
  };

  /* =======================================================
     METAL SWITCH
  ======================================================= */

  const handleMetalChange = (
    metal: 'gold' | 'silver',
  ) => {
    setSelectedMetal(metal);

    const nextRates =
      metal === 'gold'
        ? goldRates
        : silverRates;

    setSelectedRateId(
      nextRates[0]?.id || '',
    );
  };

  /* =======================================================
     INITIAL LOADING
  ======================================================= */

  if (isLoading && !hasRates) {
    return (
      <LoadingScreen
        message="Loading live metal rates..."
      />
    );
  }

  /* =======================================================
     INITIAL ERROR
  ======================================================= */

  if (error && !hasRates) {
    return (
      <ErrorState
        title="Unable to Load Rates"
        message="Unable to fetch live AIB rates. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Math.max(
                insets.bottom + 120,
                130,
              ),
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.gold}
          />
        }
      >
        {/* ===============================================
            HEADER
        =============================================== */}

        <View
          style={[
            styles.header,
            {
              paddingTop:
                Math.max(
                  insets.top,
                  10,
                ),
            },
          ]}
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="arrow-back"
                size={27}
                color={COLORS.lightGold}
              />
            </TouchableOpacity>

            <Image
              source={require('../../assets/main-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <TouchableOpacity
              style={styles.headerButton}
              onPress={() =>
                router.push('/notifications')
              }
              activeOpacity={0.8}
            >
              <MaterialIcons
                name="notifications-none"
                size={28}
                color={COLORS.lightGold}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.headingRow}>
            <View
              style={
                styles.headingTextBlock
              }
            >
              <Text style={styles.heading}>
                Gold &{' '}
                <Text
                  style={
                    styles.headingGold
                  }
                >
                  Silver
                </Text>{' '}
                Rates
              </Text>

              <Text
                style={styles.subheading}
              >
                Live Lucknow market rates
              </Text>
            </View>

            <View
              style={styles.liveHeader}
            >
              <View
                style={styles.liveBadge}
              >
                <View
                  style={styles.liveDot}
                />

                <Text
                  style={
                    styles.liveBadgeText
                  }
                >
                  LIVE
                </Text>
              </View>

              <Text
                style={
                  styles.updatedLabel
                }
              >
                Updated
              </Text>

              <Text
                style={
                  styles.updatedValue
                }
              >
                {formatDateTime(
                  liveData?.updated_at,
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* ===============================================
            MAIN
        =============================================== */}

        {!hasRates ? (
          <EmptyState
            title="No live rates available"
            message="Please pull down to refresh."
          />
        ) : (
          <View style={styles.content}>
            {/* =============================================
                METAL TAB
            ============================================= */}

            <View style={styles.metalTabs}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  handleMetalChange(
                    'gold',
                  )
                }
                style={[
                  styles.metalTab,
                  selectedMetal ===
                    'gold' &&
                    styles.metalTabActive,
                ]}
              >
                <MaterialIcons
                  name="workspace-premium"
                  size={23}
                  color={
                    selectedMetal ===
                    'gold'
                      ? COLORS.primary
                      : '#B7B7B7'
                  }
                />

                <Text
                  style={[
                    styles.metalTabText,
                    selectedMetal ===
                      'gold' &&
                      styles.metalTabTextActive,
                  ]}
                >
                  Gold
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  handleMetalChange(
                    'silver',
                  )
                }
                style={[
                  styles.metalTab,
                  selectedMetal ===
                    'silver' &&
                    styles.metalTabActive,
                ]}
              >
                <MaterialIcons
                  name="workspace-premium"
                  size={23}
                  color={
                    selectedMetal ===
                    'silver'
                      ? COLORS.primary
                      : '#D7D7D7'
                  }
                />

                <Text
                  style={[
                    styles.metalTabText,
                    selectedMetal ===
                      'silver' &&
                      styles.metalTabTextActive,
                  ]}
                >
                  Silver
                </Text>
              </TouchableOpacity>
            </View>

            {/* =============================================
                SUMMARY
            ============================================= */}

            <View style={styles.summaryRow}>
              <RateSummaryCard
                rate={gold24K}
                title="Gold 24K"
                iconColor="#E8C75A"
                borderColor={
                  COLORS.gold
                }
              />

              <RateSummaryCard
                rate={silver999}
                title="Silver 999"
                iconColor="#D8D8D8"
                borderColor="#555555"
              />
            </View>

            {/* =============================================
                GOLD PURITIES
            ============================================= */}

            {selectedMetal ===
              'gold' &&
              goldRates.length > 0 && (
                <View
                  style={styles.sectionCard}
                >
                  <View
                    style={
                      styles.sectionHeader
                    }
                  >
                    <View>
                      <Text
                        style={
                          styles.sectionTitle
                        }
                      >
                        Gold Purities
                      </Text>

                      <Text
                        style={
                          styles.sectionSubtitle
                        }
                      >
                        Current live AIB rates
                      </Text>
                    </View>

                    <View
                      style={
                        styles.aibBadge
                      }
                    >
                      <Text
                        style={
                          styles.aibBadgeText
                        }
                      >
                        AIB
                      </Text>
                    </View>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={
                      false
                    }
                    contentContainerStyle={
                      styles.purityScroll
                    }
                  >
                    {goldRates.map(
                      (rate) => (
                        <TouchableOpacity
                          key={
                            rate.id
                          }
                          activeOpacity={
                            0.85
                          }
                          onPress={() =>
                            setSelectedRateId(
                              rate.id,
                            )
                          }
                          style={[
                            styles.purityCard,
                            rate.id ===
                              selectedRate?.id &&
                              styles.purityCardActive,
                          ]}
                        >
                          <Text
                            style={
                              styles.purity
                            }
                          >
                            {
                              rate.purity
                            }
                          </Text>

                          <Text
                            style={
                              styles.purityPrice
                            }
                          >
                            {formatMoney(
                              rate.price,
                            )}
                          </Text>

                          <Text
                            style={
                              styles.purityUnit
                            }
                          >
                            per gram
                          </Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </ScrollView>
                </View>
              )}

            {/* =============================================
                SELECTED RATE
            ============================================= */}

            <View
              style={styles.mainRateCard}
            >
              <View
                style={
                  styles.mainRateHeader
                }
              >
                <View
                  style={
                    styles.mainRateTitleWrap
                  }
                >
                  <Text
                    style={
                      styles.mainRateTitle
                    }
                  >
                    {selectedMetal ===
                    'gold'
                      ? `Gold ${selectedRate?.purity || ''}`
                      : `Silver ${selectedRate?.purity || ''}`}
                  </Text>

                  <Text
                    style={
                      styles.mainRateSubtitle
                    }
                  >
                    Live price per gram
                  </Text>
                </View>

                <View
                  style={
                    styles.liveMiniBadge
                  }
                >
                  <View
                    style={
                      styles.liveMiniDot
                    }
                  />

                  <Text
                    style={
                      styles.liveMiniText
                    }
                  >
                    LIVE
                  </Text>
                </View>
              </View>

              <Text
                style={
                  styles.mainRatePrice
                }
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatMoney(
                  selectedRate?.price,
                )}
              </Text>

              <Text
                style={
                  styles.mainRateUnit
                }
              >
                per gram
              </Text>

              <View
                style={
                  styles.mainDivider
                }
              />

              <View
                style={styles.infoRow}
              >
                <View
                  style={
                    styles.infoItem
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Purity
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    {selectedRate?.purity ||
                      '—'}
                  </Text>
                </View>

                <View
                  style={
                    styles.infoItem
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Location
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    Lucknow
                  </Text>
                </View>

                <View
                  style={
                    styles.infoItem
                  }
                >
                  <Text
                    style={
                      styles.infoLabel
                    }
                  >
                    Source
                  </Text>

                  <Text
                    style={
                      styles.infoValue
                    }
                  >
                    AIB
                  </Text>
                </View>
              </View>
            </View>

            {/* =============================================
                HISTORY
            ============================================= */}

            <View
              style={styles.chartCard}
            >
              <View
                style={
                  styles.chartHeader
                }
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      styles.chartTitle
                    }
                  >
                    Rate History
                  </Text>

                  <Text
                    style={
                      styles.chartSubtitle
                    }
                  >
                    {selectedRate
                      ? `${selectedRate.metal_name} ${selectedRate.purity}`
                      : 'Rate history'}
                  </Text>
                </View>

                <View
                  style={
                    styles.rangeBadge
                  }
                >
                  <MaterialIcons
                    name="calendar-month"
                    size={16}
                    color="#B9B9B9"
                  />

                  <Text
                    style={
                      styles.rangeBadgeText
                    }
                  >
                    {historyDays}D
                  </Text>
                </View>
              </View>

              {/* RATE SELECTOR */}

              {selectedRates.length >
                0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={
                    false
                  }
                  contentContainerStyle={
                    styles.rateSelector
                  }
                >
                  {selectedRates.map(
                    (rate) => (
                      <TouchableOpacity
                        key={
                          rate.id
                        }
                        activeOpacity={
                          0.85
                        }
                        onPress={() =>
                          setSelectedRateId(
                            rate.id,
                          )
                        }
                        style={[
                          styles.rateSelectorItem,
                          selectedRate?.id ===
                            rate.id &&
                            styles.rateSelectorActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.rateSelectorText,
                            selectedRate?.id ===
                              rate.id &&
                              styles.rateSelectorTextActive,
                          ]}
                        >
                          {
                            rate.purity
                          }
                        </Text>
                      </TouchableOpacity>
                    ),
                  )}
                </ScrollView>
              )}

              {/* RANGE */}

              <View
                style={
                  styles.rangeSelector
                }
              >
                {[
                  {
                    label: 'Today',
                    value: 1,
                  },
                  {
                    label: '7 Days',
                    value: 7,
                  },
                  {
                    label: '30 Days',
                    value: 30,
                  },
                ].map((item) => (
                  <TouchableOpacity
                    key={
                      item.value
                    }
                    activeOpacity={
                      0.85
                    }
                    onPress={() =>
                      setHistoryDays(
                        item.value,
                      )
                    }
                    style={[
                      styles.rangeButton,
                      historyDays ===
                        item.value &&
                        styles.rangeButtonActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.rangeButtonText,
                        historyDays ===
                          item.value &&
                          styles.rangeButtonTextActive,
                      ]}
                    >
                      {
                        item.label
                      }
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* CHART */}

              {historyLoading ? (
                <View
                  style={
                    styles.chartMessage
                  }
                >
                  <Text
                    style={
                      styles.messageText
                    }
                  >
                    Loading history...
                  </Text>
                </View>
              ) : historyError ? (
                <View
                  style={
                    styles.chartMessage
                  }
                >
                  <Text
                    style={
                      styles.messageText
                    }
                  >
                    Unable to load history.
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      refetchHistory()
                    }
                    style={
                      styles.retryButton
                    }
                  >
                    <Text
                      style={
                        styles.retryText
                      }
                    >
                      Retry
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ProfessionalRateChart
                  points={history}
                  currentPrice={selectedRate?.price}
                  metalLabel={
                    selectedMetal === 'gold'
                      ? `Gold ${selectedRate?.purity || ''}`.trim()
                      : 'Silver 999'
                  }
                />
              )}

              {/* STATS */}

              <View
                style={styles.statsRow}
              >
                <StatBox
                  label={`${historyDays}D Low`}
                  value={
                    history.length >
                    0
                      ? formatWholeMoney(
                          Math.min(
                            ...history.map(
                              (point) =>
                                Number(
                                  point.price,
                                ),
                            ),
                          ),
                        )
                      : '—'
                  }
                />

                <StatBox
                  label={`${historyDays}D High`}
                  value={
                    history.length >
                    0
                      ? formatWholeMoney(
                          Math.max(
                            ...history.map(
                              (point) =>
                                Number(
                                  point.price,
                                ),
                            ),
                          ),
                        )
                      : '—'
                  }
                />

                <StatBox
                  label="Current"
                  value={
                    selectedRate
                      ? formatMoney(
                          selectedRate.price,
                        )
                      : '—'
                  }
                />
              </View>
            </View>

            {/* =============================================
                SNAPSHOT
            ============================================= */}

            <View
              style={
                styles.snapshotCard
              }
            >
              <View
                style={
                  styles.sectionHeader
                }
              >
                <View>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Live Market Snapshot
                  </Text>

                  <Text
                    style={
                      styles.sectionSubtitle
                    }
                  >
                    Lucknow reference rates
                  </Text>
                </View>

                <View
                  style={
                    styles.snapshotBadge
                  }
                >
                  <View
                    style={
                      styles.snapshotDot
                    }
                  />

                  <Text
                    style={
                      styles.snapshotText
                    }
                  >
                    Updating
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.snapshotRow
                }
              >
                <View
                  style={
                    styles.snapshotItem
                  }
                >
                  <Text
                    style={
                      styles.snapshotLabel
                    }
                  >
                    Gold 24K
                  </Text>

                  <Text
                    style={
                      styles.snapshotValue
                    }
                  >
                    {gold24K
                      ? formatMoney(
                          gold24K.price,
                        )
                      : '—'}
                  </Text>
                </View>

                <View
                  style={
                    styles.snapshotDivider
                  }
                />

                <View
                  style={
                    styles.snapshotItem
                  }
                >
                  <Text
                    style={
                      styles.snapshotLabel
                    }
                  >
                    Gold 22K
                  </Text>

                  <Text
                    style={
                      styles.snapshotValue
                    }
                  >
                    {gold22K
                      ? formatMoney(
                          gold22K.price,
                        )
                      : '—'}
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.snapshotRow
                }
              >
                <View
                  style={
                    styles.snapshotItem
                  }
                >
                  <Text
                    style={
                      styles.snapshotLabel
                    }
                  >
                    Gold 18K
                  </Text>

                  <Text
                    style={
                      styles.snapshotValue
                    }
                  >
                    {gold18K
                      ? formatMoney(
                          gold18K.price,
                        )
                      : '—'}
                  </Text>
                </View>

                <View
                  style={
                    styles.snapshotDivider
                  }
                />

                <View
                  style={
                    styles.snapshotItem
                  }
                >
                  <Text
                    style={
                      styles.snapshotLabel
                    }
                  >
                    Silver 999
                  </Text>

                  <Text
                    style={
                      styles.snapshotValue
                    }
                  >
                    {silver999
                      ? formatMoney(
                          silver999.price,
                        )
                      : '—'}
                  </Text>
                </View>
              </View>
            </View>

            {/* =============================================
                PROMO
            ============================================= */}

            {activeBanner && (
              <TouchableOpacity
                activeOpacity={0.9}
                style={
                  styles.promoCard
                }
                onPress={() =>
                  router.push(
                    '/(tabs)/jewellery',
                  )
                }
              >
                {activeBanner.image_url ? (
                  <Image
                    source={{
                      uri: activeBanner.image_url,
                    }}
                    style={
                      styles.promoImage
                    }
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    style={
                      styles.promoFallback
                    }
                  />
                )}

                <View
                  style={
                    styles.promoOverlay
                  }
                />

                <View
                  style={
                    styles.promoContent
                  }
                >
                  <Text
                    style={
                      styles.promoTitle
                    }
                  >
                    Live Rates.
                    {'\n'}
                    Timeless Beauty.
                  </Text>

                  <Text
                    style={
                      styles.promoSubtitle
                    }
                  >
                    Track current bullion
                    prices and explore
                    our jewellery
                    collection.
                  </Text>

                  <View
                    style={
                      styles.promoButton
                    }
                  >
                    <Text
                      style={
                        styles.promoButtonText
                      }
                    >
                      Explore Jewellery
                    </Text>

                    <MaterialIcons
                      name="arrow-forward"
                      size={17}
                      color={
                        COLORS.primary
                      }
                    />
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#090909',
  },

  container: {
    flex: 1,
    backgroundColor: '#090909',
  },

  scrollContent: {
    paddingBottom: 120,
  },

  /* HEADER */

  header: {
    paddingHorizontal: 18,
    paddingBottom: 15,
  },

  headerRow: {
    minHeight: 67,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    width: 185,
    height: 58,
  },

  headingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },

  headingTextBlock: {
    flex: 1,
  },

  heading: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 29,
    lineHeight: 36,
  },

  headingGold: {
    color: COLORS.lightGold,
  },

  subheading: {
    color: '#9F9F9F',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 12,
    marginTop: 5,
  },

  liveHeader: {
    alignItems: 'flex-end',
    minWidth: 95,
  },

  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151515',
    borderWidth: 1,
    borderColor: '#363636',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4DDB83',
    marginRight: 5,
  },

  liveBadgeText: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 9,
    letterSpacing: 0.7,
  },

  updatedLabel: {
    color: '#777777',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 8,
    marginTop: 5,
  },

  updatedValue: {
    color: '#CCCCCC',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 8,
    marginTop: 2,
    textAlign: 'right',
  },

  /* CONTENT */

  content: {
    paddingHorizontal: 18,
  },

  /* METAL TABS */

  metalTabs: {
    flexDirection: 'row',
    padding: 4,
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 17,
  },

  metalTab: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    borderRadius: 13,
  },

  metalTabActive: {
    backgroundColor: COLORS.gold,
  },

  metalTabText: {
    color: '#B3B3B3',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 15,
  },

  metalTabTextActive: {
    color: COLORS.primary,
  },

  /* SUMMARY */

  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 14,
  },

  summaryCard: {
    flex: 1,
    minHeight: 177,
    borderRadius: 18,
    borderWidth: 1.2,
    backgroundColor: '#141414',
    padding: 14,
  },

  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#202020',
    marginRight: 9,
  },

  summaryTitleWrap: {
    flex: 1,
  },

  summaryTitle: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 14,
  },

  summaryPurity: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sans,
    fontSize: 11,
    marginTop: 3,
  },

  summaryPrice: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 24,
    marginTop: 16,
  },

  summaryUnit: {
    color: '#919191',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
    marginTop: 2,
  },

  summaryLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 11,
  },

  summaryLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4DDB83',
    marginRight: 5,
  },

  summaryLiveText: {
    color: '#858585',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 8,
  },

  /* SECTION */

  sectionCard: {
    marginTop: 15,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#303030',
    borderRadius: 18,
    padding: 15,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  sectionTitle: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 20,
  },

  sectionSubtitle: {
    color: '#898989',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
    marginTop: 3,
  },

  aibBadge: {
    backgroundColor: '#1B1B1B',
    borderWidth: 1,
    borderColor: '#484848',
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  aibBadgeText: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 9,
    letterSpacing: 0.8,
  },

  purityScroll: {
    paddingTop: 13,
  },

  purityCard: {
    minWidth: 108,
    paddingHorizontal: 13,
    paddingVertical: 13,
    marginRight: 8,
    borderRadius: 14,
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#393939',
  },

  purityCardActive: {
    borderColor: COLORS.gold,
    backgroundColor: '#1D1B12',
  },

  purity: {
    color: '#E7E7E7',
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 15,
  },

  purityPrice: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 16,
    marginTop: 6,
  },

  purityUnit: {
    color: '#7F7F7F',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 8,
    marginTop: 3,
  },

  /* MAIN RATE */

  mainRateCard: {
    marginTop: 15,
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: '#484848',
    borderRadius: 20,
    padding: 18,
  },

  mainRateHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  mainRateTitleWrap: {
    flex: 1,
  },

  mainRateTitle: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 22,
  },

  mainRateSubtitle: {
    color: '#898989',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
    marginTop: 4,
  },

  liveMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#3A3A3A',
    borderRadius: 13,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  liveMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4DDB83',
    marginRight: 5,
  },

  liveMiniText: {
    color: '#D5D5D5',
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 8,
    letterSpacing: 0.7,
  },

  mainRatePrice: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 42,
    marginTop: 17,
  },

  mainRateUnit: {
    color: '#919191',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 11,
    marginTop: 2,
  },

  mainDivider: {
    height: 1,
    backgroundColor: '#2C2C2C',
    marginVertical: 16,
  },

  infoRow: {
    flexDirection: 'row',
  },

  infoItem: {
    flex: 1,
  },

  infoLabel: {
    color: '#707070',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 8,
  },

  infoValue: {
    color: '#D3D3D3',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 10,
    marginTop: 4,
  },

  /* CHART */

  chartCard: {
    marginTop: 15,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#323232',
    borderRadius: 20,
    padding: 15,
  },

  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },

  chartTitle: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 21,
  },

  chartSubtitle: {
    color: '#8A8A8A',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
    marginTop: 3,
  },

  rangeBadge: {
    height: 37,
    paddingHorizontal: 10,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: '#3B3B3B',
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },

  rangeBadgeText: {
    color: '#BEBEBE',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 9,
  },

  rateSelector: {
    paddingVertical: 12,
  },

  rateSelectorItem: {
    minWidth: 61,
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: '#3B3B3B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },

  rateSelectorActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },

  rateSelectorText: {
    color: '#B5B5B5',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 11,
  },

  rateSelectorTextActive: {
    color: COLORS.primary,
  },

  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#2D2D2D',
    borderRadius: 21,
    padding: 3,
    marginBottom: 8,
  },

  rangeButton: {
    flex: 1,
    height: 38,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rangeButtonActive: {
    backgroundColor: COLORS.gold,
  },

  rangeButtonText: {
    color: '#9E9E9E',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 10,
  },

  rangeButtonTextActive: {
    color: COLORS.primary,
  },

  proChart: {
    marginTop: 5,
  },

  proChartLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  proChartLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  proChartLegendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  proChartLegendText: {
    color: '#999999',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 9,
  },

  proChartCurrentText: {
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 12,
    marginLeft: 8,
  },

  chartPlot: {
    height: 210,
    position: 'relative',
    overflow: 'visible',
  },

  proGridLine: {
    position: 'absolute',
    height: 1,
    backgroundColor: '#242424',
  },

  proYAxisLabel: {
    position: 'absolute',
    right: '100%',
    top: -5,
    width: 34,
    marginRight: 5,
    textAlign: 'right',
    color: '#636363',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 8,
  },

  proLine: {
    position: 'absolute',
    height: 3,
    borderRadius: 2,
  },

  proPointOuter: {
    position: 'absolute',
    width: 9,
    height: 9,
    borderRadius: 4.5,
    alignItems: 'center',
    justifyContent: 'center',
  },

  proPointOuterCurrent: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },

  proPointInner: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },

  proPointInnerCurrent: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  proXAxisRow: {
    marginLeft: 38,
    marginRight: 12,
    marginTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  proXAxisLabel: {
    color: '#666666',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 8,
  },

  chartMessage: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  messageText: {
    color: '#A6A6A6',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 12,
    textAlign: 'center',
  },

  hintText: {
    color: '#696969',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 9,
    marginTop: 5,
    textAlign: 'center',
  },

  retryButton: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
  },

  retryText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 10,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  statBox: {
    flex: 1,
    backgroundColor: '#181818',
    borderWidth: 1,
    borderColor: '#2B2B2B',
    borderRadius: 12,
    padding: 10,
  },

  statLabel: {
    color: '#707070',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 8,
  },

  statValue: {
    color: '#D8D8D8',
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 12,
    marginTop: 5,
  },

  /* SNAPSHOT */

  snapshotCard: {
    marginTop: 15,
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#303030',
    borderRadius: 18,
    padding: 15,
  },

  snapshotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#363636',
    borderRadius: 14,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  snapshotDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4DDB83',
    marginRight: 5,
  },

  snapshotText: {
    color: '#BDBDBD',
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 8,
  },

  snapshotRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#242424',
    marginTop: 10,
  },

  snapshotItem: {
    flex: 1,
  },

  snapshotDivider: {
    width: 1,
    backgroundColor: '#292929',
    marginHorizontal: 10,
  },

  snapshotLabel: {
    color: '#858585',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 9,
  },

  snapshotValue: {
    color: COLORS.lightGold,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 16,
    marginTop: 4,
  },

  /* PROMO */

  promoCard: {
    marginTop: 15,
    height: 205,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#181818',
  },

  promoImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },

  promoFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1A1A1A',
  },

  promoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.56)',
  },

  promoContent: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 18,
  },

  promoTitle: {
    color: '#FFFFFF',
    fontFamily: FONT_FAMILY.serifBold,
    fontSize: 24,
    lineHeight: 29,
  },

  promoSubtitle: {
    color: '#CECECE',
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 7,
    maxWidth: '82%',
  },

  promoButton: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: COLORS.gold,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  promoButtonText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.sansBold,
    fontSize: 9,
  },
});