/**
 * mock درون‌حافظه‌ای MMKV برای jest.
 * چون MMKV یک ماژول نیتیو (nitro) است، در محیط تست وجود ندارد.
 * jest این فایل را برای بسته‌های node_modules خودکار برمی‌دارد.
 */
function createMMKV() {
  const store = new Map();

  return {
    id: 'test',
    get length() {
      return store.size;
    },
    set(key, value) {
      store.set(key, value);
    },
    getString(key) {
      return store.get(key);
    },
    getNumber(key) {
      return store.get(key);
    },
    getBoolean(key) {
      return store.get(key);
    },
    contains(key) {
      return store.has(key);
    },
    remove(key) {
      return store.delete(key);
    },
    getAllKeys() {
      return Array.from(store.keys());
    },
    clearAll() {
      store.clear();
    },
  };
}

module.exports = { createMMKV };
