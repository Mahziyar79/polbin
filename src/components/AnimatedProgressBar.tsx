import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleSheet,
  View,
} from 'react-native';
import { colors, radius } from '../theme';

interface Props {
  progress: number;
  color: string;
  accessibilityLabel: string;
}

/** Progress stays anchored to the start edge in RTL; only its width changes. */
export function AnimatedProgressBar({
  progress,
  color,
  accessibilityLabel,
}: Props) {
  const value = Math.max(
    0,
    Math.min(1, Number.isFinite(progress) ? progress : 0),
  );
  const width = useRef(new Animated.Value(value)).current;
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    let active = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      enabled => {
        changed = true;
        setReduceMotion(enabled);
      },
    );
    AccessibilityInfo.isReduceMotionEnabled()
      .then(enabled => {
        if (active && !changed) setReduceMotion(enabled);
      })
      .catch(() => {
        /* Keep motion disabled if the setting is unavailable. */
      });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      width.setValue(value);
      return;
    }
    const animation = Animated.timing(width, {
      toValue: value,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [value, reduceMotion, width]);

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={styles.track}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: color,
            width: width.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
