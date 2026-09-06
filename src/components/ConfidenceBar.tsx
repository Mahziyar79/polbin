import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { toFaDigits } from '../utils/format';

/** نوار «اطمینان پارسر» — فقط در صفحه‌ی تایید پیامک استفاده می‌شود. */
export function ConfidenceBar({ confidence }: { confidence: number }) {
  return (
    <View style={styles.row}>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              width: `${confidence * 100}%`,
              backgroundColor: confidence >= 0.8 ? colors.success : colors.warning,
            },
          ]}
        />
      </View>
      <Text style={styles.text}>اطمینان پارسر: {toFaDigits(Math.round(confidence * 100))}٪</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.xs, marginTop: spacing.sm },
  track: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  text: { fontSize: 11, color: colors.textFaint },
});
