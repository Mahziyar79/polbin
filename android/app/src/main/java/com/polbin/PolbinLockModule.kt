package com.polbin

import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * قفل اپ: هش رمز و اثر انگشت.
 *
 * هش در جاوااسکریپت هم می‌شد، ولی PBKDF2 آماده در JVM هست و Hermes نه؛
 * پیاده‌سازی دستی SHA-256 در JS فقط جای اشتباه اضافه می‌کند. اثر انگشت هم
 * فقط از راه `BiometricPrompt` اندروید ممکن است.
 */
class PolbinLockModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName() = NAME

  /** نمک تازه، hex. */
  @ReactMethod
  fun randomSalt(promise: Promise) {
    promise.resolve(PinHasher.toHex(PinHasher.randomSalt()))
  }

  /** هش رمز با نمک داده‌شده، hex. */
  @ReactMethod
  fun hashPin(pin: String, saltHex: String, promise: Promise) {
    try {
      promise.resolve(PinHasher.toHex(PinHasher.hash(pin, PinHasher.fromHex(saltHex))))
    } catch (error: Exception) {
      promise.reject(ERROR_HASH, error.message, error)
    }
  }

  /** مقایسه‌ی زمان‌ثابت هش ذخیره‌شده با رمز واردشده. */
  @ReactMethod
  fun verifyPin(pin: String, saltHex: String, expectedHex: String, promise: Promise) {
    try {
      val actual = PinHasher.hash(pin, PinHasher.fromHex(saltHex))
      promise.resolve(PinHasher.constantTimeEquals(actual, PinHasher.fromHex(expectedHex)))
    } catch (error: Exception) {
      promise.reject(ERROR_HASH, error.message, error)
    }
  }

  /** آیا گوشی اثر انگشت/چهره‌ی ثبت‌شده دارد؟ */
  @ReactMethod
  fun biometricAvailable(promise: Promise) {
    val result = BiometricManager.from(reactContext).canAuthenticate(AUTHENTICATORS)
    promise.resolve(result == BiometricManager.BIOMETRIC_SUCCESS)
  }

  /**
   * پنجره‌ی اثر انگشت اندروید. true یعنی تایید شد؛ false یعنی کاربر بست یا
   * لغو کرد. خطای واقعی (مثلاً قفل شدن حسگر بعد از چند تلاش) reject می‌شود
   * تا JS بتواند پیام متفاوتی بدهد.
   */
  @ReactMethod
  fun authenticate(title: String, negativeText: String, promise: Promise) {
    val activity = reactContext.currentActivity as? FragmentActivity
    if (activity == null) {
      promise.reject(ERROR_NO_ACTIVITY, "اپ در حال حاضر صفحه‌ای باز ندارد.")
      return
    }

    activity.runOnUiThread {
      val executor = ContextCompat.getMainExecutor(activity)
      val callback =
          object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
              promise.resolve(true)
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
              when (errorCode) {
                BiometricPrompt.ERROR_NEGATIVE_BUTTON,
                BiometricPrompt.ERROR_USER_CANCELED,
                BiometricPrompt.ERROR_CANCELED -> promise.resolve(false)
                else -> promise.reject(ERROR_BIOMETRIC, errString.toString())
              }
            }

            // تلاش ناموفقِ تکی؛ پنجره باز می‌ماند و کاربر دوباره امتحان می‌کند.
            override fun onAuthenticationFailed() = Unit
          }

      val info =
          BiometricPrompt.PromptInfo.Builder()
              .setTitle(title)
              .setNegativeButtonText(negativeText)
              .setAllowedAuthenticators(AUTHENTICATORS)
              .setConfirmationRequired(false)
              .build()

      try {
        BiometricPrompt(activity, executor, callback).authenticate(info)
      } catch (error: Exception) {
        promise.reject(ERROR_BIOMETRIC, error.message, error)
      }
    }
  }

  private companion object {
    const val NAME = "PolbinLock"
    const val AUTHENTICATORS = BIOMETRIC_STRONG or BIOMETRIC_WEAK
    const val ERROR_HASH = "E_HASH"
    const val ERROR_BIOMETRIC = "E_BIOMETRIC"
    const val ERROR_NO_ACTIVITY = "E_NO_ACTIVITY"
  }
}
