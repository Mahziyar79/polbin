import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CategoryBreakdown } from '../types';
import { colors, radius } from '../theme';

/** نوار افقیِ نسبت دسته‌ها — سبک‌ترین شکل «نمودار» بدون هیچ وابستگی. */
export function ProportionBar({ data }: { data: CategoryBreakdown[] }) {
  if (data.length === 0) {
    return <View style={[styles.track, styles.empty]} />;
  }

  return (
    <View style={styles.track}>
      {data.map(item => (
        <View
          key={item.category.id}
          style={[
            styles.segment,
            { flexGrow: Math.max(item.share, 1), backgroundColor: item.category.color },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 12,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  segment: { flexBasis: 0 },
  empty: { backgroundColor: colors.border },
});
