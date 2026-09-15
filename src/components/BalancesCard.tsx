import React, { useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { findBank } from '../data/banks';
import { AccountBalance } from '../services/balances';
import { colors, radius, spacing } from '../theme';
import { formatRelativeDay, formatTime, formatToman, toFaDigits } from '../utils/format';
import { BankMark } from './BankMark';
import { Text } from './Text';

/** مانده‌ای که بیش از این کهنه باشد، برچسب می‌خورد — احتمالاً پیامکی نرسیده. */
const STALE_DAYS = 7;

interface Props {
  accounts: AccountBalance[];
}

function isStale(asOf: string): boolean {
  return Date.now() - new Date(asOf).getTime() > STALE_DAYS * 86_400_000;
}

/** «•••• ۹۸۷۶» برای کارت، «حساب ۵۸۴۰» برای حساب، خالی وقتی هیچ‌کدام. */
function numberLine(account: AccountBalance): string {
  if (account.cardLast4) return `••••  ${toFaDigits(account.cardLast4)}`;
  if (account.accountLast4) return `حساب  ${toFaDigits(account.accountLast4)}`;
  return '';
}

/**
 * موجودی هر کارت، به شکل کارت بانکی، کنار هم و قابل ورق زدن.
 *
 * عمداً چیزی محاسبه نمی‌کند: عدد همان است که بانک نوشته. زمانِ «از پیامکِ …»
 * روی هر کارت هست تا کاربر بداند این عدد مال کی است.
 *
 * ورق زدن با `ScrollView` افقی و `snapToInterval` است نه `pagingEnabled`:
 * paging در چیدمان راست‌به‌چپ اندروید صفحه‌ی اول را از سمت غلط شروع می‌کند.
 */
export function BalancesCard({ accounts }: Props) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);

  if (accounts.length === 0) return null;

  // عرض کارت: عرض صفحه منهای padding دو طرف؛ لبه‌ی کارت بعدی کمی پیدا باشد.
  const cardWidth = width - spacing.lg * 2 - (accounts.length > 1 ? spacing.xl : 0);
  const step = cardWidth + spacing.sm;

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = event.nativeEvent.contentOffset.x;
    setPage(Math.round(x / step));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>موجودی کارت‌ها</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={32}
        contentContainerStyle={styles.rail}>
        {accounts.map(account => {
          const bank = findBank(account.bank);
          const color = bank?.color ?? colors.primaryDark;
          const stale = isStale(account.asOf);

          return (
            <View key={account.key} style={[styles.card, { width: cardWidth, backgroundColor: color }]}>
              {/* دو دایره‌ی کم‌رنگ — همان حس کارت بانکی، بدون تصویر. */}
              <View style={styles.circleBig} />
              <View style={styles.circleSmall} />

              <View style={styles.cardTop}>
                <View style={styles.logoPill}>
                  {bank ? (
                    <BankMark bank={bank} size={30} />
                  ) : (
                    <Text style={styles.logoFallback}>🏦</Text>
                  )}
                </View>
                <Text style={styles.bankName} numberOfLines={1}>
                  {bank?.name ?? account.bank ?? 'بانک نامشخص'}
                </Text>
              </View>

              <Text style={styles.number}>{numberLine(account)}</Text>

              <View style={styles.cardBottom}>
                <View style={styles.balanceBox}>
                  <Text style={styles.balanceLabel}>موجودی</Text>
                  <Text style={styles.balance} numberOfLines={1}>
                    {formatToman(account.balance)}
                  </Text>
                </View>
                <Text style={[styles.asOf, stale ? styles.asOfStale : null]}>
                  {stale ? 'قدیمی — ' : ''}
                  {`از پیامک ${formatRelativeDay(account.asOf)} ${formatTime(account.asOf)}`}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {accounts.length > 1 ? (
        <View style={styles.dots}>
          {accounts.map((account, index) => (
            <View key={account.key} style={[styles.dot, index === page ? styles.dotActive : null]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  rail: { gap: spacing.sm },
  card: {
    height: 172,
    borderRadius: radius.xl,
    padding: spacing.lg,
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  circleBig: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.10)',
    bottom: -110,
    left: -60,
  },
  circleSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
    top: -50,
    right: -30,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logoPill: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFallback: { fontSize: 20 },
  bankName: { flex: 1, fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  number: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: 1 },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm },
  balanceBox: { flexShrink: 1, gap: 2 },
  balanceLabel: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  balance: { fontSize: 22, fontWeight: '800', color: '#FFFFFF' },
  asOf: { flexShrink: 1, fontSize: 10, color: 'rgba(255,255,255,0.75)', textAlign: 'left' },
  asOfStale: { color: '#FFE3A3', fontWeight: '700' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: radius.pill, backgroundColor: colors.border },
  dotActive: { width: 16, backgroundColor: colors.primary },
});
