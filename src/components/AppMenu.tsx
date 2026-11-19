import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { Text } from './Text';

/** مقصدهای منو — ترتیبشان همان ترتیب نمایش است. */
const ITEMS: Array<{ route: keyof RootStackParamList; icon: string; label: string; hint: string }> =
  [
    { route: 'Transactions', icon: 'M4 7h16M4 17h16m-4-4 4 4-4 4M8 3 4 7l4 4', label: 'تراکنش‌ها', hint: 'همه‌ی خرج‌ها و درآمدها' },
    { route: 'Calendar', icon: 'M5 5h14v15H5zM8 3v4m8-4v4M5 10h14', label: 'تقویم', hint: 'خرج هر روز ماه' },
    { route: 'Installments', icon: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3zm3 5h6m-6 4h6', label: 'قسط‌ها', hint: 'وام‌ها و سررسیدها' },
    { route: 'Categories', icon: 'M3 4h8l10 10-7 7L3 10V4zm4 3h.01', label: 'دسته‌بندی‌ها', hint: 'دیدن و ساختن دسته' },
    { route: 'Backup', icon: 'M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5', label: 'پشتیبان‌گیری و خروجی', hint: 'فایل JSON، اکسل و PDF' },
    { route: 'LockSettings', icon: 'M6 10h12v11H6zm3 0V7a3 3 0 0 1 6 0v3m-3 5v2', label: 'امنیت', hint: 'رمز و اثر انگشت' },
    { route: 'About', icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-10v6m0-10h.01', label: 'درباره‌ی پول‌بین', hint: 'قابلیت‌ها و حریم خصوصی' },
  ];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (route: keyof RootStackParamList) => void;
}

/**
 * منوی کشویی از لبه‌ی چپ.
 *
 * عمداً `Modal` خود ری‌اکت‌نیتیو است نه `@react-navigation/drawer`: آن یکی
 * `react-native-gesture-handler` و `reanimated` را می‌آورد — دو وابستگی نیتیو
 * سنگین برای منویی که پنج آیتم دارد. `Modal` دکمه‌ی بازگشت اندروید را هم
 * خودش مدیریت می‌کند.
 *
 * چون کل اپ RTL است، در یک ردیف، فرزند اول سمت راست می‌نشیند. پنل اول می‌آید و
 * پس‌زمینه دوم، تا پنل به لبه‌ی راست بچسبد — همان سمتی که تیتر و متن از آن شروع
 * می‌شوند.
 */
export function AppMenu({ visible, onClose, onSelect }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.layout}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.brand}>پول‌بین</Text>
            <Text style={styles.tagline}>خرجت را بدون دفترچه بفهم</Text>
          </View>

          <ScrollView
            contentContainerStyle={[styles.items, { paddingBottom: spacing.md + insets.bottom }]}>
            {ITEMS.map(item => (
              <Pressable
                key={item.route}
                accessibilityRole="button"
                onPress={() => onSelect(item.route)}
                style={({ pressed }) => [styles.item, pressed ? styles.itemPressed : null]}>
                <View style={styles.iconTile} pointerEvents="none" accessible={false}>
                  <Svg width={22} height={22} viewBox="0 0 24 24">
                    <Path d={item.icon} fill="none" stroke={colors.primaryDark} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemHint}>{item.hint}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="بستن منو" />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  layout: { flex: 1, flexDirection: 'row' },
  backdrop: { flex: 1, backgroundColor: 'rgba(18, 52, 59, 0.45)' },
  panel: {
    width: '78%',
    maxWidth: 320,
    backgroundColor: colors.surface,
    paddingTop: spacing.xxl + 12,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { fontSize: 24, fontWeight: '800', color: colors.primaryDark },
  tagline: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  items: { padding: spacing.md, gap: 6 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  itemPressed: { backgroundColor: colors.surfaceAlt },
  iconTile: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  itemText: { flex: 1, gap: 2 },
  itemLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemHint: { fontSize: 11, color: colors.textMuted, lineHeight: 20 },
});
