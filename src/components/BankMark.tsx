import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import { Bank } from '../data/banks';
import { radius } from '../theme';
import { Text } from './Text';

/**
 * لوگوی بانک‌ها، به تفکیک شناسه‌ی بانک.
 *
 * `require` باید رشته‌ی ثابت باشد و نمی‌شود مسیر را از روی شناسه ساخت، پس هر
 * بانک یک خط دارد. بانکی که اینجا نباشد (مثل بلوبانک) خودکار به نشان رنگی با
 * نام کوتاه برمی‌گردد — پس اضافه کردن بانک تازه بدون لوگو چیزی را نمی‌شکند.
 */
const BANK_LOGOS: Record<string, ImageSourcePropType> = {
  ayandeh: require('../public/banks/ayandeh.png'),
  dey: require('../public/banks/dey.png'),
  eghtesad: require('../public/banks/eghtesad.png'),
  gardeshgari: require('../public/banks/gardeshgari.png'),
  iranzamin: require('../public/banks/iranzamin.png'),
  karafarin: require('../public/banks/karafarin.png'),
  keshavarzi: require('../public/banks/keshavarzi.png'),
  khavarmianeh: require('../public/banks/khavarmianeh.png'),
  maskan: require('../public/banks/maskan.png'),
  mellat: require('../public/banks/mellat.png'),
  melli: require('../public/banks/melli.png'),
  parsian: require('../public/banks/parsian.png'),
  pasargad: require('../public/banks/pasargad.png'),
  postbank: require('../public/banks/postbank.png'),
  refah: require('../public/banks/refah.png'),
  resalat: require('../public/banks/resalat.png'),
  saderat: require('../public/banks/saderat.png'),
  saman: require('../public/banks/saman.png'),
  sarmayeh: require('../public/banks/sarmayeh.png'),
  sepah: require('../public/banks/sepah.png'),
  shahr: require('../public/banks/shahr.png'),
  sina: require('../public/banks/sina.png'),
  tejarat: require('../public/banks/tejarat.png'),
  blu: require('../public/banks/blu.png')
};

interface Props {
  bank: Bank;
  size?: number;
}

export function BankMark({ bank, size = 34 }: Props) {
  const logo = BANK_LOGOS[bank.id];

  return (
    <View
      style={[
        styles.mark,
        { width: size, height: size, borderRadius: radius.sm },
        logo ? styles.withLogo : { backgroundColor: bank.color },
      ]}>
      {logo ? (
        <Image source={logo} style={styles.logo} resizeMode="contain" />
      ) : (
        <Text style={size <= 24 ? styles.shortTiny : styles.short} numberOfLines={1}>
          {/*
            سه حرف اول، نه نام کوتاه کامل.
            «صادرات» و «تجارت» در این عرض جا نمی‌شدند و با «…» بریده می‌شدند.
            سه حرف هم جا می‌شود و هم بانک‌ها را از هم جدا نگه می‌دارد
            («ملت» و «ملی»، «سپه» و «سرم»).
          */}
          {bank.short.slice(0, 3)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  withLogo: { backgroundColor: 'transparent' },
  logo: { width: '100%', height: '100%' },
  short: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
    paddingHorizontal: 2,
    textAlign: 'center',
  },
  shortTiny: {
    fontSize: 8,
    color: '#FFFFFF',
    fontWeight: '800',
    paddingHorizontal: 1,
    textAlign: 'center',
  },
});
