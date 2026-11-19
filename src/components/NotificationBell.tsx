import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '../theme';
import { toFaDigits } from '../utils/format';
import { Text } from './Text';

export function NotificationBell({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`تراکنش‌های در انتظار، ${toFaDigits(count)} مورد`}
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.button}>
      <Svg width={22} height={22} viewBox="0 0 24 24" pointerEvents="none">
        <Path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" fill="none" stroke={colors.text} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      {count > 0 ? <View pointerEvents="none" style={styles.badge}>
        <Text style={styles.badgeText}>{count > 99 ? '۹۹+' : toFaDigits(count)}</Text>
      </View> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: -4, end: -4, minWidth: 19, height: 19, paddingHorizontal: 4, borderRadius: radius.pill, backgroundColor: colors.expense, borderWidth: 2, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, lineHeight: 15, fontWeight: '800', color: '#FFFFFF', writingDirection: 'ltr' },
});
