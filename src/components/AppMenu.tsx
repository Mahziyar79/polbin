import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { Text } from './Text';

/** مقصدهای منو — ترتیبشان همان ترتیب نمایش است. */
const ITEMS: Array<{ route: keyof RootStackParamList; emoji: string; label: string; hint: string }> =
  [
    { route: 'Transactions', emoji: '📋', label: 'تراکنش‌ها', hint: 'همه‌ی خرج‌ها و درآمدها' },
    { route: 'Calendar', emoji: '📅', label: 'تقویم', hint: 'خرج هر روز ماه' },
    { route: 'Installments', emoji: '🧾', label: 'قسط‌ها', hint: 'وام‌ها و سررسیدها' },
    { route: 'Categories', emoji: '🏷️', label: 'دسته‌بندی‌ها', hint: 'دیدن و ساختن دسته' },
    { route: 'Backup', emoji: '💾', label: 'پشتیبان و خروجی', hint: 'فایل JSON، اکسل و PDF' },
    { route: 'LockSettings', emoji: '🔒', label: 'قفل اپ', hint: 'رمز و اثر انگشت' },
    { route: 'About', emoji: 'ℹ️', label: 'درباره‌ی پول‌بین', hint: 'قابلیت‌ها و حریم خصوصی' },
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
 * چون کل اپ RTL است، در یک ردیف، فرزند اول سمت راست می‌نشیند. پس پس‌زمینه
 * اول می‌آید و پنل دوم، تا پنل به لبه‌ی چپ بچسبد.
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
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="بستن منو" />

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
                onPress={() => onSelect(item.route)}
                style={({ pressed }) => [styles.item, pressed ? styles.itemPressed : null]}>
                <Text style={styles.itemEmoji}>{item.emoji}</Text>
                <View style={styles.itemText}>
                  <Text style={styles.itemLabel}>{item.label}</Text>
                  <Text style={styles.itemHint}>{item.hint}</Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
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
    paddingTop: spacing.xxl,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { fontSize: 20, fontWeight: '800', color: colors.primaryDark },
  tagline: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  items: { padding: spacing.md, gap: spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  itemPressed: { backgroundColor: colors.surfaceAlt },
  itemEmoji: { fontSize: 20 },
  itemText: { flex: 1, gap: 2 },
  itemLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  itemHint: { fontSize: 11, color: colors.textFaint },
});
