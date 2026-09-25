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

  /**
   * حالت ذخیره‌شده عمداً دور ریخته می‌شود (`super.onCreate(null)`).
   *
   * وقتی اندروید پروسه را در پس‌زمینه می‌کشد و کاربر با نوتیفیکیشن یا از
   * «برنامه‌های اخیر» برمی‌گردد، Activity با Bundle قبلی ساخته می‌شود و تلاش
   * می‌کند Fragmentهای react-native-screens را از روی آن بسازد — که سازنده‌ی
   * بدون‌آرگومان ندارند: «Unable to instantiate fragment … calling Fragment
   * constructor caused an exception» و اپ همان لحظه می‌بندد. توصیه‌ی رسمی
   * خود کتابخانه همین یک خط است؛ حالت اپ در MMKV است و چیزی از دست نمی‌رود.
   */
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(null)
  }

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
    val reactContext = (application as? ReactApplication)?.reactHost?.currentReactContext

    // پروسه مرده بوده ولی task در «برنامه‌های اخیر» هست: اندروید Activity را با
    // intent قدیمی می‌سازد و intent تازه را همین‌جا می‌دهد — قبل از اینکه
    // جاوااسکریپت بالا آمده باشد. در معماری جدید ReactContext زودتر از اجرای
    // باندل ساخته می‌شود، پس «context هست» یعنی «JS گوش می‌دهد» نیست. متن همیشه
    // نگه داشته می‌شود و JS در شروع با `takePendingSharedText` می‌گیردش؛ رویداد
    // هم برای وقتی که JS واقعاً بالاست. تکراری‌اش را JS خودش کنار می‌گذارد.
    pendingSharedText = sharedText
    reactContext?.emitDeviceEvent(SHARED_TEXT_EVENT, sharedText)
  }

  /**
   * دو منبع، یک خروجی: هم‌رسانی از اپ دیگر (ACTION_SEND با متن ساده) و لمس
   * نوتیفیکیشن خودمان (action اختصاصی). بقیه‌ی intentها به ما ربطی ندارند.
   */
  private fun extractSharedText(intent: Intent?): String? {
    val text =
        when (intent?.action) {
          Intent.ACTION_SEND ->
              if (intent.type == MIME_TEXT_PLAIN) intent.getStringExtra(Intent.EXTRA_TEXT) else null
          ACTION_CONFIRM_TRANSACTION -> intent.getStringExtra(EXTRA_SMS_TEXT)
          else -> null
        }
    return text?.takeIf { it.isNotBlank() }
  }

  companion object {
    /** متنی که قبل از آماده شدن JS رسیده؛ یک بار برداشته می‌شود. */
    @Volatile @JvmStatic var pendingSharedText: String? = null

    /** لمس نوتیفیکیشن «تراکنش تازه». */
    const val ACTION_CONFIRM_TRANSACTION = "com.polbin.action.CONFIRM_TRANSACTION"
    const val EXTRA_SMS_TEXT = "com.polbin.extra.SMS_TEXT"

    private const val SHARED_TEXT_PROP = "sharedText"
    private const val SHARED_TEXT_EVENT = "polbin.sharedText"
    private const val MIME_TEXT_PLAIN = "text/plain"
  }
}
