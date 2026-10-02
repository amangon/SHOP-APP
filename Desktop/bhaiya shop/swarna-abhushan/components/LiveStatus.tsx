import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_FAMILY } from '../constants/theme';

interface LiveStatusProps {
  isLive: boolean;
  lastUpdated?: string | null;
  compact?: boolean;
}

export const LiveStatus: React.FC<LiveStatusProps> = ({
  isLive,
  lastUpdated,
  compact = false,
}) => {
  if (!isLive) {
    return (
      <View style={styles.container}>
        <View style={[styles.dot, styles.dotInactive]} />
        <Text style={styles.statusText}>
          {compact ? 'Connecting…' : 'Rate currently unavailable'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.dot, styles.dotActive]} />
      <Text style={styles.statusText}>LIVE</Text>
      {lastUpdated && !compact && (
        <Text style={styles.timestamp}>Updated {lastUpdated}</Text>
      )}
      {lastUpdated && compact && (
        <Text style={styles.timestamp}>{lastUpdated}</Text>
      )}
    </View>
  );
};

const formatTime = (iso: string): string => {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return iso;
  }
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#5BE28C',
  },
  dotInactive: {
    backgroundColor: '#666666',
  },
  statusText: {
    color: COLORS.white,
    fontFamily: FONT_FAMILY.sansSemiBold,
    fontSize: 12,
  },
  timestamp: {
    color: COLORS.secondaryText,
    fontFamily: FONT_FAMILY.sans,
    fontSize: 10,
    marginLeft: 4,
  },
});