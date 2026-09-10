import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { formatToman, formatTomanShort, toFaDigits } from '../utils/format';
import { daysLeftInJalaliMonth, jalaliMonthName } from '../utils/jalali';
import { Card } from './Card';
import { Text } from './Text';

interface Props {
  /** خرج ماه جاری به تومان. */
  spent: number;
  /** سقف ماهانه؛ null یعنی هنوز گذاشته نشده. */
  monthly: number | null;
  /** قسط‌های پرداخت‌نشده‌ی همین ماه — از باقی‌مانده کنار گذاشته می‌شود. */
  committed?: number;
  onPress: () => void;
}

/** زیر ۸۰٪ آرام، بین ۸۰ تا ۱۰۰ هشدار، بالای سقف قرمز. */
function toneFor(ratio: number) {
  if (ratio >= 1) return { bar: colors.expense, text: colors.expense };
  if (ratio >= 0.8) return { bar: colors.gold, text: colors.text };
  return { bar: colors.primary, text: colors.text };
}

/**
 * دو حالتِ کارت عمداً دو کامپوننت جدا هستند.
 *
 * وقتی هر دو در یک تابع بودند و شرط عوض می‌شد، React درخت را به‌جای ساختن
 * دوباره، روی همان viewهای نیتیو تطبیق می‌داد. نتیجه‌اش دو باگ بود که فقط بعد
 * از گذاشتن سقف دیده می‌شد: کادر نقطه‌چینِ حالت خالی می‌ماند (چون `borderStyle`
 * در استایل جدید نیست و هرگز ریست نمی‌شد) و نام ماه از تیتر می‌افتاد.
 * با دو کامپوننت متفاوت، React مجبور است حالت قبلی را unmount کند.
 */
export function BudgetCard({ spent, monthly, committed = 0, onPress }: Props) {
  if (monthly === null) return <BudgetEmptyCard onPress={onPress} />;
  return (
    <BudgetProgressCard
      spent={spent}
      monthly={monthly}
      committed={committed}
      onPress={onPress}
    />
  );
}

function BudgetEmptyCard({ onPress }: { onPress: () => void }) {
  const monthLabel = jalaliMonthName(new Date());

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>{`برای ${monthLabel} سقف خرج بگذار`}</Text>
        <Text style={styles.emptyBody}>
          وقتی سقف داشته باشی، پول‌بین می‌گوید تا آخر ماه روزی چقدر می‌توانی خرج کنی.
        </Text>
        <Text style={styles.emptyAction}>گذاشتن سقف ماهانه ←</Text>
      </Card>
    </TouchableOpacity>
  );
}

/**
 * پیشرفت خرج ماه در برابر سقف.
 *
 * عدد «روزی چقدر» مهم‌ترین بخش است: «۸۰۰ هزار تومان مانده» به‌تنهایی نمی‌گوید
 * زیاد است یا کم؛ «روزی ۶۶ هزار تومان» قابل تصمیم‌گیری است.
 */
function BudgetProgressCard({
  spent,
  monthly,
  committed,
  onPress,
}: {
  spent: number;
  monthly: number;
  committed: number;
  onPress: () => void;
}) {
  const monthLabel = jalaliMonthName(new Date());
  const ratio = spent / monthly;
  const remaining = monthly - spent;
  const daysLeft = daysLeftInJalaliMonth();
  const tone = toneFor(ratio);

  // قسط‌های این ماه هنوز خرج نشده‌اند ولی قابل خرج کردن هم نیستند. «روزی چقدر»
  // باید از پولی حساب شود که واقعاً آزاد است، وگرنه عددی می‌دهد که کاربر با
  // اعتماد به آن خرج می‌کند و آخر ماه قسطش می‌ماند.
  const free = remaining - committed;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <View style={styles.header}>
          {/*
            `flex: 1` لازم است، تزئینی نیست.
            بدون آن، این متن داخل ردیف بدون عرض مشخص می‌ماند و اندروید در حالت
            راست‌به‌چپ دُمش را می‌انداخت: تیتر «بودجه‌ی» بدون نام ماه رندر می‌شد،
            در حالی که همین رشته بیرون از ردیف کامل نمایش داده می‌شد.
          */}
          <Text style={styles.title} numberOfLines={1}>
            {`بودجه‌ی ${monthLabel}`}
          </Text>
          <Text style={[styles.percent, { color: tone.text }]}>
            {toFaDigits(Math.round(ratio * 100))}٪
          </Text>
        </View>

        <View style={styles.track}>
          <View
            style={[
              styles.fill,
              { backgroundColor: tone.bar, width: `${Math.min(ratio, 1) * 100}%` },
            ]}
          />
        </View>

        <Text style={styles.amounts}>
          {`${formatToman(spent, false)} از ${formatToman(monthly)}`}
        </Text>

        {/*
          جداکننده‌ی «·» بین متن فارسی و عدد، در چیدمان دوجهته سر جای غلطی
          می‌نشست و «مانده ۱۳ روز» را شبیه «مانده ۱۳ ۰ روز» نشان می‌داد.
          جمله طوری بازنویسی شد که بین کلمه و عدد فقط حرف فارسی باشد.
        */}
        {remaining >= 0 ? (
          <>
            <Text style={styles.hint}>
              {`${formatTomanShort(remaining)} برای ${toFaDigits(daysLeft)} روز باقی‌مانده`}
            </Text>
            {committed > 0 ? (
              <Text style={styles.hint}>
                {`از این مبلغ ${formatTomanShort(committed)} قسط این ماه است`}
              </Text>
            ) : null}
            {free > 0 ? (
              <Text style={styles.hint}>
                {`یعنی روزی ${formatTomanShort(Math.floor(free / daysLeft))}`}
              </Text>
            ) : (
              <Text style={styles.over}>قسط‌های این ماه از باقی‌مانده‌ات بیشتر است</Text>
            )}
          </>
        ) : (
          <Text style={styles.over}>
            {`${formatTomanShort(Math.abs(remaining))} از سقف گذشته‌ای`}
          </Text>
        )}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // `borderStyle` صریح است تا اگر جایی روی view قبلی تطبیق شد، ریست شود.
  card: { gap: spacing.sm, borderStyle: 'solid' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { flex: 1, fontSize: 14, fontWeight: '800', color: colors.text },
  percent: { fontSize: 14, fontWeight: '800' },
  track: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
  amounts: { fontSize: 13, color: colors.textMuted },
  hint: { fontSize: 12, color: colors.textFaint, lineHeight: 22 },
  over: { fontSize: 12, color: colors.expense, fontWeight: '700', lineHeight: 22 },

  emptyCard: { gap: spacing.xs, borderStyle: 'dashed', borderColor: colors.primary },
  emptyTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  emptyBody: { fontSize: 12, color: colors.textMuted, lineHeight: 22 },
  emptyAction: { fontSize: 13, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
});

