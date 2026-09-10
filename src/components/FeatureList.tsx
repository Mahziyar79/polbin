import React from 'react';
import { StyleSheet, View } from 'react-native';
import { APP_FEATURES } from '../data/features';
import { colors, spacing } from '../theme';
import { Card } from './Card';
import { Text } from './Text';

/** فهرست قابلیت‌ها — هم در معرفی اولیه و هم در «درباره‌ی پول‌بین». */
export function FeatureList() {
  return (
    <View style={styles.list}>
      {APP_FEATURES.map(feature => (
        <Card key={feature.title} style={styles.item}>
          <View style={styles.head}>
            <Text style={styles.emoji}>{feature.emoji}</Text>
            <Text style={styles.title}>{feature.title}</Text>
          </View>
          <Text style={styles.body}>{feature.body}</Text>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  item: { gap: spacing.xs },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  emoji: { fontSize: 18 },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.text },
  body: { fontSize: 13, color: colors.textMuted, lineHeight: 24 },
});
