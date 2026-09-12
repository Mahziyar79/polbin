import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useKeyboardHeight } from '../hooks/useKeyboardHeight';
import { colors, radius, spacing } from '../theme';
import { toEnDigits, toFaDigits } from '../utils/format';
import {
  JALALI_MONTHS,
  JALALI_WEEK_HEADERS,
  jalaliMonthLength,
  jalaliWeekdayIndex,
  toGregorian,
  toJalali,
} from '../utils/jalali';
import { AppButton } from './AppButton';
import { Text } from './Text';
import { TextInput } from './TextInput';

interface Props {
  visible: boolean;
  /** تاریخ فعلی — ماهِ باز شده از روی همین انتخاب می‌شود. */
  value: Date;
  onSelect: (date: Date) => void;
  onClose: () => void;
  title?: string;
  /**
   * ساعت و دقیقه هم پرسیده شود. در این حالت لمس روز فوراً نمی‌بندد؛ کاربر
   * ساعت را هم می‌گذارد و «تایید» می‌زند. بدون آن، همان انتخابگر روز است.
   */
  withTime?: boolean;
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** «۰۹» → ۹؛ بیشتر از سقف، همان سقف. */
function clampDigits(text: string, max: number): number {
  const n = Number(toEnDigits(text).replace(/[^\d]/g, ''));
  if (!Number.isFinite(n)) return 0;
  return Math.min(max, n);
}

/**
 * انتخاب روز از تقویم شمسی.
 *
 * جدا از `CalendarScreen` است چون آن یکی صفحه‌ی گزارش است و تراکنش‌های هر روز
 * را نشان می‌دهد؛ این فقط یک انتخابگر است و در فرم‌ها استفاده می‌شود.
 */
export function JalaliDatePicker({ visible, value, onSelect, onClose, title, withTime }: Props) {
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const initial = toJalali(value);
  const [month, setMonth] = useState({ jy: initial.jy, jm: initial.jm });

  // پیش‌نویس فقط در حالت ساعت‌دار معنا دارد: روز و ساعت جدا انتخاب می‌شوند و
  // با «تایید» یک‌جا برمی‌گردند. با هر بار باز شدن از مقدار فعلی شروع می‌کند.
  const [draft, setDraft] = useState<Date>(value);
  const [hourText, setHourText] = useState(toFaDigits(pad2(value.getHours())));
  const [minuteText, setMinuteText] = useState(toFaDigits(pad2(value.getMinutes())));

  useEffect(() => {
    if (!visible) return;
    const j = toJalali(value);
    setMonth({ jy: j.jy, jm: j.jm });
    setDraft(value);
    setHourText(toFaDigits(pad2(value.getHours())));
    setMinuteText(toFaDigits(pad2(value.getMinutes())));
    // فقط لحظه‌ی باز شدن؛ تغییر `value` وسط انتخاب نباید پیش‌نویس را بپراند.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const grid = useMemo(() => {
    const first = toGregorian(month.jy, month.jm, 1);
    const blanks = jalaliWeekdayIndex(first);
    const days = jalaliMonthLength(month.jy, month.jm);

    // خانه‌های خالی ته جدول، تا ارتفاع همیشه شش سطر بماند. بدون این، ماهی که
    // پنج سطر می‌گیرد جدول را کوتاه می‌کند و دکمه‌های ماه قبل/بعد زیر انگشت
    // کاربر جابه‌جا می‌شوند — یعنی دو بار پشت‌هم زدن، ماه اشتباهی می‌آورد.
    return { blanks, days, trailing: ROWS * 7 - blanks - days };
  }, [month]);

  function shift(step: number) {
    setMonth(current => {
      const next = current.jm + step;
      if (next < 1) return { jy: current.jy - 1, jm: 12 };
      if (next > 12) return { jy: current.jy + 1, jm: 1 };
      return { jy: current.jy, jm: next };
    });
  }

  function pick(day: number) {
    const date = toGregorian(month.jy, month.jm, day);

    if (!withTime) {
      date.setHours(0, 0, 0, 0);
      onSelect(date);
      return;
    }

    date.setHours(draft.getHours(), draft.getMinutes(), 0, 0);
    setDraft(date);
  }

  function confirm() {
    const date = new Date(draft);
    date.setHours(clampDigits(hourText, 23), clampDigits(minuteText, 59), 0, 0);
    onSelect(date);
  }

  const selected = toJalali(withTime ? draft : value);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.layout}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="بستن" />

