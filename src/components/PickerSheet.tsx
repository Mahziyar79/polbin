import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../theme';
import { Text } from './Text';

export interface PickerOption {
  id: string;
  label: string;
  /** آیکون سمت راست — ایموجی دسته یا نشان بانک. */
  leading?: React.ReactNode;
  /** متن کوچک سمت چپ — معمولاً تعداد. */
  trailing?: string;
}

interface Props {
  visible: boolean;
  title: string;
  options: PickerOption[];
  /** null یعنی هیچ‌کدام؛ گزینه‌ی «همه» خودش یکی از options است. */
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

/**
 * فهرست انتخاب که از پایین صفحه بالا می‌آید.
 *
 * سه جا از همین استفاده می‌کنند: فیلتر دسته، فیلتر بانک، و انتخاب بانک در فرم
 * تراکنش. سه مودالِ جدا خیلی زود از هم فاصله می‌گرفتند.
 */
export function PickerSheet({ visible, title, options, selectedId, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.layout}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="بستن" />

        <View style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>

          <ScrollView>
            {options.map(option => (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: option.id === selectedId }}
                onPress={() => onSelect(option.id)}
                style={({ pressed }) => [
                  styles.option,
                  pressed ? styles.optionPressed : null,
                  option.id === selectedId ? styles.optionActive : null,
                ]}>
                {option.leading ?? null}
                <Text style={styles.label} numberOfLines={1}>
                  {option.label}
                </Text>
                {option.trailing ? <Text style={styles.trailing}>{option.trailing}</Text> : null}
                <View style={[styles.check, option.id === selectedId ? styles.checkActive : null]} pointerEvents="none" accessible={false}>
                  {option.id === selectedId ? <Text style={styles.checkText}>✓</Text> : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/**
 * فاصله‌ی امن پایین شیت.
 *
 * `Modal` بیرون از `ScreenContainer` رندر می‌شود و از padding امنِ آن بهره‌ای
 * نمی‌برد. چون اپ edge-to-edge است، شیت تا کف صفحه کشیده می‌شود و نوار ناوبری
 * اندروید روی آخرین ردیف می‌افتد: دیده می‌شود ولی لمسش به نوار می‌رسد نه به اپ.
 */
const styles = StyleSheet.create({
  layout: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(18, 52, 59, 0.45)' },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  handle: { width: 32, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: spacing.md },
  title: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  optionPressed: { backgroundColor: colors.surfaceAlt },
  optionActive: { backgroundColor: colors.primarySoft },
  check: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  checkActive: { backgroundColor: colors.primary },
  checkText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF', lineHeight: 20 },
  label: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  trailing: { fontSize: 12, color: colors.textMuted },
});
