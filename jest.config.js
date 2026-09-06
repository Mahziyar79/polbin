module.exports = {
  preset: '@react-native/jest-preset',
  // پریست پیش‌فرض فقط react-native و @react-native را ترانسپایل می‌کند.
  // کتابخانه‌های ناوبری به شکل ESM منتشر می‌شوند و باید به این لیست اضافه شوند،
  // وگرنه jest با «SyntaxError: Unexpected token 'export'» می‌افتد.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-screens|react-native-safe-area-context)/)',
  ],
};
