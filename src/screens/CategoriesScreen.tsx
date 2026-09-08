import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { CATEGORY_COLOR_CHOICES, CATEGORY_EMOJI_CHOICES, fallbackIdFor } from '../data/categories';
import { RootStackParamList } from '../navigation/types';
import { useCategories } from '../state/CategoriesContext';
import { useTransactions } from '../state/TransactionsContext';
import { colors, radius, spacing } from '../theme';
import { Category, TransactionType } from '../types';
import { toFaDigits } from '../utils/format';
import { Text } from '../components/Text';
import { TextInput } from '../components/TextInput';

type Props = NativeStackScreenProps<RootStackParamList, 'Categories'>;

const KINDS = [
  { value: 'debit', label: 'دسته‌ی خرج', color: colors.expense, tint: colors.expenseSoft },
  { value: 'credit', label: 'دسته‌ی درآمد', color: colors.success, tint: colors.successSoft },
] as const;

export function CategoriesScreen({ navigation }: Props) {
  const { categories, addCategory, deleteCategory, canDelete } = useCategories();

  const [kind, setKind] = useState<TransactionType>('debit');
  const { transactions, reassignCategory } = useTransactions();

  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState(CATEGORY_EMOJI_CHOICES[0]);
  const [color, setColor] = useState(CATEGORY_COLOR_CHOICES[0]);
  const [error, setError] = useState<string | null>(null);

  const visible = categories.filter(category => category.kind === kind);

  function handleAdd() {
    const validationError = addCategory({ label, emoji, color, kind });
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setLabel('');
  }

  function handleDelete(category: Category) {
    const affected = transactions.filter(tx => tx.categoryId === category.id).length;
    const message =
      affected > 0
        ? `${toFaDigits(affected)} تراکنش با این دسته ثبت شده که به «${
            category.kind === 'credit' ? 'سایر درآمد' : 'متفرقه'
          }» منتقل می‌شوند.`
        : 'این دسته حذف شود؟';

    Alert.alert(`حذف «${category.label}»`, message, [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: () => {
          reassignCategory(category.id, fallbackIdFor(category.kind));
          deleteCategory(category.id);
        },
      },
    ]);
  }

  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormScreenHeader
          title="دسته‌بندی‌ها"
          subtitle="دسته‌ی دلخواه خودت را برای خرج یا درآمد بساز. دسته‌های پیش‌فرض چون پارسر پیامک به آن‌ها تکیه دارد حذف نمی‌شوند."
        />

        <Card style={styles.card}>
          <Text style={styles.sectionLabel}>دسته‌ی جدید</Text>

          <View style={styles.kindSwitch}>
            {KINDS.map(option => {
              const active = option.value === kind;
              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setKind(option.value)}
                  style={[
                    styles.kindChip,
                    active ? { backgroundColor: option.tint, borderColor: option.color } : null,
                  ]}>
                  <Text style={[styles.kindText, active ? { color: option.color } : null]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="مثلاً اجاره خانه"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
          />

          <Text style={styles.fieldLabel}>آیکون</Text>
          <View style={styles.optionRow}>
            {CATEGORY_EMOJI_CHOICES.map(choice => (
              <TouchableOpacity
                key={choice}
                onPress={() => setEmoji(choice)}
                style={[styles.emojiOption, choice === emoji ? styles.emojiOptionActive : null]}>
                <Text style={styles.emojiText}>{choice}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>رنگ</Text>
          <View style={styles.optionRow}>
            {CATEGORY_COLOR_CHOICES.map(choice => (
              <TouchableOpacity
                key={choice}
                onPress={() => setColor(choice)}
                style={[
                  styles.colorOption,
                  { backgroundColor: choice },
                  choice === color ? styles.colorOptionActive : null,
                ]}
              />
            ))}
          </View>

          <View style={styles.previewRow}>
            <Text style={styles.fieldLabel}>پیش‌نمایش</Text>
            <View style={[styles.previewChip, { backgroundColor: color + '22', borderColor: color }]}>
              <Text style={styles.previewText}>
                {emoji}  {label.trim() || 'نام دسته'}
              </Text>
            </View>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <AppButton title="ساختن دسته" onPress={handleAdd} disabled={label.trim().length === 0} />
        </Card>

        <Text style={styles.sectionTitle}>
          {kind === 'credit' ? 'دسته‌های درآمد' : 'دسته‌های خرج'} ({toFaDigits(visible.length)})
        </Text>

        <Card>
          {visible.map((category, index) => (
            <View key={category.id}>
              {index > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: category.color + '1F' }]}>
                  <Text style={styles.rowEmoji}>{category.emoji}</Text>
                </View>

                <View style={styles.rowMiddle}>
                  <Text style={styles.rowLabel}>{category.label}</Text>
                  <Text style={styles.rowMeta}>
                    {category.isCustom ? 'ساخته‌ی تو' : 'پیش‌فرض'} ·{' '}
                    {toFaDigits(transactions.filter(tx => tx.categoryId === category.id).length)} تراکنش
                  </Text>
                </View>

                {canDelete(category.id) ? (
                  <TouchableOpacity onPress={() => handleDelete(category)} style={styles.deleteButton}>
                    <Text style={styles.deleteText}>حذف</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </Card>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton title="بستن" onPress={() => navigation.goBack()} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xl },
  card: { gap: spacing.sm },
  sectionLabel: { fontSize: 15, fontWeight: '800', color: colors.text, marginBottom: spacing.xs },
  kindSwitch: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  kindChip: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  kindText: { fontSize: 13, fontWeight: '800', color: colors.textMuted },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: colors.textMuted, marginTop: spacing.sm },
  input: {
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
  },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emojiOption: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  emojiText: { fontSize: 20 },
  colorOption: { width: 36, height: 36, borderRadius: radius.pill, borderWidth: 3, borderColor: 'transparent' },
  colorOptionActive: { borderColor: colors.text },
  previewRow: { gap: spacing.sm, marginBottom: spacing.sm },
  previewChip: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  previewText: { fontSize: 13, fontWeight: '800', color: colors.text },
  error: { color: colors.danger, fontSize: 13, marginBottom: spacing.xs },
  divider: { height: 1, backgroundColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: { fontSize: 20 },
  rowMiddle: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  rowMeta: { fontSize: 12, color: colors.textFaint },
  deleteButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSoft,
  },
  deleteText: { fontSize: 12, color: colors.danger, fontWeight: '700' },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
