package com.polbin

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SmsFilterTest {

  // ---------- چیزهایی که باید رد شوند ----------

  @Test
  fun `پیامک تبلیغاتی اپراتور رد می‌شود`() {
    // این یکی واقعاً روی گوشی کاربر نوتیفیکیشن گرفت: «خريد» دارد، عدد هم دارد،
    // ولی هیچ نشانه‌ی حسابی ندارد.
    val sms =
        """
        شما در تاريخ 18/06/1405 13:24 تعداد 1 تماس از 09122176748 داشته ايد.

        با خريد هر شارژ 100,000 توماني يا افزايش اعتبار به همين ميزان، يک امتياز در قرعه
        کشي 10 جايزه 200 ميليوني دريافت کنيد.
        """
            .trimIndent()

    assertFalse(SmsFilter.looksLikeBankSms(sms))
  }

  @Test
  fun `رمز پویا رد می‌شود چون خودش تراکنش نیست`() {
    val sms = "رمز یکبار مصرف: 84213 مبلغ 1,500,000 ریال کارت ****3421"
    assertFalse(SmsFilter.looksLikeBankSms(sms))
  }

  @Test
  fun `پیامک تخفیف با مبلغ و کلمه‌ی حساب رد می‌شود`() {
    val sms = "با حساب کاربری خود 500,000 تومان تخفیف خرید بگیرید!"
    assertFalse(SmsFilter.looksLikeBankSms(sms))
  }

  @Test
  fun `پیامک بدون عدد رد می‌شود`() {
    assertFalse(SmsFilter.looksLikeBankSms("مانده حساب شما تغییر کرد."))
  }

  @Test
  fun `پیامک بدون نشانه‌ی حساب رد می‌شود`() {
    assertFalse(SmsFilter.looksLikeBankSms("خرید شما به مبلغ 250,000 ریال ثبت شد."))
  }

  // ---------- چیزهایی که باید بپذیرد ----------

  @Test
  fun `پیامک بانک رفاه پذیرفته می‌شود`() {
    val sms =
        """
        بانک رفاه
        حساب419675840
        خرید1,190,000-
        مانده4,621,300
        06/18-08:32
        """
            .trimIndent()

    assertTrue(SmsFilter.looksLikeBankSms(sms))
  }

  @Test
  fun `پیامک با ی و ک عربی پذیرفته می‌شود`() {
    val sms = "بانك ملت\nخريد\nمبلغ: 1,850,000ريال\nمانده: 42,310,000ريال"
    assertTrue(SmsFilter.looksLikeBankSms(sms))
  }

  @Test
  fun `واریز حقوق پذیرفته می‌شود`() {
    val sms = "بانک ملت\nواریز حقوق\nمبلغ: 320,000,000 ریال\nمانده: 350,000,000 ریال"
    assertTrue(SmsFilter.looksLikeBankSms(sms))
  }

  @Test
  fun `کارت به کارت بدون مانده پذیرفته می‌شود`() {
    val sms = "انتقال وجه کارت به کارت\nمبلغ: 5,000,000 ریال\nبه: ****9012"
    assertTrue(SmsFilter.looksLikeBankSms(sms))
  }

  @Test
  fun `خرید شارژ از حساب بانکی پذیرفته می‌شود`() {
    // «شارژ» عمداً در لیست تبلیغات نیست وگرنه این تراکنش واقعی رد می‌شد.
    val sms = "خرید شارژ ایرانسل\nمبلغ 200,000 ریال\nمانده: 8,300,000 ریال"
    assertTrue(SmsFilter.looksLikeBankSms(sms))
  }

  @Test
  fun `ارقام فارسی هم شناخته می‌شوند`() {
    val sms = "بانک سامان\nبرداشت\nمبلغ:۹۴۰,۰۰۰ ریال\nمانده:۱۲,۵۴۰,۰۰۰ ریال"
    assertTrue(SmsFilter.looksLikeBankSms(sms))
  }
}
