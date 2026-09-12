package com.polbin

import java.security.SecureRandom
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.PBEKeySpec

/**
 * هش رمز عبور اپ — بدون وابستگی به اندروید، تا در JVM تست شود.
 *
 * رمز چهاررقمی است و فضای حالتش فقط ده هزار تاست؛ هیچ هشی آن را در برابر
 * کسی که فایل MMKV را از گوشی روت‌شده برداشته «امن» نمی‌کند. کاری که هش
 * می‌کند این است که خودِ رمز هیچ‌جا نوشته نشود — همان چیزی که کاربر انتظار
 * دارد و اگر نباشد، یک نگاه به فایل کافی است. PBKDF2 با ده هزار دور روی
 * گوشی‌های ضعیف هم زیر صد میلی‌ثانیه است.
 */
object PinHasher {
  const val ITERATIONS = 10_000
  private const val KEY_BITS = 256
  private const val SALT_BYTES = 16

  fun randomSalt(): ByteArray = ByteArray(SALT_BYTES).also { SecureRandom().nextBytes(it) }

  fun hash(pin: String, salt: ByteArray, iterations: Int = ITERATIONS): ByteArray {
    val spec = PBEKeySpec(pin.toCharArray(), salt, iterations, KEY_BITS)
    return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).encoded
  }

  fun toHex(bytes: ByteArray): String = bytes.joinToString("") { "%02x".format(it) }

  fun fromHex(hex: String): ByteArray =
      ByteArray(hex.length / 2) { i -> hex.substring(i * 2, i * 2 + 2).toInt(16).toByte() }

  /** مقایسه‌ی زمان‌ثابت — طول متفاوت هم زودتر برنمی‌گردد. */
  fun constantTimeEquals(a: ByteArray, b: ByteArray): Boolean {
    var diff = a.size xor b.size
    for (i in 0 until minOf(a.size, b.size)) diff = diff or (a[i].toInt() xor b[i].toInt())
    return diff == 0
  }
}
