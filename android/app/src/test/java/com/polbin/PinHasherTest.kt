package com.polbin

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class PinHasherTest {
  private val salt = PinHasher.fromHex("000102030405060708090a0b0c0d0e0f")

  @Test
  fun `same pin and salt give the same hash`() {
    assertEquals(PinHasher.toHex(PinHasher.hash("1234", salt)), PinHasher.toHex(PinHasher.hash("1234", salt)))
  }

  @Test
  fun `different pin gives a different hash`() {
    assertNotEquals(PinHasher.toHex(PinHasher.hash("1234", salt)), PinHasher.toHex(PinHasher.hash("1235", salt)))
  }

  @Test
  fun `different salt gives a different hash`() {
    val other = PinHasher.fromHex("0f0e0d0c0b0a09080706050403020100")
    assertNotEquals(PinHasher.toHex(PinHasher.hash("1234", salt)), PinHasher.toHex(PinHasher.hash("1234", other)))
  }

  @Test
  fun `hash never contains the pin`() {
    assertFalse(PinHasher.toHex(PinHasher.hash("1234", salt)).contains("1234"))
  }

  @Test
  fun `hex round trip`() {
    val bytes = PinHasher.randomSalt()
    assertTrue(PinHasher.constantTimeEquals(bytes, PinHasher.fromHex(PinHasher.toHex(bytes))))
  }

  @Test
  fun `random salts differ`() {
    assertNotEquals(PinHasher.toHex(PinHasher.randomSalt()), PinHasher.toHex(PinHasher.randomSalt()))
  }

  @Test
  fun `constant time equals handles length mismatch`() {
    assertFalse(PinHasher.constantTimeEquals(byteArrayOf(1, 2, 3), byteArrayOf(1, 2)))
    assertTrue(PinHasher.constantTimeEquals(byteArrayOf(1, 2, 3), byteArrayOf(1, 2, 3)))
  }
}
