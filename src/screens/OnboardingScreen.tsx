import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Keyboard, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, radius, spacing } from '../theme';
import { toFaDigits } from '../utils/format';
import { Text } from '../components/Text';
import { TextInput } from '../components/TextInput';
import { RootStackParamList } from '../navigation/types';
import { STORAGE_KEYS, writeJSON } from '../services/storage';
import { useProfile } from '../state/ProfileContext';

const LOGO = require('../public/logos/logo_vertical.png');

const STEPS = [
  {
    emoji: '📩',
    title: 'پیامک بانکی را بفرست',
    body: 'پیامک تراکنش را از پیام‌رسان گوشی‌ات باز کن و با گزینه‌ی «هم‌رسانی» به پول‌بین بده.',
  },
  {
    emoji: '✅',
    title: 'با یک لمس تایید کن',
    body: 'مبلغ، فروشگاه و دسته‌بندی خودکار خوانده می‌شوند. اگر چیزی درست نبود همان‌جا اصلاحش کن.',
  },
  {
    emoji: '📊',
    title: 'ببین پولت کجا می‌رود',
    body: 'خرجت به تفکیک دسته، همراه یک توصیه‌ی کوتاه و عملی برای هفته‌ی پیش رو.',
  },
];

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export function OnboardingScreen({ navigation }: Props) {
  const { setDisplayName } = useProfile();
  const [name, setName] = useState('');
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  // ورودی نام آخرین چیز روی صفحه است و کیبورد رویش می‌افتد.
  //
  // به‌جای حدس زدن زمان با setTimeout، به خود رویداد باز شدن کیبورد گوش می‌دهیم:
  // در آن لحظه پنجره با adjustResize کوچک شده و scrollToEnd دقیقاً ورودی را
  // بالای کیبورد می‌آورد.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () =>
      scrollRef.current?.scrollToEnd({ animated: true }),
    );
    return () => sub.remove();
  }, []);

  function done() {
    setDisplayName(name);
    writeJSON(STORAGE_KEYS.onboardingSeen, true);
    // replace نه navigate: کاربر نباید بتواند با دکمه‌ی بازگشت به معرفی برگردد.
    navigation.replace('Dashboard');
  }

  return (
    <ScreenContainer>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>خرجت را بدون دفترچه بفهم</Text>
        <Text style={styles.subtitle}>
          پول‌بین پیامک‌های بانکی‌ات را می‌خواند و به زبان آدمیزاد می‌گوید پولت کجا رفته.
        </Text>

        <View style={styles.steps}>
          {STEPS.map((step, index) => (
            <View key={step.title} style={styles.step}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepEmoji}>{step.emoji}</Text>
                <Text style={styles.stepNumber}>{toFaDigits(index + 1)}</Text>
              </View>
              <View style={styles.stepText}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepBody}>{step.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.privacyNote}>
          <Text style={styles.privacyText}>
            🔒  پیامک‌هایت هیچ‌وقت از گوشی خارج نمی‌شوند. همه‌چیز روی همین دستگاه پردازش و ذخیره می‌شود.
          </Text>
        </View>

        {/* تنها چیزی که از کاربر می‌پرسیم. حساب کاربری در کار نیست، پس این فقط
            برای سلام گفتن است و خالی گذاشتنش هیچ چیزی را خراب نمی‌کند. */}
        <View style={styles.nameBox}>
          <Text style={styles.nameLabel}>اسمت چیست؟</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="اختیاری"
            placeholderTextColor={colors.textFaint}
            maxLength={24}
            style={styles.nameInput}
            returnKeyType="done"
            onSubmitEditing={done}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppButton title="بزن بریم" onPress={done} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingVertical: spacing.xl,
    gap: spacing.md,
    alignItems: 'stretch',
    // فضای اضافه تا وقتی کیبورد باز است، ورودی بالای لبه‌ی پایین بایستد.
    paddingBottom: spacing.xxl,
  },
  logo: { width: '100%', height: 150, marginBottom: spacing.sm },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  steps: { gap: spacing.lg },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  stepBadge: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepEmoji: { fontSize: 20 },
  stepNumber: {
    position: 'absolute',
    bottom: -7,
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  stepText: { flex: 1, gap: spacing.xs, paddingTop: 2 },
  stepTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  stepBody: { fontSize: 13, color: colors.textMuted, lineHeight: 24 },
  privacyNote: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.successSoft,
  },
  privacyText: { fontSize: 12, color: colors.success, lineHeight: 22, fontWeight: '600' },
  nameBox: { marginTop: spacing.lg, gap: spacing.sm },
  nameLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  nameInput: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.text,
    paddingHorizontal: spacing.md,
  },
  footer: { paddingVertical: spacing.lg },
});
