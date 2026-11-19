package com.polbin

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PolbinPendingSmsModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "PolbinPendingSms"

  @ReactMethod fun getPendingSms(promise: Promise) {
    try { promise.resolve(PendingSmsStore.snapshot(context)) }
    catch (error: Exception) { promise.reject("E_PENDING_READ", "خواندن تراکنش‌های در انتظار ناموفق بود.", error) }
  }

  @ReactMethod fun removePendingSms(id: String, promise: Promise) {
    try { PendingSmsStore.remove(context, id); promise.resolve(true) }
    catch (error: Exception) { promise.reject("E_PENDING_WRITE", "ذخیره‌ی تغییرات تراکنش‌های در انتظار ناموفق بود.", error) }
  }

  @ReactMethod fun takePendingSmsToOpen(promise: Promise) {
    val id = MainActivity.pendingSmsToOpen
    MainActivity.pendingSmsToOpen = null
    promise.resolve(id)
  }
}
