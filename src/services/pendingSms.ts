import { DeviceEventEmitter, NativeModules } from 'react-native';

export interface PendingSms {
  id: string;
  rawSms: string;
  /** Original SMS delivery time, in milliseconds. */
  receivedAt: number;
}

interface PendingSmsNative {
  getPendingSms(): Promise<string>;
  removePendingSms(id: string): Promise<boolean>;
  removePendingSmsBatch?(json: string): Promise<boolean>;
  takePendingSmsToOpen(): Promise<string | null>;
}

function native(): PendingSmsNative | undefined {
  return NativeModules.PolbinPendingSms as PendingSmsNative | undefined;
}

export async function fetchPendingSms(): Promise<PendingSms[]> {
  if (!native()) return [];
  const parsed: unknown = JSON.parse(await native()!.getPendingSms());
  if (!Array.isArray(parsed) || parsed.some(item =>
    !item || typeof item.id !== 'string' || typeof item.rawSms !== 'string' ||
    typeof item.receivedAt !== 'number' || !Number.isFinite(item.receivedAt) ||
    Number.isNaN(new Date(item.receivedAt).getTime()))) {
    throw new Error('خواندن تراکنش‌های در انتظار ناموفق بود. دوباره تلاش کن.');
  }
  return parsed as PendingSms[];
}

export async function removePendingSms(id: string): Promise<void> {
  if (!native()) throw new Error('برای استفاده از این قابلیت، بیلد جدید اپ را نصب کن.');
  await native()!.removePendingSms(id);
}

export async function removePendingSmsBatch(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const module = native();
  if (!module?.removePendingSmsBatch) throw new Error('برای استفاده از این قابلیت، بیلد جدید اپ را نصب کن.');
  if (!await module.removePendingSmsBatch(JSON.stringify([...new Set(ids)]))) throw new Error('حذف اعلان‌ها ناموفق بود.');
}

export async function takePendingSmsToOpen(): Promise<string | null> {
  return native() ? native()!.takePendingSmsToOpen() : null;
}

export function subscribeToPendingSms(handler: () => void): () => void {
  const subscription = DeviceEventEmitter.addListener('polbin.pendingSmsChanged', handler);
  return () => subscription.remove();
}

export function subscribeToOpenPendingSms(handler: (id: string) => void): () => void {
  const subscription = DeviceEventEmitter.addListener('polbin.openPendingSms', (id: unknown) => {
    if (typeof id === 'string' && id) handler(id);
  });
  return () => subscription.remove();
}
