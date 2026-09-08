import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Insight } from '../types';
import { colors, radius, spacing } from '../theme';
import { Text } from './Text';

const TONE_STYLES = {
  positive: { bg: colors.successSoft, accent: colors.success, emoji: '✅' },
  warning: { bg: colors.expenseSoft, accent: colors.expense, emoji: '⚠️' },
  neutral: { bg: colors.primarySoft, accent: colors.primary, emoji: '💡' },
} as const;

export function InsightCard({ insight }: { insight: Insight }) {
  const tone = TONE_STYLES[insight.tone];

  return (
    <View style={[styles.card, { backgroundColor: tone.bg, borderColor: tone.accent + '33' }]}>
      <Text style={styles.title}>
        {tone.emoji}  {insight.title}
      </Text>
      <Text style={styles.body}>{insight.body}</Text>
      <View style={[styles.actionRow, { borderTopColor: tone.accent + '33' }]}>
        <Text style={[styles.action, { color: tone.accent }]}>{insight.action}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.text, lineHeight: 24 },
  body: { fontSize: 13, color: colors.textMuted, lineHeight: 22 },
  actionRow: { marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1 },
  action: { fontSize: 13, fontWeight: '700', lineHeight: 22 },
});
