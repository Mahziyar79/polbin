package com.polbin

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.net.Uri
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
 *  - اپ بسته یا در پس‌زمینه است: یک نوتیفیکیشن می‌گذاریم که با لمسش اپ با یک
 *    action اختصاصی باز می‌شود و MainActivity متن را به همان مسیرِ «هم‌رسانی»
 *    در جاوااسکریپت می‌رساند.
 *
 * پیامک بانکی قبل از اعلان در حافظه‌ی خصوصی اپ ثبت می‌شود تا گم نشود.
 */
class TransactionSmsReceiver : BroadcastReceiver() {

  override fun onReceive(context: Context, intent: Intent) {
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

    val body = readBody(intent) ?: return
    if (!SmsFilter.looksLikeBankSms(body)) return

    val receivedAt = Telephony.Sms.Intents.getMessagesFromIntent(intent)
        ?.firstOrNull()?.timestampMillis ?: System.currentTimeMillis()
    val item = try {
      PendingSmsStore.enqueue(context, body, receivedAt) ?: return
    } catch (_: Exception) {
      // Keep a legacy-style notification as a recovery path if disk storage fails.
      notify(context, body, null)
      return
    }

    val reactContext =
        (context.applicationContext as? ReactApplication)?.reactHost?.currentReactContext

    if (reactContext != null && reactContext.lifecycleState == LifecycleState.RESUMED) {
      reactContext.emitDeviceEvent(PendingSmsStore.CHANGED_EVENT, null)
      reactContext.emitDeviceEvent(PendingSmsStore.OPEN_EVENT, item.id)
      return
    }

    reactContext?.emitDeviceEvent(PendingSmsStore.CHANGED_EVENT, null)
    notify(context, body, item.id)
  }

  /**
   * پیامک بلند به چند بخش شکسته می‌شود و هر بخش جداگانه می‌آید؛
   * بدون چسباندن، مبلغ ممکن است وسط دو بخش نصف شود.
   */
  private fun readBody(intent: Intent): String? =
      Telephony.Sms.Intents.getMessagesFromIntent(intent)
          ?.joinToString("") { it.displayMessageBody ?: "" }
          ?.takeIf { it.isNotBlank() }

  private fun notify(context: Context, body: String, pendingId: String?) {
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

    // action اختصاصی، نه ACTION_SEND. قبلاً همان intent هم‌رسانی ساخته می‌شد تا
    // MainActivity یک مسیر داشته باشد؛ ولی «متن پیامک → ACTION_SEND» دقیقاً
    // امضای بدافزاری است که پیامک را به اپ دیگری می‌فرستد، و آنتی‌ویروس بازار
    // همین را گرفت. MainActivity هر دو را می‌فهمد.
    val open =
        Intent(context, MainActivity::class.java).apply {
          action = MainActivity.ACTION_CONFIRM_TRANSACTION
          putExtra(MainActivity.EXTRA_SMS_TEXT, body)
          if (pendingId != null) putExtra(PendingSmsStore.EXTRA_PENDING_ID, pendingId)
          // Extras do not participate in PendingIntent identity; equal SMS bodies may be distinct.
          if (pendingId != null) data = Uri.parse("polbin://pending/$pendingId")
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
            .setSmallIcon(R.drawable.ic_stat_polbin)
            .setContentTitle("تراکنش تازه")
            .setContentText("برای ثبت در پول‌بین بزن")
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .addExtras(Bundle().apply { if (pendingId != null) putString(PendingSmsStore.EXTRA_PENDING_ID, pendingId) })
            .setContentIntent(pending)
            .build()

    try {
      if (pendingId != null) manager.notify(pendingId, PendingSmsStore.NOTIFICATION_ID, notification)
      else manager.notify(body.hashCode(), notification)
    } catch (_: SecurityException) {
      // کاربر مجوز نوتیفیکیشن نداده — پیامک بی‌صدا رد می‌شود، نه اینکه کرش کنیم.
    }
  }

  private companion object {
    const val CHANNEL_ID = "polbin.transactions"
  }
}
