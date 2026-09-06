import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

interface Props extends ViewProps {
  /** وقتی محتوا خودش ScrollView دارد، padding افقی را خاموش کن. */
  flush?: boolean;
}

export function ScreenContainer({ children, style, flush, ...rest }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={[styles.body, flush ? null : styles.padded, style]} {...rest}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1 },
  padded: { paddingHorizontal: spacing.lg },
});
