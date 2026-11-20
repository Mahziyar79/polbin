package com.polbin

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SmsFilterTest {
  @Test
  fun `ماتریس ارقام فاصله و پیامک‌های غیرتراکنشی`() {
    val cases = listOf(
      "بانک ملت\nبرداشت:99 تومان\nکارت:****1234\nمانده:1000 تومان" to true,
      "بانک ملت\nخرید:250,000 ریال\nمانده:4,000,000 ریال" to true,
      "بانک ملت\nبرداشت:1,000,000 ریال\nمانده:4,000,000 ریال\nرمز دوم خود را در اختیار دیگران نگذارید." to true,
      "بانک ملت\nاسترداد وجه خرید\nمبلغ:250,000 ریال\nمانده:4,000,000 ریال" to true,
      "بانک ملت\nواریز:1,000,000 ریال\nحساب:3000000009012\nمانده:4,000,000 ریال\nبابت هدیه" to true,
      "بانک ملت\nخرید ناموفق\nمبلغ:1,750,000 ریال\nکارت:****1234\nموجودی:4,000,000" to false,
      "بانک ملت خرید مبلغ 1,750,000 ریال کارت ****1234 رمز پویا:12345" to false,
      "بانک پاسارگاد\nواریز به:356.0000.12345678.1\nموجودی:4,000,000" to false,
      "بانک ملت\nموجودی:4,000,000 ریال" to false,
      "خرید 500,000 تومان با حساب کاربری و تخفیف ویژه" to false,
      "برای دریافت 500,000 ریال به حساب شما به https://example.com مراجعه کنید" to false,
    )
    for ((raw, expected) in cases) {
      val variants = listOf(raw,
          raw.map { if (it in '0'..'9') "۰۱۲۳۴۵۶۷۸۹"[it - '0'] else it }.joinToString(""),
          raw.map { if (it in '0'..'9') "٠١٢٣٤٥٦٧٨٩"[it - '0'] else it }.joinToString(""),
          raw.replace(",", "٬").replace("\n", "\r\n\r\n"),
          raw.replace(Regex("[0-9][0-9,]*")) { "\u200f${it.value}\u200e" })
      variants.forEachIndexed { index, text ->
        org.junit.Assert.assertEquals("variant $index: $raw", expected, SmsFilter.looksLikeBankSms(text))
      }
    }
  }
  @Test
  fun `یارانه پاسارگاد با حساب نقطه‌دار و سال کوتاه می‌گذرد`() {
    assertTrue(SmsFilter.looksLikeBankSms("*بانک پاسارگاد*\nیارانه نقدی مرحله 188\nواریز به: 356.0000.12345678.1\nمبلغ: 3,000,000 ریال\n05/07/30_11:02\nموجودی: 46,583,119 ریال"))
  }
  @Test
  fun `رمز خرید همراه برداشت نهایی می‌گذرد ولی رمز تنها تراکنش نیست`() {
    val auth = "محرمانه\nخرید\nاسنپ\n1,750,000\nرمز:12345\n1405/07/07-15:31:47\n10.10000000.1"
    val settlement = "-1,750,000\n07/07_15:32\nمانده: 16,639,664"
    assertTrue(SmsFilter.looksLikeBankSms("$auth\n$settlement"))
    assertTrue(SmsFilter.looksLikeBankSms(settlement))
    assertFalse(SmsFilter.looksLikeBankSms(auth))
    assertFalse(SmsFilter.looksLikeBankSms("$auth\nحساب:3000000009012\nمانده:16,639,664"))
  }
  @Test
  fun `برداشت خودکار قسط سپه با تاریخ کوتاه می‌گذرد`() {
    val sms = """
      بانک سپه

      برداشت:77,419,000

      حساب : 3000000009012

      مانده:17,602,250

      8/29-7:01

      دريافت اتوماتيک  قسط مورخ
    """.trimIndent()
    assertTrue(SmsFilter.looksLikeBankSms(sms))
  }

  // ---------- پیامک‌های واقعی که باید بگذرند ----------

  @Test
  fun `واریز بلوبانک با فعل «نشست» می‌گذرد`() {
    // این یکی روی گوشی کاربر بی‌صدا رد شد چون هیچ‌کدام از واژه‌های تراکنش را نداشت.
    val sms =
        """
        بلو
        پوزش بابت اختلال
        مهزیار عزیز، 78,000,000 ریال به حساب شما نشست.
        موجودی: 464,878,612 ریال
        ۹:۱۰
        ۱۴۰۵.۰۶.۲۲
        """
            .trimIndent()

    assertTrue(SmsFilter.looksLikeBankSms(sms))
  }

  @Test
  fun `واریز بلوبانک با «دریافت پل» می‌گذرد`() {
    val sms =
        """
        بلو
        دریافت پل
         مهزیار عزیز، 3,000,000 ریال به حساب شما نشست.
         موجودی: 372,543,812 ریال
        ۱۸:۲۲
        ۱۴۰۵.۰۶.۲۲
        """
            .trimIndent()

    assertTrue(SmsFilter.looksLikeBankSms(sms))
  }

  @Test
  fun `برداشت بلوبانک با فعل «پرید» می‌گذرد`() {
    val sms =
        """
        بلو
        مهزیار عزیز، 20,000,000 ریال از حساب شما پرید.
        موجودی: 528,926,412 ریال
        """
            .trimIndent()

    assertTrue(SmsFilter.looksLikeBankSms(sms))
  }

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
  fun `هشدار موجودی اپراتور رد می‌شود`() {
    val sms =
        """مشترک گرامی 989385818976،
موجودی حساب اصلی شما به کمتر از 100,000 ریال رسیده است. لطفا جهت مدیریت مصرف وافزایش حساب یا خرید بسته اینترنتی به اپلیکیشن ایرانسل من مراجعه کنید:
https://my.irancell.ir/dlp?id=main&ph=989385818976"""
    assertFalse(SmsFilter.looksLikeBankSms(sms))
  }

  @Test
  fun `هر پیامکی که لینک دارد رد می‌شود`() {
    assertFalse(SmsFilter.looksLikeBankSms("برداشت 250,000 ریال از حساب شما. جزئیات: www.bank.ir/x"))
    assertFalse(SmsFilter.looksLikeBankSms("خرید 250,000 ریال کارت 1234 مانده 5,000,000 https://t.co/a"))
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
