# پول‌بین — چکاپ مالی شخصی (MVP)

اپ موبایلی که پیامک‌های تراکنش بانکی را می‌گیرد، مبلغ/فروشگاه/دسته را استخراج می‌کند،
با یک لمس تایید می‌شود و بلافاصله خلاصه‌ی بصری خرج + یک توصیه‌ی عملی کوتاه نشان می‌دهد.

- پلتفرم هدف: **اندروید** (توزیع از کافه‌بازار/مایکت)، iOS در فاز بعد
- بک‌اند (فاز بعد): Node.js/Express + PostgreSQL، استخراج با **regex** و بدون هیچ API خارجی
- React Native `0.87.1` · React `19.2.3` · TypeScript · MMKV برای ذخیره‌سازی محلی

📄 [RUN.md](RUN.md) — اجرا روی شبیه‌ساز و گوشی · [TODO.md](TODO.md) — کارهای باقی‌مانده

---

## وضعیت فعلی

اپ **بدون سرور** کار می‌کند و همه‌ی داده روی خود گوشی می‌ماند (MMKV). حساب کاربری
و ورود در کار نیست — با باز کردن اپ مستقیم وارد داشبورد می‌شوی.

| صفحه | فایل | کار |
|---|---|---|
| معرفی اولیه | `src/screens/OnboardingScreen.tsx` | سه قدم کار با اپ + پرسیدن نام (اختیاری) |
| داشبورد | `src/screens/DashboardScreen.tsx` | تب هزینه/درآمد، مجموع بازه، نمودار دسته‌ها، تراکنش‌های اخیر، کارت بودجه و قسط |
| تایید تراکنش | `src/screens/ConfirmTransactionScreen.tsx` | نمایش نتیجه‌ی پارس پیامک، اصلاح مبلغ/فروشگاه/دسته، تایید |
| افزودن دستی | `src/screens/AddTransactionScreen.tsx` | ثبت خرج یا درآمدی که پیامکش نیامده |
| ویرایش تراکنش | `src/screens/EditTransactionScreen.tsx` | لمس هر ردیف — اصلاح یا حذف |
| دسته‌بندی‌ها | `src/screens/CategoriesScreen.tsx` | ساخت و حذف دسته‌ی دلخواه |
| بودجه | `src/screens/BudgetScreen.tsx` | سقف خرج ماهانه با پیشنهاد بر اساس ماه‌های قبل |
| تقویم | `src/screens/CalendarScreen.tsx` | تقویم شمسی با تراکنش‌های هر روز |
| تراکنش‌ها | `src/screens/TransactionsScreen.tsx` | فهرست کامل با فیلتر خرج/درآمد، دسته و بانک + صفحه‌بندی |
| قسط‌ها | `src/screens/InstallmentsScreen.tsx` | وام‌ها و خریدهای قسطی، جدول سررسیدها، علامت زدن پرداخت |
| افزودن قسط | `src/screens/AddInstallmentScreen.tsx` | عنوان، مبلغ هر قسط، تعداد، اولین سررسید، بانک |
| درباره‌ی برنامه | `src/screens/AboutScreen.tsx` | قابلیت‌ها و حریم خصوصی |
| پشتیبان و خروجی | `src/screens/BackupScreen.tsx` | خروجی JSON، بازگردانی از فایل، خروجی اکسل، گزارش PDF |
| قفل اپ | `src/screens/LockSettingsScreen.tsx` | رمز چهاررقمی و اثر انگشت؛ خودِ قفل یک لایه روی ناوبری است (`LockScreen`) |

ناوبری در `src/navigation/RootNavigator.tsx` است: داشبورد در پایه‌ی استک و بقیه با
`slide_from_bottom` رویش. `presentation: 'modal'` عمداً هیچ‌جا نیست — در بیلد release
با Fabric کرش می‌کرد؛ شرحش در [TODO.md](TODO.md).
صفحه‌های فرعی از منوی کشویی بالا سمت چپ باز می‌شوند
([AppMenu.tsx](src/components/AppMenu.tsx)) که عمداً با `Modal` خود ریاکت‌نیتیو ساخته
شده نه `@react-navigation/drawer` — آن یکی دو وابستگی نیتیو سنگین می‌آورد.

تراکنش از دو راه وارد می‌شود:

- **خودکار** — [SmsReceiver.kt](android/app/src/main/java/com/polbin/SmsReceiver.kt)
  پیامک تازه را می‌گیرد. اپ باز باشد → صفحه‌ی تایید؛ بسته باشد → نوتیفیکیشن.
  مجوزش اختیاری است و از کارت داشبورد گرفته می‌شود.
- **دستی** — منوی «هم‌رسانی» اندروید؛ بدون مجوز پیامک هم کار می‌کند.

## اجرا

