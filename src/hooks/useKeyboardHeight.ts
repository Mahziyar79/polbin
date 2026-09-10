import { useEffect, useState } from 'react';
import { Keyboard, KeyboardEvent, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../theme';

/**
 * فاصله‌ی اطمینان بین کف فوتر و لبه‌ی بالای کیبورد.
 *
 * اندازه‌گیری روی دستگاه نشان داد عددی که اندروید برای کیبورد گزارش می‌کند
 * چند پیکسل با اینست واقعی فرق دارد و فوتر کمی پایین‌تر از لبه‌ی کیبورد
 * می‌نشیند. آن چند پیکسل دیده نمی‌شود ولی لمس را می‌خورد. این فاصله همان خطا
 * را می‌پوشاند و کنار هم نچسبیدن دکمه به کیبورد را هم قشنگ‌تر می‌کند.
 */
const SAFETY_GAP = spacing.sm;

/**
 * ارتفاعی که فوتر باید بالا بیاید تا کیبورد رویش نیفتد — صفر وقتی کیبورد بسته است.
 *
 * چرا لازم است: پروژه `edgeToEdgeEnabled` دارد و از اندروید ۱۵ به بعد اندروید
 * دیگر برای چنین اپ‌هایی پنجره را با `adjustResize` کوچک نمی‌کند. یعنی آن تنظیم
 * در مانیفست بی‌اثر است و کیبورد **روی** محتوا می‌افتد.
 *
 * حساب از روی **لبه‌ی بالای کیبورد** (`screenY`) انجام می‌شود، نه از روی
 * `height`. نسخه‌ی قبلی `height` را می‌گرفت و ارتفاع نوار ناوبری را از آن کم
 * می‌کرد، با این فرض که نوار ناوبری داخل عدد گزارش‌شده هست. آن فرض همیشه درست
 * نیست و نتیجه‌اش این بود که ته فوتر زیر کیبورد می‌ماند: دیده می‌شد، ولی لمسش
 * به کیبورد می‌رسید نه به دکمه. مختصات مطلق هیچ فرضی لازم ندارد.
 *
 * `keyboardDidChangeFrame` هم گوش داده می‌شود چون کیبورد فارسی وسط تایپ
 * قدوقامتش عوض می‌شود (نوار پیشنهاد کلمه، تغییر به صفحه‌ی اعداد یا ایموجی).
 * بدون آن، فوتر سر جای قبلی می‌ماند و کیبوردِ بلندتر رویش می‌افتد — همان حالتی
 * که کاربر می‌گفت «فقط یک قسمت دکمه کار می‌کند».
 */
export function useKeyboardHeight(): number {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [height, setHeight] = useState(0);

  useEffect(() => {
    function apply(event: KeyboardEvent) {
      const keyboardTop = event.endCoordinates.screenY;

      // جایی که کف فوتر بدون کیبورد می‌نشیند: ته پنجره منهای ناحیه‌ی امن.
      const contentBottom = windowHeight - insets.bottom;
      const overlap = contentBottom - keyboardTop;

      setHeight(overlap > 0 ? overlap + SAFETY_GAP : 0);
    }

    const show = Keyboard.addListener('keyboardDidShow', apply);
    const change = Keyboard.addListener('keyboardDidChangeFrame', apply);
    const hide = Keyboard.addListener('keyboardDidHide', () => setHeight(0));

    return () => {
      show.remove();
      change.remove();
      hide.remove();
    };
  }, [insets.bottom, windowHeight]);

  return height;
}
