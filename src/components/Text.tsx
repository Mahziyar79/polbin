import React from 'react';
import { StyleSheet, Text as RNText, TextProps } from 'react-native';
import { fontFamilyForWeight } from '../theme';

/**
 * جایگزین `Text` ری‌اکت‌نیتیو که فونت وزیرمتن را اعمال می‌کند.
 *
 * چرا کامپوننت و نه اضافه کردن `fontFamily` به تک‌تک استایل‌ها:
 * روی اندروید `fontWeight` با فونت سفارشی کار نمی‌کند — باید برای هر وزن،
 * نام خانواده‌ی جداگانه بدهی. این کامپوننت استایل ورودی را می‌خواند، وزنش را
 * درمی‌آورد و فایل درست را انتخاب می‌کند. یعنی همه‌ی `fontWeight: '800'`هایی که
 * از قبل در کد هستند بدون تغییر کار می‌کنند.
 *
 * **`fontWeight` عمداً حذف می‌شود.** اگر هم `fontFamily` سفارشی بدهی هم
 * `fontWeight`، اندروید دنبال ترکیبی می‌گردد که وجود ندارد و **بی‌صدا** به فونت
 * سیستم برمی‌گردد. نتیجه‌اش این بود که متن‌های بدون وزن وزیرمتن می‌شدند و
 * متن‌های وزن‌دار نه. خود نام خانواده وزن را حمل می‌کند، پس `fontWeight` اضافی است.
 *
 * `allowFontScaling={false}` عمدی است: بزرگ‌نمایی فونت سیستم روی اعداد فارسی
 * و جدول‌های مالی چیدمان را می‌شکند.
 */
export function Text({ style, ...rest }: TextProps) {
  const { fontWeight, ...flat } = StyleSheet.flatten(style) ?? {};

  return (
    <RNText
      allowFontScaling={false}
      {...rest}
      style={[flat, { fontFamily: fontFamilyForWeight(fontWeight) }]}
    />
  );
}