        <View
          style={[
            styles.sheet,
            { paddingBottom: spacing.lg + insets.bottom, marginBottom: keyboardHeight },
          ]}>
          <Text style={styles.title}>{title ?? 'انتخاب تاریخ'}</Text>

          <View style={styles.header}>
            <TouchableOpacity onPress={() => shift(-1)} style={styles.arrow}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            <Text style={styles.monthLabel}>
              {`${JALALI_MONTHS[month.jm - 1]} ${toFaDigits(month.jy)}`}
            </Text>

            <TouchableOpacity onPress={() => shift(1)} style={styles.arrow}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {JALALI_WEEK_HEADERS.map(label => (
              <Text key={label} style={styles.weekHeader}>
                {label}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {Array.from({ length: grid.blanks }).map((_, index) => (
              <View key={`blank-${index}`} style={styles.cell} />
            ))}

            {Array.from({ length: grid.days }).map((_, index) => {
              const day = index + 1;
              const active =
                selected.jy === month.jy && selected.jm === month.jm && selected.jd === day;

              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => pick(day)}
                  style={[styles.cell, active ? styles.cellActive : null]}>
                  <Text style={[styles.dayText, active ? styles.dayTextActive : null]}>
                    {toFaDigits(day)}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {Array.from({ length: grid.trailing }).map((_, index) => (
              <View key={`tail-${index}`} style={styles.cell} />
            ))}
          </View>

          {withTime ? (
            <>
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>ساعت</Text>
                {/* در ردیف راست‌به‌چپ، ساعت سمت راست و دقیقه سمت چپ می‌نشیند — همان «۱۰:۱۵». */}
                <TextInput
                  value={hourText}
                  onChangeText={text => setHourText(toFaDigits(toEnDigits(text).replace(/[^\d]/g, '').slice(0, 2)))}
                  onBlur={() => setHourText(toFaDigits(pad2(clampDigits(hourText, 23))))}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  maxLength={2}
                  style={styles.timeInput}
                  textAlign="center"
                />
                <Text style={styles.timeColon}>:</Text>
                <TextInput
                  value={minuteText}
                  onChangeText={text => setMinuteText(toFaDigits(toEnDigits(text).replace(/[^\d]/g, '').slice(0, 2)))}
                  onBlur={() => setMinuteText(toFaDigits(pad2(clampDigits(minuteText, 59))))}
                  keyboardType="number-pad"
                  selectTextOnFocus
                  maxLength={2}
                  style={styles.timeInput}
                  textAlign="center"
                />
              </View>

              <AppButton title="تایید" onPress={confirm} />
            </>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const ROWS = 6;
const CELL = `${100 / 7}%`;

const styles = StyleSheet.create({
  layout: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(18, 52, 59, 0.45)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 18, color: colors.primary },
  monthLabel: { fontSize: 15, fontWeight: '800', color: colors.text },
  weekRow: { flexDirection: 'row' },
  weekHeader: {
    width: CELL,
    textAlign: 'center',
    fontSize: 12,
    color: colors.textFaint,
    paddingVertical: spacing.xs,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: CELL,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  cellActive: { backgroundColor: colors.primary },
  dayText: { fontSize: 14, color: colors.text },
  dayTextActive: { color: '#FFFFFF', fontWeight: '800' },

  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginBottom: spacing.xs,
  },
  timeLabel: { flex: 1, fontSize: 13, color: colors.textMuted },
  timeInput: {
    width: 64,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  timeColon: { fontSize: 20, fontWeight: '800', color: colors.textMuted },
});