راهنمای کامل بالا آوردن شبیه‌ساز، بیلد، اجرا روی گوشی واقعی و عیب‌یابی در
**[RUN.md](RUN.md)** است. خلاصه‌اش:

```bash
npm install
npm start
```

و در ترمینال دوم بیلد نیتیو (روی این سیستم `npm run android` کار نمی‌کند، دلیلش در RUN.md):

```bash
cd android && ./gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
```

نیاز: Android SDK، JDK 21، و یک شبیه‌ساز یا گوشی متصل.

> **RTL:** در `index.js` با `I18nManager.forceRTL(true)` روشن شده. بعد از **اولین** نصب،
> اپ را یک‌بار کامل ببند و باز کن تا چیدمان راست‌به‌چپ اعمال شود.

## معماری پوشه‌ها

```
src/
  components/   قطعات مشترک UI — فرم تراکنش، نوار پایینی فرم، FAB، نمودارها، ردیف تراکنش
  data/         دسته‌های پیش‌فرض خرج و درآمد + پیامک‌های خام نمونه (فقط برای تست پارسر)
  hooks/        useTransactionForm — حالت مشترک فرم بین دو صفحه
  navigation/   استک اصلی و تایپ پارامترها
  screens/      دوازده صفحه
  services/     smsParser (regex) · analytics (مجموع و تفکیک) · installments (سررسید اقساط)
                duplicates (تشخیص تراکنش تکراری) · balances (موجودی هر کارت از پیامک)
                lock + lockPolicy (رمز و اثر انگشت؛ هش در ماژول نیتیو PolbinLock)
                fakeApi (لایه‌ی جعلی شبکه) · storage (MMKV)
                backup (JSON) · xlsx (اکسل، بدون کتابخانه) · reportHtml (PDF) · deviceFiles (ماژول نیتیو) · shareIntent
  state/        ProfileContext · CategoriesContext · TransactionsContext · BudgetContext
                InstallmentsContext · LockContext
  theme/        رنگ، فاصله، شعاع
  utils/        تبدیل تاریخ شمسی و قالب‌بندی اعداد/مبالغ فارسی
```

**دو قاعده‌ای که رعایت شده‌اند:**

- فرم تراکنش یک جا تعریف شده (`TransactionFormFields` + `useTransactionForm`) و هر دو
  صفحه‌ی تایید پیامک و افزودن دستی از همان استفاده می‌کنند. تفاوت‌هایشان با اسلات
  تزریق می‌شود نه با کد تکراری.
- `smsParser`، `analytics` و `installments` توابع خالص‌اند و به ری‌اکت وابسته نیستند،
  پس هم تست‌پذیرند و هم قابل انتقال به بک‌اند.

### نقطه‌ی اتصال به بک‌اند

همه‌ی صداهای شبکه از `src/services/fakeApi.ts` رد می‌شوند و امضاها عمداً `async` هستند.
برای اتصال به سرور واقعی فقط بدنه‌ی همین توابع عوض می‌شود:

| تابع | endpoint آینده |
|---|---|
| `parseSmsRemote` | `POST /sms/parse` |
| `fetchTransactions` | `GET /transactions` |
| `createTransaction` | `POST /transactions` |

`src/services/smsParser.ts` نسخه‌ی محلیِ همان regexهای بک‌اند است؛ الگوها و دیکشنری
فروشگاه→دسته را می‌شود مستقیم به Node منتقل کرد. (Hermes از lookbehind پشتیبانی
نمی‌کند، برای همین هیچ‌جا `(?<=...)` استفاده نشده.)

## قدم‌های بعدی

فهرست کامل کارهای باقی‌مانده، باگ‌های شناخته‌شده و بدهی فنی در [TODO.md](TODO.md) است.
سه مورد مهم‌تر از بقیه:

1. **کلید امضای release** — نسخه‌ی فعلی با کلید debug امضا می‌شود؛ کافه‌بازار قبولش نمی‌کند.
2. **تست روی گوشی ARM واقعی** — تمام تست‌ها تا امروز روی شبیه‌ساز `x86_64` بوده.
3. **بک‌اند** — Express + PostgreSQL در `polbin_server` نوشته و تست شده ولی عمداً وصل نشده؛
   با آمدنش احراز هویت واقعی (OTP + توکن) هم برمی‌گردد.

## آنچه هنوز جعلی است

- هیچ احراز هویتی وجود ندارد. پروفایل فقط یک نام محلی است، نه حساب کاربری.
- `fakeApi` هنوز واسطه‌ی «شبکه» است ولی چیزی جز حافظه‌ی گوشی پشتش نیست.
- تاریخ تراکنش از متن پیامک استخراج نمی‌شود و «الان» در نظر گرفته می‌شود.
- `src/data/fakeSmsInbox.ts` فقط نمونه‌ی پیامک برای تست پارسر است و هیچ صفحه‌ای آن را نمی‌خواند.
