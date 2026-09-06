import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { requestOtp, verifyOtp } from '../services/fakeApi';
import { useAuth } from '../state/AuthContext';
import { colors, radius, spacing } from '../theme';
import { toEnDigits, toFaDigits } from '../utils/format';

const LOGO = require('../public/logos/logo_vertical.png');

export function LoginScreen() {
  const { signIn } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequestOtp() {
    setError(null);
    setLoading(true);
    try {
      await requestOtp(toEnDigits(phone));
      setStep('otp');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setLoading(true);
    try {
      const { user } = await verifyOtp(toEnDigits(phone), toEnDigits(code));
      signIn(user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.hero}>
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
          <Text style={styles.subtitle}>
            پیامک‌های بانکی‌ات را بفرست، در چند ثانیه بفهم پولت کجا می‌رود.
          </Text>
        </View>

        <View style={styles.form}>
          {step === 'phone' ? (
            <>
              <Text style={styles.label}>شماره موبایل</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                placeholderTextColor={colors.textFaint}
                keyboardType="number-pad"
                maxLength={11}
                style={styles.input}
                textAlign="center"
              />
              <Text style={styles.hint}>کد تایید رایگان برایت پیامک می‌شود.</Text>
              <AppButton
                title="دریافت کد تایید"
                onPress={handleRequestOtp}
                loading={loading}
                disabled={phone.length < 11}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>کد ۴ رقمی</Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="۱۲۳۴"
                placeholderTextColor={colors.textFaint}
                keyboardType="number-pad"
                maxLength={4}
                style={[styles.input, styles.otpInput]}
                textAlign="center"
                autoFocus
              />
              <Text style={styles.hint}>
                نسخه‌ی آزمایشی: هر کد ۴ رقمی پذیرفته می‌شود (مثلاً {toFaDigits(1234)}).
              </Text>
              <AppButton title="ورود" onPress={handleVerify} loading={loading} disabled={code.length < 4} />
              <TouchableOpacity onPress={() => setStep('phone')} style={styles.backLink}>
                <Text style={styles.backText}>تغییر شماره موبایل</Text>
              </TouchableOpacity>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'center', gap: spacing.xxl },
  hero: { alignItems: 'center', gap: spacing.sm },
  logo: { width: 160, height: 160, marginBottom: spacing.sm },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  form: { gap: spacing.md },
  label: { fontSize: 14, fontWeight: '700', color: colors.text },
  input: {
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 18,
    color: colors.text,
    letterSpacing: 1,
  },
  otpInput: { letterSpacing: 8, fontWeight: '700' },
  hint: { fontSize: 12, color: colors.textFaint, lineHeight: 20 },
  backLink: { alignItems: 'center', paddingVertical: spacing.sm },
  backText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
});
