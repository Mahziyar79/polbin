import React from 'react';
import { StyleSheet, View } from 'react-native';
import { findBank } from '../data/banks';
import { AccountBalance, accountLabel, totalBalance } from '../services/balances';
import { colors, radius, spacing } from '../theme';
import { formatRelativeDay, formatTime, formatToman } from '../utils/format';
import { BankMark } from './BankMark';
import { Card } from './Card';
import { Text } from './Text';

/** مانده‌ای که بیش از این کهنه باشد، کم‌رنگ می‌شود — احتمالاً پیامکی نرسیده. */
const STALE_DAYS = 7;

interface Props {
  accounts: AccountBalance[];
}

function isStale(asOf: string): boolean {
  return Date.now() - new Date(asOf).getTime() > STALE_DAYS * 86_400_000;
}

/**
 * موجودی هر کارت، از روی آخرین پیامک بانک.
 *
 * عمداً چیزی محاسبه نمی‌کند: عدد همان است که بانک نوشته. زمانِ «از پیامکِ …»
 * کنار هر ردیف هست تا کاربر بداند این عدد مال کی است، و اگر یک هفته گذشته باشد
 * کم‌رنگ می‌شود — یعنی احتمالاً تراکنشی بوده که پیامکش به اپ نرسیده.
 */
export function BalancesCard({ accounts }: Props) {
  if (accounts.length === 0) return null;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>موجودی کارت‌ها</Text>
        {accounts.length > 1 ? (
          <Text style={styles.total}>{formatToman(totalBalance(accounts))}</Text>
        ) : null}
      </View>

      {accounts.map((account, index) => {
        const bank = findBank(account.bank);
        const stale = isStale(account.asOf);
        const label = accountLabel(account);

        return (
          <View key={account.key} style={[styles.row, index > 0 ? styles.rowDivider : null]}>
            {bank ? (
              <BankMark bank={bank} size={32} />
            ) : (
              <View style={styles.markFallback} />
            )}

            <View style={styles.textBox}>
              <Text style={styles.name} numberOfLines={1}>
                {bank?.short ?? account.bank ?? 'بانک نامشخص'}
                {label ? `، ${label}` : ''}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {`از پیامک ${formatRelativeDay(account.asOf)} ${formatTime(account.asOf)}`}
              </Text>
            </View>

            <Text style={[styles.balance, stale ? styles.balanceStale : null]}>
              {formatToman(account.balance)}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text },
  total: { fontSize: 13, fontWeight: '800', color: colors.primaryDark },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  rowDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  markFallback: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  textBox: { flex: 1, gap: 2 },
  name: { fontSize: 13, fontWeight: '700', color: colors.text },
  meta: { fontSize: 11, color: colors.textFaint },
  balance: { fontSize: 15, fontWeight: '800', color: colors.text },
  balanceStale: { color: colors.textFaint },
});
