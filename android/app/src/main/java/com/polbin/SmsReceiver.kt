package com.polbin

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.provider.Telephony
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.ReactApplication
import com.facebook.react.common.LifecycleState

/**
 * خواندن خودکار پیامک بانکی.
 *
 * قبل از این، کاربر باید برای هر تراکنش پیام‌رسان را باز می‌کرد، پیامک را
 * پیدا می‌کرد و «هم‌رسانی» می‌زد. اینجا همان متن مستقیم به اپ می‌رسد.
 *
 * دو مسیر، بسته به اینکه اپ باز است یا نه:
 *  - اپ جلوی چشم کاربر است: متن را به‌صورت رویداد می‌فرستیم و صفحه‌ی تایید
 *    همان‌جا باز می‌شود.
 *  - اپ بسته یا در پس‌زمینه است: یک نوتیفیکیشن می‌گذاریم که با لمسش اپ با
 *    همان ACTION_SEND باز می‌شود — دقیقاً همان مسیری که «هم‌رسانی» می‌سازد،
 *    پس هیچ کد جدیدی در سمت جاوااسکریپت لازم نیست.
 *
 * متن پیامک هیچ‌جا ذخیره نمی‌شود؛ فقط از اینجا به صفحه‌ی تایید می‌رود.
 */
class SmsReceiver : BroadcastReceiver() {

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

    val body = readBody(intent) ?: return
    if (!SmsFilter.looksLikeBankSms(body)) return

    val reactContext =
        (context.applicationContext as? ReactApplication)?.reactHost?.currentReactContext

    if (reactContext != null && reactContext.lifecycleState == LifecycleState.RESUMED) {
      reactContext.emitDeviceEvent(SHARED_TEXT_EVENT, body)
      return
    }

    notify(context, body)
  }

  /**
   * پیامک بلند به چند بخش شکسته می‌شود و هر بخش جداگانه می‌آید؛
   * بدون چسباندن، مبلغ ممکن است وسط دو بخش نصف شود.
   */
  private fun readBody(intent: Intent): String? =
      Telephony.Sms.Intents.getMessagesFromIntent(intent)
          ?.joinToString("") { it.displayMessageBody ?: "" }
          ?.takeIf { it.isNotBlank() }

  private fun notify(context: Context, body: String) {
    val manager = NotificationManagerCompat.from(context)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
          NotificationChannel(
                  CHANNEL_ID,
                  "تراکنش‌های تازه",
                  NotificationManager.IMPORTANCE_DEFAULT,
              )
              .apply { description = "وقتی پیامک بانکی می‌رسد" },
      )
    }

    // همان intentی که منوی «هم‌رسانی» می‌سازد، تا اپ مسیر آشنا را برود.
    val open =
        Intent(context, MainActivity::class.java).apply {
          action = Intent.ACTION_SEND
          type = "text/plain"
          putExtra(Intent.EXTRA_TEXT, body)
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }

    val pending =
        PendingIntent.getActivity(
            context,
            body.hashCode(),
            open,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
        )

    val notification =
        NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_menu_edit)
            .setContentTitle("تراکنش تازه")
            .setContentText("برای ثبت در پول‌بین بزن")
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pending)
            .build()

    try {
      manager.notify(body.hashCode(), notification)
    } catch (_: SecurityException) {
      // کاربر مجوز نوتیفیکیشن نداده — پیامک بی‌صدا رد می‌شود، نه اینکه کرش کنیم.
    }
  }

  private companion object {
    const val SHARED_TEXT_EVENT = "polbin.sharedText"
    const val CHANNEL_ID = "polbin.transactions"
  }
}
