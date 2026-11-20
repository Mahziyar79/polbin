package com.polbin

import android.app.Notification
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import org.json.JSONArray
import org.json.JSONObject

/** App-private storage shared by the receiver and JS bridge, even without a JS process. */
object PendingSmsStore {
  const val CHANGED_EVENT = "polbin.pendingSmsChanged"
  const val OPEN_EVENT = "polbin.openPendingSms"
  const val CHANNEL_ID = "polbin.transactions"
  const val NOTIFICATION_ID = 1
  const val EXTRA_PENDING_ID = "com.polbin.extra.PENDING_SMS_ID"
  private const val PREFS = "polbin.pending-sms.v1"

  private fun read(context: Context): PendingSmsQueue {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val saved = JSONArray(prefs.getString("entries", "[]"))
    val resolved = JSONArray(prefs.getString("resolved", "[]"))
    return PendingSmsQueue(
        (0 until saved.length()).map { i ->
          val item = saved.getJSONObject(i)
          PendingSmsEntry(item.getString("id"), item.getString("rawSms"), item.getLong("receivedAt"))
        },
        (0 until resolved.length()).map { resolved.getString(it) },
    )
  }

  private fun encode(entries: List<PendingSmsEntry>): JSONArray = JSONArray().apply {
    entries.sortedByDescending { it.receivedAt }.forEach { item ->
      put(JSONObject().put("id", item.id).put("rawSms", item.rawSms).put("receivedAt", item.receivedAt))
    }
  }

  private fun save(context: Context, queue: PendingSmsQueue) {
    // commit is intentional: the broadcast must not finish before the queue is durable.
    val saved = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
        .putString("entries", encode(queue.entries).toString())
        .putString("resolved", JSONArray(queue.resolved).toString()).commit()
    check(saved) { "Unable to persist pending SMS" }
  }

  @Synchronized fun enqueue(context: Context, body: String, receivedAt: Long): PendingSmsEntry? {
    val queue = read(context)
    val item = queue.add(body, receivedAt)
    save(context, queue)
    return item
  }

  @Synchronized fun enqueueLegacy(context: Context, body: String, receivedAt: Long): PendingSmsEntry? {
    val queue = read(context)
    queue.entries.firstOrNull { it.rawSms == body }?.let { return it }
    val item = queue.add(body, receivedAt, legacy = true)
    save(context, queue)
    return item
  }

  @Synchronized fun snapshot(context: Context): String {
    // Recover transaction notifications created by versions before the persistent queue.
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val queue = read(context)
    var imported = false
    manager.activeNotifications.forEach { active ->
      val notification = active.notification
      val ownChannel = Build.VERSION.SDK_INT < Build.VERSION_CODES.O || notification.channelId == CHANNEL_ID
      val extras = notification.extras
      val pendingId = extras.getString(EXTRA_PENDING_ID)
      if (ownChannel && pendingId != null && queue.resolved.contains(pendingId)) {
        manager.cancel(active.tag, active.id)
      }
      if (ownChannel && pendingId == null) {
        val body = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()
        if (body != null && SmsFilter.looksLikeBankSms(body) && queue.entries.none { it.rawSms == body }) {
          val item = queue.add(body, active.postTime, legacy = true)
          if (item == null) manager.cancel(active.tag, active.id)
          imported = true
        }
      }
    }
    if (imported) save(context, queue)
    return encode(queue.entries).toString()
  }

  @Synchronized fun remove(context: Context, id: String) {
    removeMany(context, listOf(id))
  }

  @Synchronized fun removeMany(context: Context, ids: Collection<String>) {
    if (ids.isEmpty()) return
    val queue = read(context)
    val selected = ids.toSet()
    val entries = queue.entries.filter { it.id in selected }
    queue.removeMany(selected)
    // One durable commit before cancelling any notification: no partial deletion.
    save(context, queue)
    val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    selected.forEach { manager.cancel(it, NOTIFICATION_ID) }
    // Legacy notifications used the raw body hash as their integer identifier.
    entries.forEach { manager.cancel(it.rawSms.hashCode()) }
  }
}
