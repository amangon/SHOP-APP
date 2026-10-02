import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SIZES, SPACING, FONT_FAMILY } from '../constants/theme';

interface ReadMoreTextProps {
  text: string;
  limit?: number;
  style?: object;
}

export const ReadMoreText: React.FC<ReadMoreTextProps> = ({ text, limit = 150, style }) => {
  const [expanded, setExpanded] = useState(false);

  if (!text || text.length <= limit) {
    return <Text style={[styles.text, style]}>{text}</Text>;
  }

  const displayText = expanded ? text : text.slice(0, limit) + '...';

  return (
    <View>
      <Text style={[styles.text, style]}>{displayText}</Text>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.readMore}>{expanded ? 'Read Less' : 'Read More'}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.sans,
    color: COLORS.secondaryText,
    lineHeight: 24,
  },
  readMore: {
    color: COLORS.gold,
    fontSize: SIZES.md,
    fontFamily: FONT_FAMILY.sansSemiBold,
    marginTop: SPACING.sm,
  },
});
