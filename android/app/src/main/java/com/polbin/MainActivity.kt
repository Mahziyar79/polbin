package com.polbin

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.ReactApplication
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

/**
 * ورودی اپ، به‌علاوه‌ی دریافت متن از منوی «هم‌رسانی» اندروید.
 *
 * دو مسیر وجود دارد و هر دو لازم‌اند:
 *  - اجرای سرد: اپ بسته است و کاربر پیامک را هم‌رسانی می‌کند. متن از طریق
 *    [getLaunchOptions] به‌عنوان initialProps به جاوااسکریپت می‌رسد.
 *  - اپ باز است: به‌خاطر `launchMode="singleTask"` اندروید [onNewIntent] را
 *    صدا می‌زند نه اینکه Activity تازه بسازد، پس متن را به‌صورت رویداد می‌فرستیم.
 */
class MainActivity : ReactActivity() {

  override fun getMainComponentName(): String = "polbin"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle? {
          val sharedText = extractSharedText(intent) ?: return null
          return Bundle().apply { putString(SHARED_TEXT_PROP, sharedText) }
        }
      }

  override fun onNewIntent(intent: Intent) {
    // تا getIntent() بعداً هم همین intent تازه را برگرداند.
    setIntent(intent)
    super.onNewIntent(intent)

    val sharedText = extractSharedText(intent) ?: return
    (application as? ReactApplication)
        ?.reactHost
        ?.currentReactContext
        ?.emitDeviceEvent(SHARED_TEXT_EVENT, sharedText)
  }

  /** فقط ACTION_SEND با متن ساده؛ بقیه‌ی intentها به ما ربطی ندارند. */
  private fun extractSharedText(intent: Intent?): String? {
    if (intent?.action != Intent.ACTION_SEND) return null
    if (intent.type != MIME_TEXT_PLAIN) return null
    return intent.getStringExtra(Intent.EXTRA_TEXT)?.takeIf { it.isNotBlank() }
  }

  private companion object {
    const val SHARED_TEXT_PROP = "sharedText"
    const val SHARED_TEXT_EVENT = "polbin.sharedText"
    const val MIME_TEXT_PLAIN = "text/plain"
  }
}
