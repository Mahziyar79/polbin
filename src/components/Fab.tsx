import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { Text } from './Text';

export interface FabAction {
  key: string;
  label: string;
  emoji: string;
  onPress: () => void;
}

/**
 * دکمه‌ی شناور با منوی اکشن.
 * نکته‌ی RTL: ری‌اکت‌نیتیو با `forceRTL` مقادیر `right` و `left` را خودش جابه‌جا
 * می‌کند، پس `right` اینجا در چیدمان فارسی سمت چپ صفحه رندر می‌شود — همان جای
 * درست برای یک اپ راست‌به‌چپ.
 */
interface FabProps {
  actions: FabAction[];
  /** فاصله‌ی اضافی از پایین — مثلاً ارتفاع نوار ثابت پایین صفحه. */
  bottomOffset?: number;
}

export function Fab({ actions, bottomOffset = 0 }: FabProps) {
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [open, anim]);

  function handleAction(action: FabAction) {
    setOpen(false);
    action.onPress();
  }

  return (
    <>
      {open ? (
        <Pressable
          style={styles.backdrop}
          accessibilityLabel="بستن منو"
          onPress={() => setOpen(false)}
        />
      ) : null}

      <View style={[styles.wrap, { bottom: bottomOffset + spacing.lg }]} pointerEvents="box-none">
        {open ? (
          <Animated.View
            style={[
              styles.actions,
              {
                opacity: anim,
                transform: [
                  { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
                ],
              },
            ]}>
            {actions.map(action => (
              <TouchableOpacity
                key={action.key}
                style={styles.action}
                onPress={() => handleAction(action)}>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <View style={styles.actionIcon}>
                  <Text style={styles.actionEmoji}>{action.emoji}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        ) : null}

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={open ? 'بستن منو' : 'باز کردن منو'}
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => setOpen(v => !v)}>
          <Animated.Text
            style={[
              styles.fabIcon,
              {
                transform: [
                  {
                    rotate: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '45deg'],
                    }),
                  },
                ],
              },
            ]}>
            ＋
          </Animated.Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0F172A22',
  },
  wrap: {
    position: 'absolute',
    right: spacing.lg,
    alignItems: 'flex-end',
    gap: spacing.md,
  },
  actions: { alignItems: 'flex-end', gap: spacing.sm },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionLabel: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionEmoji: { fontSize: 20 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#0F172A',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  fabIcon: { color: '#FFFFFF', fontSize: 26, fontWeight: '700', lineHeight: 30 },
});
