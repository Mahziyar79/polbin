import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { CategoryBreakdown } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatPercent, formatToman } from '../utils/format';
import { Text } from './Text';

interface Props {
  data: CategoryBreakdown[];
  label: string;
  onPress: (categoryId: string) => void;
}

const SIZE = 152;
const STROKE = 17;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Exact amount proportions, including tiny categories; never inflate small slices. */
export function CategoryDonut({ data, label, onPress }: Props) {
  const entries = data.filter(
    item => Number.isFinite(item.total) && item.total > 0,
  );
  const total = entries.reduce((sum, item) => sum + item.total, 0);
  let offset = 0;

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={colors.surfaceAlt}
            strokeWidth={STROKE}
          />
          {entries.map(item => {
            const length = (item.total / total) * CIRCUMFERENCE;
            const start = offset;
            offset += length;
            // A proportional gap preserves even very small slices. A lone slice is a full ring.
            const gap = entries.length > 1 ? Math.min(3, length * 0.15) : 0;
            return (
              <Circle
                key={item.category.id}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={item.category.color}
                strokeWidth={STROKE}
                strokeDasharray={[length - gap, CIRCUMFERENCE - length + gap]}
                strokeDashoffset={-start - gap / 2}
                rotation={-90}
                origin={`${SIZE / 2}, ${SIZE / 2}`}
                onPress={() => onPress(item.category.id)}
              />
            );
          })}
        </Svg>
        <View pointerEvents="none" style={styles.center}>
          <Text style={styles.centerLabel}>{label}</Text>
          <Text
            style={styles.total}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.65}
          >
            {formatToman(total, false)}
          </Text>
          <Text style={styles.unit}>تومان</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {entries.length === 0 ? (
          <Text style={styles.empty}>در این بازه تراکنشی ثبت نشده است.</Text>
        ) : (
          entries.map(item => (
            <TouchableOpacity
              key={item.category.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.category.label}، ${formatPercent(
                item.share,
              )}، ${formatToman(item.total)}؛ مشاهده تراکنش‌ها`}
              onPress={() => onPress(item.category.id)}
              activeOpacity={0.65}
              style={styles.legendRow}
            >
              <View
                style={[styles.dot, { backgroundColor: item.category.color }]}
              />
              <Text style={styles.legendLabel} numberOfLines={2}>
                {item.category.label}
              </Text>
              <Text style={styles.share}>{formatPercent(item.share)}</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  chart: { width: SIZE, height: SIZE },
  center: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    padding: STROKE + 6,
  },
  centerLabel: { fontSize: 11, color: colors.textMuted, textAlign: 'center' },
  total: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    alignSelf: 'stretch',
    marginVertical: 2,
  },
  unit: { fontSize: 10, color: colors.textMuted },
  legend: { flexGrow: 1, flexBasis: 120 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 34,
    paddingVertical: spacing.xs,
  },
  dot: { width: 9, height: 9, borderRadius: radius.pill },
  legendLabel: { flex: 1, fontSize: 12, lineHeight: 20, color: colors.text },
  share: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  empty: { fontSize: 12, color: colors.textMuted, lineHeight: 22 },
});
