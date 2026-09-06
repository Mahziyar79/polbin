import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { brand, colors, radius, spacing } from '../theme';
import { toFaDigits } from '../utils/format';

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

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
      </ScrollView>

      <View style={styles.footer}>
        <AppButton title="بزن بریم" onPress={onDone} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingVertical: spacing.xl, gap: spacing.md, alignItems: 'stretch' },
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
    backgroundColor: brand.green,
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
  footer: { paddingVertical: spacing.lg },
});
