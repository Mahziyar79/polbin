import { useCallback, useState } from 'react';
import { readJSON, STORAGE_KEYS, writeJSON } from '../services/storage';

/**
 * اختلاف‌های مانده‌ای که کاربر گفته «می‌دانم».
 *
 * روی گوشی می‌ماند، وگرنه با هر باز شدن اپ همان کارت دوباره می‌آمد و کاربر
 * دفعه‌ی سوم دیگر هیچ کارتی را جدی نمی‌گرفت.
 */
export function useDismissedGaps(): {
  dismissed: ReadonlySet<string>;
  dismiss: (id: string) => void;
} {
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(
    () => new Set(readJSON<string[]>(STORAGE_KEYS.gapsDismissed, [])),
  );

  const dismiss = useCallback((id: string) => {
    setDismissed(current => {
      const next = new Set(current);
      next.add(id);
      writeJSON(STORAGE_KEYS.gapsDismissed, Array.from(next));
      return next;
    });
  }, []);

  return { dismissed, dismiss };
}
