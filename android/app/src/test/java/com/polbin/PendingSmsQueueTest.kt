package com.polbin

import org.junit.Assert.*
import org.junit.Test

class PendingSmsQueueTest {
  private val body = "بانک ملت برداشت 250000 ریال حساب 1234"

  @Test fun `redelivery of the same SMS does not add another item`() {
    val queue = PendingSmsQueue()
    val first = queue.add(body, 1000)!!
    assertEquals(first.id, queue.add("  $body  ", 1000)!!.id)
    assertEquals(1, queue.entries.size)
  }

  @Test fun `equal bodies received at different times remain distinct`() {
    val queue = PendingSmsQueue()
    assertNotEquals(queue.add(body, 1000)!!.id, queue.add(body, 2000)!!.id)
    assertEquals(2, queue.entries.size)
  }

  @Test fun `resolved SMS stays resolved when state is restored`() {
    val queue = PendingSmsQueue()
    val id = queue.add(body, 1000)!!.id
    queue.remove(id)
    val restored = PendingSmsQueue(queue.entries, queue.resolved)
    assertNull(restored.add(body, 1000))
    assertEquals(0, restored.entries.size)
    assertNotNull(restored.add(body, 2000))
  }

  @Test fun `dismissing one SMS preserves other pending records and original time`() {
    val queue = PendingSmsQueue()
    val first = queue.add(body, 1000)!!
    val second = queue.add("$body خرید", 2000)!!
    queue.remove(first.id)
    val restored = PendingSmsQueue(queue.entries, queue.resolved)
    assertEquals(listOf(second), restored.entries)
    assertEquals(2000L, restored.entries[0].receivedAt)
  }

  @Test fun `a legacy notification cannot reopen a dismissed SMS`() {
    val queue = PendingSmsQueue()
    val id = queue.add(body, 1000, legacy = true)!!.id
    queue.remove(id)
    assertNull(PendingSmsQueue(queue.entries, queue.resolved).add(body, 9999, legacy = true))
  }

  @Test fun `pending contents do not depend on constructor list mutations`() {
    val entries = mutableListOf<PendingSmsEntry>()
    val queue = PendingSmsQueue(entries)
    queue.add(body, 1000)
    assertTrue(entries.isEmpty())
    assertFalse(queue.entries[0].id.contains("1234"))
  }
}
