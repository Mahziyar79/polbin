import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppButton } from '../components/AppButton';
import { BankMark } from '../components/BankMark';
import { Card } from '../components/Card';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { findBank } from '../data/banks';
import { RootStackParamList } from '../navigation/types';
import { PendingSms } from '../services/pendingSms';
import { parseSms } from '../services/smsParser';
import { usePendingSms } from '../state/PendingSmsContext';
import { colors, radius, spacing } from '../theme';
import { formatRelativeDay, formatTime, formatToman } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'PendingTransactions'>;

export function PendingTransactionsScreen({ navigation }: Props) {
  const { items, loaded, error, refresh, dismiss } = usePendingSms();
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const rows = useMemo(() => items.map(item => ({
    item, parsed: parseSms(item.rawSms, new Date(item.receivedAt)),
  })), [items]);

  async function reload() {
    setRefreshing(true);
    try { await refresh(); } catch { /* The context displays a retryable error. */ }
    finally { setRefreshing(false); }
  }

  function discard(item: PendingSms) {
    Alert.alert('رد کردن تراکنش', 'این پیامک از فهرست انتظار کنار گذاشته می‌شود. تراکنش‌های ثبت‌شده تغییری نمی‌کنند.', [
      { text: 'بازگشت', style: 'cancel' },
      { text: 'رد کردن', style: 'destructive', onPress: () => {
        setBusy(item.id);
        dismiss(item.id).catch(() => Alert.alert('انجام نشد', 'رد کردن این مورد ناموفق بود. دوباره تلاش کن.'))
          .finally(() => setBusy(null));
      } },
    ]);
  }

  return (
    <ScreenContainer flush>
      <FlatList
        data={rows}
        keyExtractor={row => row.item.id}
        contentContainerStyle={styles.content}
        refreshing={refreshing}
        onRefresh={reload}
        ListHeaderComponent={<View style={styles.header}>
          <FormScreenHeader title="تراکنش‌های در انتظار" subtitle="پیامک‌ها را بررسی و ثبت کن یا موارد ناخواسته را کنار بگذار." onBack={() => navigation.goBack()} />
          {error ? <Card style={styles.error}>
            <Text style={styles.errorText}>{error}</Text>
            <AppButton title="تلاش دوباره" variant="secondary" onPress={reload} loading={refreshing} />
          </Card> : null}
        </View>}
        ListEmptyComponent={!loaded ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : !error ? <Card style={styles.empty}>
          <View style={styles.emptyIcon}><Svg width={36} height={36} viewBox="0 0 24 24"><Path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" fill="none" stroke={colors.primary} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" /></Svg></View>
          <Text style={styles.emptyTitle}>تراکنشی در انتظار نیست</Text>
          <Text style={styles.emptyBody}>پیامک‌های بانکی تازه تا زمان ثبت یا رد شدن، اینجا می‌مانند.</Text>
        </Card> : undefined}
        renderItem={({ item: { item, parsed } }) => {
          const bank = findBank(parsed.bank);
          const delivered = new Date(item.receivedAt).toISOString();
          const isBusy = busy === item.id;
          return <Card style={styles.card}>
            <TouchableOpacity
              disabled={isBusy}
              accessibilityRole="button"
              accessibilityLabel={`بررسی و ثبت ${parsed.merchant ?? 'تراکنش بانکی'}، ${parsed.amount !== null ? formatToman(parsed.amount) : 'مبلغ نامشخص'}`}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('ConfirmTransaction', { rawSms: item.rawSms, pendingSmsId: item.id, receivedAt: item.receivedAt })}
              style={styles.row}>
              <View style={styles.bankIcon}>{bank ? <BankMark bank={bank} size={30} /> : <Text style={styles.unknownBank}>⇄</Text>}</View>
              <View style={styles.details}>
                <Text style={styles.merchant} numberOfLines={1}>{parsed.merchant ?? 'تراکنش بانکی'}</Text>
                <Text style={styles.meta}>{`${parsed.bank ?? 'بانک نامشخص'}، ${formatRelativeDay(delivered)}، ${formatTime(delivered)}`}</Text>
                <Text style={[styles.amount, { color: parsed.type === 'credit' ? colors.success : colors.expense }]}>
                  {parsed.amount !== null ? `${parsed.type === 'credit' ? 'واریز' : 'برداشت'} ${formatToman(parsed.amount)}` : 'مبلغ نیاز به بررسی دارد'}
                </Text>
                <Text style={styles.openHint}>بررسی و ثبت ←</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.actions}>
              <TouchableOpacity accessibilityRole="button" onPress={() => setExpanded(previous => {
                const next = new Set(previous);
                if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
                return next;
              })} style={styles.action}>
                <Text style={styles.rawLink}>{expanded.has(item.id) ? 'بستن متن پیامک' : 'متن پیامک'}</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled={isBusy} accessibilityRole="button" onPress={() => discard(item)} style={styles.action}>
                {isBusy ? <ActivityIndicator size="small" color={colors.expense} /> : <Text style={styles.discard}>رد کردن</Text>}
              </TouchableOpacity>
            </View>
            {expanded.has(item.id) ? <Text style={styles.raw}>{item.rawSms}</Text> : null}
          </Card>;
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  header: { gap: spacing.md },
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, paddingVertical: spacing.xs },
  bankIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  unknownBank: { fontSize: 23, color: colors.primary },
  details: { flex: 1, gap: spacing.xs },
  merchant: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: { fontSize: 11, lineHeight: 20, color: colors.textMuted },
  amount: { fontSize: 15, fontWeight: '800' },
  openHint: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border },
  action: { minHeight: 44, paddingHorizontal: spacing.sm, justifyContent: 'center' },
  rawLink: { fontSize: 12, color: colors.textMuted },
  discard: { fontSize: 12, fontWeight: '700', color: colors.expense },
  raw: { fontSize: 12, lineHeight: 23, color: colors.textMuted, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  loader: { marginTop: spacing.xxl },
  empty: { alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.md },
  emptyIcon: { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  emptyBody: { fontSize: 13, lineHeight: 24, textAlign: 'center', color: colors.textMuted },
  error: { gap: spacing.md },
  errorText: { fontSize: 12, lineHeight: 22, color: colors.expense },
});
