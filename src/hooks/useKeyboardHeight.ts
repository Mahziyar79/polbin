import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * ارتفاعی که کیبورد از پایین صفحه می‌گیرد — صفر وقتی بسته است.
 *
 * چرا لازم است: پروژه `edgeToEdgeEnabled` دارد و از اندروید ۱۵ به بعد اندروید
 * دیگر برای چنین اپ‌هایی پنجره را با `adjustResize` کوچک نمی‌کند. یعنی آن تنظیم
 * در مانیفست بی‌اثر است و کیبورد **روی** محتوا می‌افتد. نتیجه‌اش این بود که
 * دکمه‌ی پایین فرم زیر کیبورد گم می‌شد و کاربر روی کیبورد لمس می‌کرد.
 *
 * ارتفاعِ گزارش‌شده از کف صفحه اندازه‌گیری می‌شود و ناحیه‌ی نوار ناوبری را هم
 * در بر دارد؛ چون `ScreenContainer` آن ناحیه را از قبل padding داده، اینجا
 * کم می‌شود تا دو بار حساب نشود.
 */
export function useKeyboardHeight(): number {
  const insets = useSafeAreaInsets();
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', event => {
      setHeight(Math.max(0, event.endCoordinates.height - insets.bottom));
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, [insets.bottom]);

  return height;
}
