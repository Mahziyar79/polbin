package com.polbin

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import java.text.NumberFormat
import java.util.Locale

/** A single inexact alarm is enough; no exact-alarm permission or server is needed. */
object InstallmentReminderScheduler {
  private const val PREFS = "polbin.installment-reminders.v1"
  private const val CHANNEL = "polbin.installments"
  private const val TAG = "installment:"

  private fun alarmIntent(context: Context) = PendingIntent.getBroadcast(
      context, 8001, Intent(context, InstallmentReminderReceiver::class.java).setAction("com.polbin.INSTALLMENT_REMINDER"),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
  )

  @Synchronized fun replace(context: Context, json: String) {
    val entries = JSONArray(json)
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    check(prefs.edit().putString("entries", entries.toString()).commit())
    val keys = (0 until entries.length()).map { entries.getJSONObject(it).getString("key") }.toSet()
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    manager.activeNotifications.filter { it.tag?.startsWith(TAG) == true && it.tag!!.removePrefix(TAG) !in keys }
        .forEach { manager.cancel(it.tag, it.id) }
    schedule(context)
  }

  @Synchronized fun schedule(context: Context, deliver: Boolean = false) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val entries = JSONArray(prefs.getString("entries", "[]"))
    val delivered = prefs.getStringSet("delivered", emptySet())!!.toMutableSet()
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val alarm = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val now = System.currentTimeMillis()
    var next = Long.MAX_VALUE
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(NotificationChannel(CHANNEL, "یادآوری اقساط", NotificationManager.IMPORTANCE_DEFAULT))
    }
    val permitted = Build.VERSION.SDK_INT < 33 || context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    val keys = mutableSetOf<String>()
    for (index in 0 until entries.length()) {
      val entry = entries.getJSONObject(index)
      val key = entry.getString("key")
      keys.add(key)
      if (key in delivered) continue
      val trigger = entry.getLong("triggerAt")
      if (trigger > now) { next = minOf(next, trigger); continue }
      if (!deliver) { next = minOf(next, now + 1000); continue }
      // Do not surface stale reminders more than a day after the due date.
      if (permitted && now <= entry.getLong("dueAt") + 86_400_000) {
        val open = PendingIntent.getActivity(context, 8002,
            Intent(context, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
        val amount = NumberFormat.getIntegerInstance(Locale.forLanguageTag("fa-IR")).format(entry.getLong("amount"))
        val number = NumberFormat.getIntegerInstance(Locale.forLanguageTag("fa-IR")).format(entry.getInt("number"))
        val isCheque = entry.optString("kind") == "cheque"
        val body = "${entry.getString("title")} · ${if (isCheque) "چک" else "قسط $number"} · $amount تومان"
        manager.notify(TAG + key, 1, NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_stat_polbin).setContentTitle(if (isCheque) "یادآوری سررسید چک" else "یادآوری سررسید قسط")
            .setContentText(body).setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE).setAutoCancel(true).setContentIntent(open).build())
      }
      delivered.add(key)
    }
    delivered.retainAll(keys)
    check(prefs.edit().putStringSet("delivered", delivered).commit())
    alarm.cancel(alarmIntent(context))
    if (next != Long.MAX_VALUE) alarm.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, alarmIntent(context))
  }
}

class InstallmentReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    try { InstallmentReminderScheduler.schedule(context, deliver = true) }
    catch (error: Exception) { android.util.Log.e("PolbinInstallments", "Unable to schedule reminders", error) }
  }
}
