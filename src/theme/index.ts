export const colors = {
  bg: '#F4F6F9',
  surface: '#FFFFFF',
  surfaceAlt: '#F0F3F8',
  text: '#111827',
  textMuted: '#6B7280',
  textFaint: '#9CA3AF',
  border: '#E5E7EB',
  primary: '#2E6BE6',
  primarySoft: '#E7EFFE',
  success: '#12A150',
  successSoft: '#E4F5EC',
  danger: '#E5484D',
  dangerSoft: '#FDECEC',
  warning: '#E08700',
  warningSoft: '#FDF3E2',
} as const;

/** رنگ‌های برگرفته از لوگو — برای onboarding و جاهایی که هویت برند لازم است. */
export const brand = {
  deep: '#015456',
  green: '#01936B',
  leaf: '#3FBF6B',
  gold: '#FDAA04',
  sand: '#FED33D',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * فونت پیش‌فرض سیستم فعلاً استفاده می‌شود.
 * TODO: افزودن فونت وزیرمتن به assets/fonts و لینک با `npx react-native-asset`.
 */
export const fonts = {
  regular: undefined as string | undefined,
  bold: undefined as string | undefined,
} as const;
