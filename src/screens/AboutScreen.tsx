import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { AppButton } from '../components/AppButton';
import { Card } from '../components/Card';
import { FeatureList } from '../components/FeatureList';
import { ScreenContainer } from '../components/ScreenContainer';
import { Text } from '../components/Text';
import { RootStackParamList } from '../navigation/types';
import { colors, spacing } from '../theme';
import { toFaDigits } from '../utils/format';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

const LOGO = require('../public/logos/logo_vertical.png');

/** باید با `versionName` در android/app/build.gradle یکی بماند. */
const VERSION = '1.0';


export function AboutScreen({ navigation }: Props) {
  return (
    <ScreenContainer flush>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />

        <Text style={styles.tagline}>خرجت را بدون دفترچه بفهم</Text>
        <Text style={styles.version}>{`نسخه‌ی ${toFaDigits(VERSION)}`}</Text>

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
      </ScrollView>

      <View style={styles.footer}>
        <AppButton title="بستن" onPress={() => navigation.goBack()} variant="ghost" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
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
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
