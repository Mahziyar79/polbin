package com.polbin

import java.security.MessageDigest

data class PendingSmsEntry(val id: String, val rawSms: String, val receivedAt: Long)

/** Pure queue policy; persistence and Android notifications live in the store. */
class PendingSmsQueue(
    entries: List<PendingSmsEntry> = emptyList(),
    resolved: List<String> = emptyList(),
) {
  val entries = entries.toMutableList()
  val resolved = resolved.toMutableList()

  fun add(rawSms: String, receivedAt: Long, legacy: Boolean = false): PendingSmsEntry? {
    val key = rawSms.trim().replace(Regex("\\s+"), " ")
    val input = if (legacy) "legacy|$key" else "$receivedAt|$key"
    val id = MessageDigest.getInstance("SHA-256").digest(input.toByteArray(Charsets.UTF_8))
        .joinToString("") { "%02x".format(it.toInt() and 0xff) }
    if (resolved.contains(id)) return null
    entries.firstOrNull { it.id == id }?.let { return it }
    return PendingSmsEntry(id, rawSms, receivedAt).also { entries.add(0, it) }
  }

  fun remove(id: String) {
    entries.removeAll { it.id == id }
    resolved.remove(id)
    resolved.add(id)
    // Only hashes are kept to prevent delayed/redelivered SMS from reappearing.
    while (resolved.size > 1000) resolved.removeAt(0)
  }
}
