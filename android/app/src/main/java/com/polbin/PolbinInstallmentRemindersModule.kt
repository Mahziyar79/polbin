package com.polbin

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class PolbinInstallmentRemindersModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  override fun getName() = "PolbinInstallmentReminders"
  @ReactMethod fun replace(json: String, promise: Promise) {
    try { InstallmentReminderScheduler.replace(context, json); promise.resolve(true) }
    catch (error: Exception) { promise.reject("E_REMINDER", "تنظیم یادآوری اقساط ناموفق بود.", error) }
  }
}
