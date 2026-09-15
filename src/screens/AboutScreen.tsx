import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image, Linking, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../components/Card';
import { FeatureList } from '../components/FeatureList';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { APP_VERSION, SUPPORT_TELEGRAM_URL, SUPPORT_TELEGRAM_USERNAME } from '../data/support';
import { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import { toFaDigits } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

const LOGO = require('../public/logos/logo_vertical.png');


export function AboutScreen({ navigation }: Props) {
  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="بازگشت">
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Image source={LOGO} style={styles.logo} resizeMode="contain" />

        <Text style={styles.tagline}>خرجت را بدون دفترچه بفهم</Text>
        <Text style={styles.version}>{`نسخه‌ی ${toFaDigits(APP_VERSION)}`}</Text>

        <FeatureList />

        <Card style={styles.privacy}>
          <Text style={styles.privacyTitle}>🔒  داده‌ات از گوشی خارج نمی‌شود</Text>
          <Text style={styles.privacyBody}>
            پول‌بین سرور ندارد و حساب کاربری هم نمی‌خواهد. پیامک‌ها روی همین دستگاه خوانده و
            پردازش می‌شوند و متنشان هیچ‌جا ذخیره نمی‌شود. تراکنش‌ها هم فقط در حافظه‌ی همین
            گوشی می‌مانند.
          </Text>
          <Text style={styles.privacyNote}>
            چون هیچ نسخه‌ای روی سرور نیست، اگر گوشی را عوض کردی حتماً قبلش از صفحه‌ی «پشتیبان
            و خروجی» فایل پشتیبان بگیر.
          </Text>
        </Card>

        <Card style={styles.contact}>
          <Text style={styles.contactTitle}>💬  مشکلی دیدی یا پیشنهادی داری؟</Text>
          <Text style={styles.contactBody}>
            پول‌بین سرور ندارد، پس از هیچ خطایی خودش خبردار نمی‌شود. اگر پیامکی غلط خوانده
            شد یا چیزی کار نکرد، مستقیم به سازنده بگو.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(SUPPORT_TELEGRAM_URL).catch(() => {})}
            style={styles.contactLink}
            accessibilityRole="link">
            <Text style={styles.contactLinkText}>{`تلگرام: @${SUPPORT_TELEGRAM_USERNAME}`}</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>

    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  back: {
    alignSelf: 'flex-end',
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 20, color: colors.text, lineHeight: 24 },
  logo: { width: '100%', height: 130, marginTop: spacing.md },
  tagline: { fontSize: 16, fontWeight: '800', color: colors.text, textAlign: 'center' },
  version: {
    fontSize: 12,
    color: colors.textFaint,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  privacy: {
    marginTop: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  privacyTitle: { fontSize: 14, fontWeight: '800', color: colors.success },
  privacyBody: { fontSize: 13, color: colors.text, lineHeight: 24 },
  privacyNote: { fontSize: 12, color: colors.textMuted, lineHeight: 22 },
  contact: { marginTop: spacing.md, gap: spacing.sm },
  contactTitle: { fontSize: 14, fontWeight: '800', color: colors.text },
  contactBody: { fontSize: 13, color: colors.textMuted, lineHeight: 24 },
  contactLink: { alignSelf: 'flex-start', paddingVertical: spacing.xs },
  contactLinkText: { fontSize: 14, fontWeight: '700', color: colors.primary },
});
