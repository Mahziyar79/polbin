import React from 'react';
import { StyleSheet, TextInput as RNTextInput, TextInputProps } from 'react-native';
import { fontFamilyForWeight } from '../theme';

/**
 * همتای [Text] برای فیلدهای ورودی.
 *
 * `TextInput` فونتش را از `Text` به ارث نمی‌برد، پس بدون این، مبلغ و نام
 * فروشگاه و شماره موبایل با فونت سیستم رندر می‌شدند در حالی که بقیه‌ی صفحه
 * وزیرمتن بود.
 *
 * مثل [Text]، `fontWeight` حذف می‌شود چون نام خانواده خودش وزن را حمل می‌کند.
 */
export function TextInput({ style, ...rest }: TextInputProps) {
  const { fontWeight, ...flat } = StyleSheet.flatten(style) ?? {};

  return (
    <RNTextInput
      allowFontScaling={false}
      {...rest}
      style={[flat, { fontFamily: fontFamilyForWeight(fontWeight) }]}
    />
  );
}
