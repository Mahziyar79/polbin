package com.polbin

/**
 * تشخیص اینکه یک پیامک، پیامکِ تراکنش بانکی است یا نه.
 *
 * از `TransactionSmsReceiver` جدا شده چون هیچ وابستگی به اندروید ندارد و همین باعث می‌شود
 * بشود روی JVM تستش کرد — کاری که برای خود Receiver نمی‌شد کرد و نتیجه‌اش این
 * بود که یک مثبت کاذب تا روی گوشی کاربر رفت.
 *
 * قاعده: عدد + کلیدواژه‌ی تراکنش + **نشانه‌ی حساب**، و هیچ نشانه‌ی تبلیغ.
 *
 * شرط سوم مهم‌ترین است. بدون آن، این پیامک اپراتور رد نمی‌شد:
 *
 *     با خريد هر شارژ 100,000 توماني ... يک امتياز در قرعه کشي
 *
 * «خرید» دارد، عدد هم دارد، ولی نه مانده‌ای، نه حسابی، نه کارتی. تقریباً هر
 * پیامک تراکنش بانکی ایرانی دست‌کم یکی از این‌ها را دارد.
 *
 * این فقط یک صافیِ ارزان است تا برای هر پیامکی نوتیفیکیشن نگذاریم؛ تصمیم نهایی
 * با `parseSms` در سمت جاوااسکریپت است.
 */
object SmsFilter {

  fun looksLikeBankSms(raw: String): Boolean {
    val text = normalize(raw)

    val settled = SETTLED_BLOCK_RE.containsMatchIn(text)
    val structured = text.contains("بانک") && DIRECT_AMOUNT_RE.containsMatchIn(text) && BALANCE_AMOUNT_RE.containsMatchIn(text) && ACCOUNT_NUMBER_RE.containsMatchIn(text)
    if (PROMO_WORDS.any { it !in AUTH_WORDS && text.contains(it) && !(it in REWARD_WORDS && structured) }) return false
    if (LINK_RE.containsMatchIn(text)) return false
    if ((AUTH_WORD_RE.containsMatchIn(text) || AUTH_CODE_RE.containsMatchIn(text)) && !settled) return false
    if (FAILED_TRANSACTION_RE.containsMatchIn(text) && !settled) return false
    if (settled) return true
    val monetary = text.replace(BALANCE_AMOUNT_RE, " ").replace(IDENTIFIER_LINE_RE, " ").replace(DATE_LINE_RE, " ")
    if (!AMOUNT_RE.containsMatchIn(monetary) && !SMALL_AMOUNT_RE.containsMatchIn(monetary)) return false
    if (TRANSACTION_WORDS.none { text.contains(it) }) return false

    return ACCOUNT_WORDS.any { text.contains(it) }
  }

  /** ی/ک عربی و نیم‌فاصله را یکدست می‌کند تا لیست‌ها یک شکل بیشتر نداشته باشند. */
  private fun normalize(raw: String): String =
      raw.replace('ي', 'ی') // ي عربی
          .replace('ى', 'ی') // ى
          .replace('ك', 'ک') // ك عربی
          .replace('‌', ' ') // نیم‌فاصله
          .replace(Regex("[\u200e\u200f\u202a-\u202e\u2066-\u2069\ufeff]"), "")
          .replace("\r\n", "\n").replace('\r', '\n').replace('\u00a0', ' ')
          .map { when (it) {
            in '۰'..'۹' -> '0' + (it - '۰')
            in '٠'..'٩' -> '0' + (it - '٠')
            else -> it
          } }.joinToString("")
          .replace('٬', ',').replace('،', ',')
          .replace(Regex("""(\d{1,2})[ \t]*:[ \t]*(\d{2})""")) { "${it.groupValues[1]}:${it.groupValues[2]}" }

  /** کاری که با پول انجام شده. */
  /**
   * «نشست» و «پرید» فعل‌های بلوبانک‌اند («۷۸,۰۰۰,۰۰۰ ریال به حساب شما نشست»)؛
   * بدون آن‌ها پیامک واریز بلو اصلاً به اپ نمی‌رسید و کاربر فکر می‌کرد اپ خراب است.
   */
  private val TRANSACTION_WORDS =
      listOf(
          "خرید",
          "برداشت",
          "واریز",
          "انتقال",
          "پرداخت",
          "بدهکار",
          "بستانکار",
          "مبلغ",
          "نشست",
          "پرید",
          "دریافت",
          "کسر",
          "افزایش",
          "کاهش",
      )

