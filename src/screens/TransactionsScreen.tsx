import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { BankMark } from '../components/BankMark';
import { Card } from '../components/Card';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { PickerSheet } from '../components/PickerSheet';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { TransactionRow } from '../components/TransactionRow';
import { RootStackParamList } from '../navigation/types';
import { findBank } from '../data/banks';
import { balanceOf } from '../services/analytics';
import { useCategories } from '../state/CategoriesContext';
import { useTransactions } from '../state/TransactionsContext';
import { colors, radius, spacing } from '../theme';
import { CategoryId, TransactionType } from '../types';
import { formatToman, toFaDigits } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'Transactions'>;

const FILTERS = [
  { id: 'all', label: 'همه' },
  { id: 'debit', label: 'هزینه‌ها' },
  { id: 'credit', label: 'درآمدها' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

/** هر بار این تعداد ردیف بیشتر نشان داده می‌شود. */
const PAGE_SIZE = 20;

/** شناسه‌ی گزینه‌ی «همه» در هر دو فهرست انتخاب. */
const ALL = '__all__';

/**
 * فهرست کامل تراکنش‌ها.
 *
 * داشبورد فقط چند مورد آخر را نشان می‌دهد؛ اینجا همه‌چیز هست. صفحه‌بندی لازم
 * است چون این لیست با گذشت ماه‌ها فقط بزرگ‌تر می‌شود و رندر کردن یک‌باره‌ی
 * هزار ردیف، باز شدن صفحه را کند می‌کند.
 */
export function TransactionsScreen({ navigation }: Props) {
  const { transactions } = useTransactions();
  const { resolve } = useCategories();

  const [filter, setFilter] = useState<FilterId>('all');
  const [categoryId, setCategoryId] = useState<CategoryId | null>(null);
  const [bankName, setBankName] = useState<string | null>(null);
  const [openPicker, setOpenPicker] = useState<'category' | 'bank' | null>(null);
  const [shown, setShown] = useState(PAGE_SIZE);

  const byType = useMemo(
    () => (filter === 'all' ? transactions : transactions.filter(tx => tx.type === filter)),
    [transactions, filter],
  );

  /**
   * فقط دسته‌هایی که واقعاً تراکنش دارند.
   *
   * نشان دادن هر شانزده دسته‌ی پیش‌فرض، فهرست را شلوغ می‌کند و بیشترشان هم
   * انتخابشان به لیست خالی می‌رسد. شمارش کنارشان می‌آید تا معلوم باشد کدام
   * دسته واقعاً سنگین است.
   */
  const categoryOptions = useMemo(() => {
    const counts = new Map<CategoryId, { count: number; type: TransactionType }>();

    for (const tx of byType) {
      const seen = counts.get(tx.categoryId);
      if (seen) seen.count += 1;
      else counts.set(tx.categoryId, { count: 1, type: tx.type });
    }

    return Array.from(counts.entries())
      .map(([id, info]) => ({ category: resolve(id, info.type), count: info.count }))
      .sort((a, b) => b.count - a.count);
  }, [byType, resolve]);

  /** فقط بانک‌هایی که تراکنش دارند؛ مثل دسته‌ها، فهرست بلندِ بی‌مصرف نسازیم. */
  const bankOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of byType) {
      if (tx.bank) counts.set(tx.bank, (counts.get(tx.bank) ?? 0) + 1);
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ bank: findBank(name), name, count }))
      .sort((a, b) => b.count - a.count);
  }, [byType]);

  const selected = categoryOptions.find(option => option.category.id === categoryId) ?? null;
  const selectedBank = bankName ? findBank(bankName) : null;

  const filtered = useMemo(() => {
    let list = byType;
    if (categoryId) list = list.filter(tx => tx.categoryId === categoryId);
    if (bankName) list = list.filter(tx => tx.bank === bankName);

    return [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [byType, categoryId, bankName]);

  const total = useMemo(() => balanceOf(filtered), [filtered]);

  const page = filtered.slice(0, shown);
  const hasMore = shown < filtered.length;

  /**
   * با عوض شدن نوع، دسته هم پاک می‌شود.
   *
   * وگرنه کاربری که «رستوران و کافه» را انتخاب کرده و بعد «درآمدها» را می‌زند،
   * لیست خالی می‌بیند بدون اینکه بفهمد چرا.
   */
  function changeFilter(next: FilterId) {
    setFilter(next);
    setCategoryId(null);
    setBankName(null);
    setShown(PAGE_SIZE);
  }

  function chooseCategory(id: string) {
    setCategoryId(id === ALL ? null : id);
    setShown(PAGE_SIZE);
    setOpenPicker(null);
  }

  function chooseBank(id: string) {
    setBankName(id === ALL ? null : id);
    setShown(PAGE_SIZE);
    setOpenPicker(null);
  }

  return (
    <ScreenContainer flush>
      <FlatList
        data={page}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={styles.header}>
            <FormScreenHeader
              title="تراکنش‌ها"
              subtitle="همه‌ی خرج‌ها و درآمدها، تازه‌ترین اول. برای ویرایش یا حذف روی هرکدام بزن."
            />

            <View style={styles.filters}>
              {FILTERS.map(option => {
                const active = option.id === filter;
                return (
                  <TouchableOpacity
                    key={option.id}
                    onPress={() => changeFilter(option.id)}
                    style={[styles.chip, active ? styles.chipActive : null]}>
                    <Text style={[styles.chipText, active ? styles.chipTextActive : null]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.dropdownRow}>
              {categoryOptions.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setOpenPicker('category')}
                  style={styles.dropdown}
                  accessibilityRole="button">
                  <Text style={styles.dropdownLabel} numberOfLines={1}>
                    {selected ? `${selected.category.emoji}  ${selected.category.label}` : 'همه‌ی دسته‌ها'}
                  </Text>
                  <Text style={styles.dropdownChevron}>▾</Text>
                </TouchableOpacity>
              ) : null}

              {bankOptions.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setOpenPicker('bank')}
                  style={styles.dropdown}
                  accessibilityRole="button">
                  {selectedBank ? <BankMark bank={selectedBank} size={20} /> : null}
                  <Text style={styles.dropdownLabel} numberOfLines={1}>
                    {selectedBank ? selectedBank.short : 'همه‌ی بانک‌ها'}
                  </Text>
                  <Text style={styles.dropdownChevron}>▾</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryCount}>
                {`${toFaDigits(filtered.length)} تراکنش`}
              </Text>
              <Text style={[styles.summaryTotal, total < 0 ? styles.negative : styles.positive]}>
                {`${total < 0 ? '−' : '+'} ${formatToman(Math.abs(total))}`}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <Card style={[styles.rowCard, index === 0 ? null : styles.rowCardStacked]}>
            <TransactionRow
              tx={item}
              onPress={id => navigation.navigate('EditTransaction', { id })}
            />
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {filter === 'credit'
              ? 'هنوز درآمدی ثبت نشده.'
              : filter === 'debit'
                ? 'هنوز خرجی ثبت نشده.'
                : 'هنوز تراکنشی ثبت نشده.'}
          </Text>
        }
        ListFooterComponent={
          hasMore ? (
            <View style={styles.more}>
              <AppButton
                title={`نمایش ${toFaDigits(Math.min(PAGE_SIZE, filtered.length - shown))} تای بعدی`}
                onPress={() => setShown(current => current + PAGE_SIZE)}
                variant="secondary"
              />
              <Text style={styles.moreHint}>
                {`${toFaDigits(page.length)} از ${toFaDigits(filtered.length)}`}
              </Text>
            </View>
          ) : (
            <View />
          )
        }
      />

      <PickerSheet
        visible={openPicker === 'category'}
        title="فیلتر دسته"
        selectedId={categoryId ?? ALL}
        options={[
          { id: ALL, label: 'همه‌ی دسته‌ها', leading: <Text style={styles.allEmoji}>🗂️</Text>, trailing: toFaDigits(byType.length) },
          ...categoryOptions.map(option => ({
            id: option.category.id,
            label: option.category.label,
            leading: <Text style={styles.allEmoji}>{option.category.emoji}</Text>,
            trailing: toFaDigits(option.count),
          })),
        ]}
        onSelect={chooseCategory}
        onClose={() => setOpenPicker(null)}
      />

      <PickerSheet
        visible={openPicker === 'bank'}
        title="فیلتر بانک"
        selectedId={bankName ?? ALL}
        options={[
          { id: ALL, label: 'همه‌ی بانک‌ها', leading: <Text style={styles.allEmoji}>🏦</Text>, trailing: toFaDigits(byType.length) },
          ...bankOptions.map(option => ({
            id: option.name,
            label: option.bank?.name ?? option.name,
            leading: option.bank ? <BankMark bank={option.bank} size={28} /> : undefined,
            trailing: toFaDigits(option.count),
          })),
        ]}
        onSelect={chooseBank}
        onClose={() => setOpenPicker(null)}
      />

      <View style={styles.footer}>
        <AppButton title="بستن" onPress={() => navigation.goBack()} variant="ghost" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: { gap: spacing.md, marginBottom: spacing.md },
  filters: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '700', color: colors.textMuted },
  chipTextActive: { color: '#FFFFFF' },
  dropdownRow: { flexDirection: 'row', gap: spacing.sm },
  allEmoji: { fontSize: 18 },
  dropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dropdownLabel: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.text },
  dropdownChevron: { fontSize: 12, color: colors.textMuted },


  summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryCount: { flex: 1, fontSize: 13, color: colors.textMuted },
  summaryTotal: { fontSize: 14, fontWeight: '800' },
  positive: { color: colors.success },
  negative: { color: colors.expense },
  rowCard: { paddingVertical: spacing.xs },
  rowCardStacked: { marginTop: spacing.sm },
  empty: { fontSize: 14, color: colors.textFaint, textAlign: 'center', paddingVertical: spacing.xxl },
  more: { gap: spacing.sm, marginTop: spacing.lg },
  moreHint: { fontSize: 12, color: colors.textFaint, textAlign: 'center' },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
