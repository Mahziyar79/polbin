import { DeviceEventEmitter } from 'react-native';

/** باید با ثابت‌های MainActivity.kt یکی بماند. */
const SHARED_TEXT_EVENT = 'polbin.sharedText';

/** propی که در اجرای سرد از getLaunchOptions می‌آید. */
export interface AppLaunchProps {
  sharedText?: string;
}

/**
 * متنی که اپ با آن باز شده — فقط در اجرای سرد مقدار دارد.
 * فضای خالی محض نادیده گرفته می‌شود تا صفحه‌ی تایید بیهوده باز نشود.
 */
export function readInitialSharedText(props: AppLaunchProps): string | null {
  const text = props.sharedText;
  return typeof text === 'string' && text.trim().length > 0 ? text : null;
}

/**
 * گوش دادن به هم‌رسانی وقتی اپ از قبل باز است.
 * تابع بازگشتی، اشتراک را لغو می‌کند.
 */
export function subscribeToSharedText(handler: (text: string) => void): () => void {
  const subscription = DeviceEventEmitter.addListener(SHARED_TEXT_EVENT, (value: unknown) => {
    if (typeof value === 'string' && value.trim().length > 0) {
      handler(value);
    }
  });

  return () => subscription.remove();
}