  /**
   * نشانه‌ی اینکه پای یک حساب واقعی در میان است.
   *
   * پیامک تبلیغاتی از مبلغ حرف می‌زند ولی هیچ‌وقت مانده یا شماره‌ی حساب نمی‌دهد.
   */
  private val ACCOUNT_WORDS = listOf("مانده", "موجودی", "حساب", "سپرده", "کارت", "شبا")
  private val AUTH_WORDS = setOf("رمز یکبار", "رمز پویا", "کد تایید", "کد فعالسازی")
  private val REWARD_WORDS = setOf("هدیه", "جایزه", "امتیاز")
  private val AUTH_CODE_RE = Regex("""(?:^|\s)رمز(?:\s*(?:پویا|یک\s*بار(?:\s*مصرف)?|دوم))?\s*:\s*\d{4,8}(?=\s|$)""")
  private val AUTH_WORD_RE = Regex("""رمز\s*(?:پویا|یک\s*بار(?:\s*مصرف)?)|کد\s*(?:تایید|فعالسازی)""")
  private val FAILED_TRANSACTION_RE = Regex("""(?:^|\n)\s*(?:(?:خرید|تراکنش|پرداخت|برداشت|واریز)\s*(?:ناموفق|انجام\s*نشد)|موجودی\s*کافی\s*نیست|عدم\s*موجودی)""")
  private val DIRECT_AMOUNT_RE = Regex("""(?:برداشت|واریز|خرید|بدهکار|بستانکار)\s*:?\s*\d[\d,]*""")
  private val BALANCE_AMOUNT_RE = Regex("""(?:مانده|موجودی)(?:\s*حساب)?\s*:?\s*\d[\d,]*(?:[ \t]*(?:ریال|تومان))?""")
  private val ACCOUNT_NUMBER_RE = Regex("""(?:حساب|سپرده)\s*:?\s*\d{6,}""")
  private val IDENTIFIER_LINE_RE = Regex("""(?m)^\s*(?:حساب|سپرده|شبا|کارت|پیگیری|مرجع|سریال|مشتری|شماره|واریز\s*به|برداشت\s*از)\s*:?\s*(?:\*+\s*)?(?:\d+(?:\.\d+){2,}|\d{4,})""")
  private val DATE_LINE_RE = Regex("""(?m)^\s*(?:1[34]\d{2}|\d{1,2})[/.-]\d{1,2}(?:[/.-]\d{1,2})?(?:[_ -]\d{1,2}:\d{2}(?::\d{2})?)?""")
  private val SMALL_AMOUNT_RE = Regex("""\d[\d,]*\s*(?:ریال|تومان)|(?:مبلغ|برداشت|واریز|خرید|پرداخت)\s*:?\s*\d[\d,]*""")
  // Same structural evidence as the JS parser: signed amount, timestamp, balance.
  private val SETTLED_BLOCK_RE = Regex("""(?:^|\n)\s*[+\-−]\s*[\d۰-۹٠-٩][\d۰-۹٠-٩,،٬]{3,}[ \t]*(?:ریال|تومان)?[ \t]*\r?\n\s*(?:[1۱١][3-4۳-۴٣-٤][\d۰-۹٠-٩]{2}[/.-])?[\d۰-۹٠-٩]{1,2}[/.-][\d۰-۹٠-٩]{1,2}[_ -][\d۰-۹٠-٩]{1,2}:[\d۰-۹٠-٩]{2}(?::[\d۰-۹٠-٩]{2})?[ \t]*\r?\n\s*(?:مانده|موجودی)(?:[ \t]*حساب)?\s*:\s*[\d۰-۹٠-٩][\d۰-۹٠-٩,،٬]{3,}""")

  /**
   * چیزهایی که در پیامک تراکنش هرگز نمی‌آیند.
   *
   * «رمز یکبار مصرف» عمداً اینجاست: پیامک رمز پویا هم مبلغ دارد و هم شماره‌ی
   * کارت، پس از دو شرط بالا رد می‌شود — ولی خودش تراکنش نیست و اگر نگهش داریم
   * کاربر برای یک خرید دو بار خبر می‌گیرد.
   *
   * «تماس» و «شارژ» عمداً اینجا **نیستند**: پیامک واقعی بانک ممکن است بگوید
   * «در صورت مغایرت تماس بگیرید» یا «خرید شارژ» را ثبت کند.
   */
  private val PROMO_WORDS =
      listOf(
          "قرعه",
          "جایزه",
          "برنده",
          "تخفیف",
          "تبلیغ",
          "امتیاز",
          "هدیه",
          "رمز یکبار",
          "رمز پویا",
          "کد تایید",
          "کد فعالسازی",
          // پیامک اپراتور: «مشترک گرامی، موجودی حساب اصلی شما به کمتر از 100,000 ریال
          // رسیده… خرید بسته اینترنتی». عدد، «خرید»، «موجودی حساب» — هر سه شرط را داشت.
          "مشترک گرامی",
          "بسته اینترنتی",
          "بسته‌ی اینترنتی",
      )

  /**
   * لینک، نشانه‌ی قطعی پیامک غیرتراکنشی است.
   *
   * پیامک تراکنش بانک هیچ‌وقت لینک ندارد؛ پیامک اپراتور، فروشگاه و فیشینگ تقریباً
   * همیشه دارد. ارزان‌ترین و مطمئن‌ترین قاعده‌ی این فهرست.
   */
  private val LINK_RE = Regex("""https?://|www\.|\.ir/|\.com/""")

  /** حداقل چهار رقم، با یا بدون جداکننده‌ی هزارگان. */
  private val AMOUNT_RE = Regex("""[\d۰-۹][\d۰-۹,،٬]{3,}""")
}
