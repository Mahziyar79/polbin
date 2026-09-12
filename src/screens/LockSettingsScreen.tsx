import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { FormScreenHeader } from '../components/FormScreenHeader';
import { PinPad } from '../components/PinPad';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { biometricAvailable } from '../services/lock';
import { useLock } from '../state/LockContext';
import { colors, radius, spacing } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'LockSettings'>;

/**
 * مراحل تنظیم رمز. هر تغییرِ رمز دو بار می‌پرسد؛ روشن/خاموش کردن هم اول رمز
 * فعلی را می‌خواهد تا کسی که گوشیِ باز را برداشته نتواند قفل را بردارد.
 */
type Step =
  | { kind: 'idle' }
  | { kind: 'verify'; then: 'disable' | 'change' }
  | { kind: 'new'; then: 'enable' | 'change' }
  | { kind: 'confirm'; then: 'enable' | 'change'; first: string };

export function LockSettingsScreen({ navigation }: Props) {
  const lock = useLock();
  const [step, setStep] = useState<Step>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);
  const [resetKey, setResetKey] = useState(0);
  const [canBiometric, setCanBiometric] = useState(false);

  useEffect(() => {
    biometricAvailable().then(setCanBiometric);
  }, []);

  function restart(message: string | null) {
    setError(message);
    setResetKey(key => key + 1);
  }

  async function handlePin(pin: string) {
    if (step.kind === 'verify') {
      const ok = await lock.tryPin(pin);
      if (!ok) return restart('رمز فعلی درست نیست.');
      if (step.then === 'disable') {
        lock.disable();
        setStep({ kind: 'idle' });
        return;
      }
      setStep({ kind: 'new', then: 'change' });
      return restart(null);
    }

    if (step.kind === 'new') {
      setStep({ kind: 'confirm', then: step.then, first: pin });
      return restart(null);
    }

    if (step.kind === 'confirm') {
      if (pin !== step.first) {
        setStep({ kind: 'new', then: step.then });
        return restart('دو رمز یکی نبودند؛ از اول.');
      }
      if (step.then === 'enable') await lock.enable(pin, false);
      else await lock.changePin(pin);
      setStep({ kind: 'idle' });
      return restart(null);
    }
  }

  const prompt =
    step.kind === 'verify'
      ? 'رمز فعلی را بزن'
      : step.kind === 'new'
        ? 'رمز جدید چهاررقمی'
        : step.kind === 'confirm'
          ? 'یک بار دیگر همان رمز'
          : '';

  if (!lock.available) {
    return (
      <ScreenContainer>
        <FormScreenHeader title="قفل اپ" subtitle="این قابلیت نیاز به نصب دوباره‌ی اپ دارد." />
        <AppButton title="بستن" onPress={() => navigation.goBack()} variant="ghost" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content}>
        <FormScreenHeader
          title="قفل اپ"
          subtitle="با رمز، هر کسی که گوشی را بردارد موجودی و خرج‌هایت را نمی‌بیند. رمز فقط روی همین گوشی است."
        />

        {step.kind !== 'idle' ? (
          <Card style={styles.padCard}>
            <Text style={styles.prompt}>{error ?? prompt}</Text>
            <PinPad onComplete={handlePin} resetKey={resetKey} />
            <TouchableOpacity onPress={() => { setStep({ kind: 'idle' }); restart(null); }} style={styles.cancel}>
              <Text style={styles.cancelText}>بی‌خیال</Text>
            </TouchableOpacity>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>رمز عبور</Text>
                  <Text style={styles.rowBody}>
                    {lock.enabled ? 'روشن — با هر بار باز شدن اپ پرسیده می‌شود.' : 'خاموش'}
                  </Text>
                </View>
                <Switch
                  value={lock.enabled}
                  onValueChange={on =>
                    on ? setStep({ kind: 'new', then: 'enable' }) : setStep({ kind: 'verify', then: 'disable' })
                  }
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.surface}
                />
              </View>

              {lock.enabled ? (
                <TouchableOpacity onPress={() => setStep({ kind: 'verify', then: 'change' })} style={styles.link}>
                  <Text style={styles.linkText}>تغییر رمز</Text>
                </TouchableOpacity>
              ) : null}
            </Card>

            {lock.enabled ? (
              <Card style={styles.card}>
                <View style={styles.rowBetween}>
                  <View style={styles.rowText}>
                    <Text style={styles.rowTitle}>اثر انگشت / چهره</Text>
                    <Text style={styles.rowBody}>
                      {canBiometric
                        ? 'به‌جای رمز، با همان قفل خود گوشی باز شود. رمز همیشه به‌عنوان راه دوم می‌ماند.'
                        : 'روی این گوشی اثر انگشت یا چهره ثبت نشده.'}
                    </Text>
                  </View>
                  <Switch
                    value={lock.biometric}
                    disabled={!canBiometric}
                    onValueChange={lock.setBiometric}
                    trackColor={{ true: colors.primary, false: colors.border }}
                    thumbColor={colors.surface}
                  />
                </View>
              </Card>
            ) : null}

            <Text style={styles.note}>
              رمز جایی ذخیره نمی‌شود؛ فقط اثرِ آن. اگر فراموشش کنی راه بازیابی نیست، چون سروری
              در کار نیست — پس پشتیبان بگیر.
            </Text>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <AppButton title="بستن" onPress={() => navigation.goBack()} variant="ghost" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  card: { gap: spacing.sm },
  padCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  prompt: { fontSize: 14, fontWeight: '700', color: colors.text, minHeight: 22 },
  cancel: { paddingVertical: spacing.sm },
  cancelText: { fontSize: 13, color: colors.textMuted },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  rowBody: { fontSize: 12, color: colors.textMuted, lineHeight: 20 },
  link: { paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  linkText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  note: {
    fontSize: 12,
    color: colors.textFaint,
    lineHeight: 22,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
