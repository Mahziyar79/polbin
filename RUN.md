# اجرای پول‌بین

راهنمای بالا آوردن اپ روی شبیه‌ساز و گوشی واقعی. همه‌ی دستورها برای **PowerShell** نوشته شده‌اند.

---

## سه نکته‌ی این سیستم

بدون این سه تا هیچ بیلدی جلو نمی‌رود. اولین بار که راه‌اندازی می‌کنی حتماً بخوانشان:

**۱. `JAVA_TOOL_OPTIONS` الزامی است.** روی این ویندوز، AF_UNIX داخل پوشه‌ی `Temp` خراب است و
`Selector.open()` جاوا شکست می‌خورد؛ نتیجه‌اش خطای `Unable to establish loopback connection`
و بالا نیامدن دیمن Gradle است. یک‌بار برای همیشه دائمی‌اش کن:

```powershell
setx JAVA_TOOL_OPTIONS "-Djdk.net.unixdomain.tmpdir=C:\Users\Mahziyar79\.gradle\javatmp"
```

بعد از این دستور، ترمینال را ببند و دوباره باز کن. مطمئن شو پوشه وجود دارد:

```powershell
New-Item -ItemType Directory -Force "C:\Users\Mahziyar79\.gradle\javatmp"
```

**۲. VPN باید موقع بیلد روشن باشد.** `dl.google.com` از ایران بلاک است و AGP و اجزای SDK
فقط روی مخزن گوگل هستند. Maven Central باز است ولی AGP آنجا نیست.

**۳. `npm run android` روی این سیستم کار نمی‌کند.** CLI ری‌اکت‌نیتیو نمی‌تواند `gradlew.bat`
را spawn کند و با `'gradlew.bat' is not recognized` می‌افتد. مستقیم `gradlew.bat` را صدا بزن.

---

## بخش ۱ — اجرا روی شبیه‌ساز

### قدم ۱: شبیه‌ساز را بالا بیاور

**از اندروید استودیو:** آیکون **Device Manager** در نوار کناری → دکمه‌ی ▶ کنار `Small_Phone`.

**یا با دستور** (این ترمینال تا وقتی شبیه‌ساز باز است بلاک می‌شود، پس ترمینال جدا باز کن):

```powershell
& "E:\android_studio\Android\Sdk\emulator\emulator.exe" -avd Small_Phone
```

& "E:\android_studio\Android\Sdk\emulator\emulator.exe" -avd Small_Phone -no-snapshot-load

برای دیدن لیست شبیه‌سازهای موجود:

```powershell
& "E:\android_studio\Android\Sdk\emulator\emulator.exe" -list-avds
```

### قدم ۲: مطمئن شو adb می‌بیندش

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" devices
```

باید چیزی شبیه این ببینی:

```
List of devices attached
emulator-5554   device
```

اگر خالی بود، شبیه‌ساز هنوز بالا نیامده — چند ثانیه صبر کن و دوباره بزن.

### قدم ۳: Metro را روشن کن

**ترمینال جدا، باید تا آخر کار باز بماند:**

```powershell
Set-Location "D:\personal projects\polbin"
npm start
```

### قدم ۴: بیلد و نصب

**ترمینال دوم:**

```powershell
Set-Location "D:\personal projects\polbin\android"; $env:ANDROID_HOME = "E:\android_studio\Android\Sdk"; & .\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
```

بار اول ۱۰ تا ۲۰ دقیقه طول می‌کشد (دانلود AGP، SDK 37، build-tools، NDK و کامپایل C++).
دفعات بعد حدود ۲۰ ثانیه.

### قدم ۵: اپ را باز کن

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" shell am start -n com.polbin/.MainActivity
```

یا در خود شبیه‌ساز آیکون **پول‌بین** را بزن.

### قدم ۶: بار اول، اپ را یک‌بار ببند و باز کن

RTL با `I18nManager.forceRTL(true)` در [index.js](index.js) روشن است و اندروید فقط بعد از یک
راه‌اندازی کامل اعمالش می‌کند.

### دفعات بعد

وقتی همه چیز نصب است، فقط این دو تا لازم است:

```powershell
# ترمینال ۱
Set-Location "D:\personal projects\polbin"; npm start
```

```powershell
# ترمینال ۲ — شبیه‌ساز را باز کن، بعد
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" shell am start -n com.polbin/.MainActivity
```

**تغییر کد نیاز به بیلد دوباره ندارد.** Metro با Fast Refresh لحظه‌ای اعمالش می‌کند.
بیلد دوباره فقط وقتی لازم است که وابستگی نیتیو جدید نصب کنی یا فایل‌های `android/` را دست بزنی.

---

## بخش ۲ — نصب روی گوشی واقعی

دو راه هست و برای استفاده‌ی روزمره **راه اول** درست است.

### راه اول: APK نسخه‌ی release (بدون کابل، بدون Metro)

در این نسخه کد جاوااسکریپت داخل خود APK بسته‌بندی می‌شود، پس اپ روی گوشی
مستقل کار می‌کند — لازم نیست کامپیوتر روشن باشد یا Metro اجرا شود.

```powershell
$env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=C:\Users\Mahziyar79\.gradle\javatmp"; .\android\gradlew.bat -p android assembleRelease
```

خروجی **یک فایل نیست، چهار فایل است** — یکی برای هر معماری CPU:

```
android/app/build/outputs/apk/release/
  app-arm64-v8a-release.apk     ~22MB  ← گوشی‌های امروزی، همین را بردار
  app-armeabi-v7a-release.apk   ~17MB     گوشی‌های قدیمی ۳۲ بیتی
  app-x86-release.apk           ~23MB     شبیه‌ساز
  app-x86_64-release.apk        ~23MB     شبیه‌ساز
```

اگر مطمئن نیستی گوشی‌ات کدام است، این را بزن:

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" shell getprop ro.product.cpu.abi
```

فایل مربوطه را با کابل، بلوتوث یا هر روشی به گوشی منتقل کن و از فایل‌منیجر گوشی بازش کن.
اندروید می‌پرسد «نصب از منابع ناشناس» را اجازه می‌دهی؟ — اجازه بده.

یا اگر گوشی با کابل وصل است و `adb` می‌بیندش:

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" install -r "android\app\build\outputs\apk\release\app-arm64-v8a-release.apk"
```

> **APK فعلاً با کلید debug امضا می‌شود.** برای نصب روی گوشی خودت کاملاً کافی است،
> ولی کافه‌بازار قبولش نمی‌کند و دو APK با کلیدهای متفاوت روی هم آپدیت نمی‌شوند —
> برای آپدیت باید نسخه‌ی قبلی را حذف کنی. ساختن کلید release در [TODO.md](TODO.md) لیست شده است.

> **قبل از هر انتشار، APK release را دستی تست کن.** بیلد debug و release در معماری
> جدید یکسان رفتار نمی‌کنند؛ یک‌بار کرشی داشتیم که فقط در release ظاهر می‌شد.
> دلیلش در [TODO.md](TODO.md) نوشته شده.

### راه دوم: نسخه‌ی debug (فقط وقتی می‌خواهی کد را زنده تغییر بدهی)

این نسخه به Metro روی کامپیوتر وصل می‌شود، پس کابل و کامپیوتر باید وصل بمانند.

**۱ — روی گوشی، Developer Options را باز کن**

۱. **تنظیمات ← درباره‌ی گوشی**
۲. روی **شماره‌ی ساخت** (Build number) هفت بار پشت سر هم بزن
۳. برگرد به تنظیمات ← **گزینه‌های توسعه‌دهنده** (Developer options) ظاهر شده
۴. **اشکال‌زدایی USB** (USB debugging) را روشن کن

**۲ — با کابل وصل کن**

گوشی را با کابل به کامپیوتر بزن. روی گوشی یک دیالوگ می‌آید که اثر انگشت کامپیوتر را نشان
می‌دهد — **Allow** را بزن و تیک «همیشه» را بگذار.

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" devices
```

باید سریال گوشی را با وضعیت `device` ببینی. اگر `unauthorized` بود، دیالوگ روی گوشی را تایید نکرده‌ای.
اگر اصلاً چیزی نبود، کابل را عوض کن — خیلی از کابل‌ها فقط شارژ هستند و دیتا رد نمی‌کنند.

**۳ — Metro و پل پورت**

Metro را روشن کن (مثل قدم ۳ بخش شبیه‌ساز)، بعد پورت ۸۰۸۱ را به گوشی پل بزن:

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081
```

این دستور را **بعد از هر بار وصل کردن مجدد کابل** باید تکرار کنی.

**۴ — بیلد و نصب**

```powershell
$env:ANDROID_HOME = "E:\android_studio\Android\Sdk"; .\android\gradlew.bat -p android app:installDebug -PreactNativeDevServerPort=8081
```

**۵ — اجرا**

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" shell am start -n com.polbin/.MainActivity
```

### اتصال بی‌سیم (اختیاری، اندروید ۱۱ به بالا)

اگر نمی‌خواهی کابل وصل باشد:

۱. روی گوشی: **گزینه‌های توسعه‌دهنده ← اشکال‌زدایی بی‌سیم** را روشن کن
۲. **Pair device with pairing code** را بزن — یک IP:PORT و یک کد شش‌رقمی نشان می‌دهد
۳. روی کامپیوتر:

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" pair 192.168.1.50:37021
```

کد شش‌رقمی را وارد کن، بعد وصل شو (این پورت با پورت pair فرق دارد، از صفحه‌ی اصلی
اشکال‌زدایی بی‌سیم بخوانش):

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" connect 192.168.1.50:39887
```

در حالت بی‌سیم `adb reverse` هم کار می‌کند. گوشی و کامپیوتر باید روی یک شبکه‌ی وای‌فای باشند.

---

## کلید امضای release

APK بدون کلید واقعی برای کافه‌بازار بی‌مصرف است. این کار **یک‌بار** انجام می‌شود
و بعدش همه‌ی نسخه‌ها با همان کلید امضا می‌شوند.

> **رمزی که اینجا می‌سازی را جای امنی نگه دار و در چت یا گیت نگذار.**
> اگر کلید یا رمزش را گم کنی، دیگر هیچ‌وقت نمی‌توانی اپ منتشرشده را آپدیت کنی —
> کافه‌بازار آپدیتی که با کلید دیگری امضا شده باشد را قبول نمی‌کند و باید اپ را
> از اول با شناسه‌ی جدید منتشر کنی. کاربرها هم همه‌چیزشان را از دست می‌دهند.

### قدم ۱: کلید را بساز

جایی **بیرون از پوشه‌ی پروژه** بسازش تا اشتباهی داخل گیت نرود:

```powershell
& "$env:JAVA_HOME\bin\keytool.exe" -genkeypair -v -storetype PKCS12 -keystore "$env:USERPROFILE\polbin-release.keystore" -alias polbin -keyalg RSA -keysize 2048 -validity 10000
```

اگر `JAVA_HOME` ست نیست، از JDK اندروید استودیو استفاده کن:

```powershell
& "E:\android_studio\Android\Android Studio\jbr\bin\keytool.exe" -genkeypair -v -storetype PKCS12 -keystore "$env:USERPROFILE\polbin-release.keystore" -alias polbin -keyalg RSA -keysize 2048 -validity 10000
```

چند سوال می‌پرسد:

- **رمز** — خودت انتخاب کن و جایی امن نگه دار.
- **نام و نام خانوادگی، واحد، سازمان، شهر، استان، کد کشور** — می‌توانی خالی بگذاری
  یا هرچه می‌خواهی بنویسی؛ روی کارکرد اثری ندارد. کد کشور ایران `IR` است.

`validity 10000` یعنی حدود ۲۷ سال اعتبار — عمداً طولانی، چون بعد از انقضا دیگر
نمی‌شود با همان کلید آپدیت داد.

### قدم ۲: رمز را در فایل خارج از پروژه بگذار

فایل `C:\Users\<نام کاربری>\.gradle\gradle.properties` را باز کن (اگر نیست بساز)
و این چهار خط را اضافه کن:

```properties
POLBIN_STORE_FILE=C:\Users\<نام کاربری>\polbin-release.keystore
POLBIN_KEY_ALIAS=polbin
POLBIN_STORE_PASSWORD=<رمزی که گذاشتی>
POLBIN_KEY_PASSWORD=<همان رمز>
```

توجه: در فایل `.properties` بک‌اسلش باید **دوتایی** نوشته شود.

این فایل بیرون از مخزن است و هیچ‌وقت commit نمی‌شود. `build.gradle` فقط همین
مقدارها را می‌خواند؛ هیچ رمزی داخل پروژه نیست.

### قدم ۳: بیلد بگیر و مطمئن شو

```powershell
$env:JAVA_TOOL_OPTIONS = "-Djdk.net.unixdomain.tmpdir=C:\Users\Mahziyar79\.gradle\javatmp"; .\android\gradlew.bat -p android assembleRelease
```

اگر تنظیمات درست باشد، **هشدار زرد** `polbin: POLBIN_STORE_FILE تنظیم نشده` دیگر
چاپ نمی‌شود. برای اطمینان کامل، امضای APK را ببین:

```powershell
& "E:\android_studio\Android\Sdk\build-tools\37.0.0\apksigner.bat" verify --print-certs "android\app\build\outputs\apk\release\app-arm64-v8a-release.apk"
```

اگر `CN=Android Debug` دیدی یعنی هنوز با کلید debug امضا می‌شود.

### قدم ۴: نسخه‌ی قدیمی را حذف و دوباره نصب کن

اندروید اجازه نمی‌دهد اپی که با کلید debug امضا شده با کلید جدید آپدیت شود.

**قبل از حذف، از داخل خود اپ فایل پشتیبان JSON بگیر** (صفحه‌ی «پشتیبان و خروجی»)
وگرنه تراکنش‌ها و بودجه‌ات می‌پرد. بعد از نصب نسخه‌ی جدید، از همان صفحه برشان
گردان. این آخرین باری است که لازم است؛ از این به بعد همه‌ی نسخه‌ها روی هم آپدیت
می‌شوند.

### پشتیبان از خود کلید

فایل `polbin-release.keystore` را جای دومی هم نگه دار — فلش، هارد دیگر، یا فضای
ابری خصوصی. گم شدنش برگشت‌ناپذیر است.

---

## عیب‌یابی

خطاهایی که واقعاً در این پروژه دیدیم و علتشان:

| خطا | علت | راه حل |
|---|---|---|
| `Unable to establish loopback connection` | `JAVA_TOOL_OPTIONS` ست نشده | نکته‌ی ۱ بالا |
| `'gradlew.bat' is not recognized` | `npm run android` زده‌ای | مستقیم `gradlew.bat` را صدا بزن |
| `Could not find com.android.tools.build:gradle` | VPN خاموش است | VPN را روشن کن |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | حافظه‌ی شبیه‌ساز پر است | اول اپ را uninstall کن (پایین) |
| `Requested internal only, but not enough space` | همان بالایی | همان بالایی |
| `No connected devices!` | شبیه‌ساز/گوشی وصل نیست | `adb devices` را چک کن |
| `Device is OFFLINE` | snapshot شبیه‌ساز خراب شده | بوت سرد (پایین) |
| `Connection reset by peer` موقع نصب | VPN مسیر شبکه‌ی شبیه‌ساز را گرفته | VPN را قطع کن |
| صفحه‌ی قرمز `Unable to load script` | پل پورت پاک شده | `adb reverse --list` را چک کن (پایین) |
| چیدمان چپ‌به‌راست است | اپ بعد از نصب restart نشده | اپ را کامل ببند و باز کن |
| اپ روی گوشی نصب نمی‌شود | فقط `x86_64` بیلد شده | قدم ۱ بخش گوشی واقعی |

### `Unable to load script` — اول این را چک کن

**قبل از اینکه سراغ Metro بروی**، پل پورت را ببین:

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" reverse --list
```

اگر خروجی **خالی** بود، مشکل همین است:

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081
```

بعد اپ را ببند و باز کن.

**چرا پاک می‌شود:** `adb reverse` روی سه حالت از بین می‌رود — بسته و باز شدن شبیه‌ساز،
ری‌استارت شدن دیمن adb (خود Gradle گاهی این کار را می‌کند)، و جدا شدن کابل گوشی.

**چرا اصلاً لازم است:** اپ روی `debug_http_host = localhost:8081` تنظیم شده تا ترافیک از
کانال adb برود نه شبکه‌ی مجازی شبیه‌ساز — این کار برای دور زدن تداخل VPN با مسیر
`10.0.2.2` انجام شد. بدون پل پورت، `localhost` داخل شبیه‌ساز یعنی خود شبیه‌ساز.

### شبیه‌ساز `offline` گیر کرده

بستن و باز کردن معمولی جواب نمی‌دهد چون از همان snapshot خراب بالا می‌آید.
**بوت سرد** لازم است:

```powershell
& "E:\android_studio\Android\Sdk\emulator\emulator.exe" -avd Small_Phone -no-snapshot-load
```

در اندروید استودیو: Device Manager ← سه‌نقطه‌ی دستگاه ← **Cold Boot Now**.

### حافظه‌ی شبیه‌ساز پر شد

APK دیباگ با هر چهار معماری حدود ۱۵۰ مگ است و موقع نصب بیش از دو برابر جا می‌خواهد.
ساده‌ترین راه، برداشتن نسخه‌ی قبلی است:

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" uninstall com.polbin
```

> این کار **داده‌ی محلی اپ را پاک می‌کند** — تراکنش‌ها، دسته‌های دلخواه و وضعیت
> onboarding از بین می‌روند و اپ مثل نصب تازه بالا می‌آید.

اگر باز هم کم آورد، اپ‌های آزمایشی دیگر را از شبیه‌ساز پاک کن یا Wipe Data بزن.

### VPN و شبیه‌ساز

اگر VPN روشن باشد (مخصوصاً OpenVPN با آداپتور TAP یا sing-box در حالت TUN)، مسیر شبکه‌ی
بین شبیه‌ساز و کامپیوتر مختل می‌شود. علائمش: باندل روی ۹۹٪ گیر می‌کند، `Connection reset
by peer` موقع نصب، و offline شدن مکرر شبیه‌ساز.

**موقع کار با شبیه‌ساز VPN را قطع کن.** برای بیلد لازم نیست چون وابستگی‌ها کش شده‌اند —
فقط وقتی لازم است که پکیج جدیدی از `dl.google.com` بیاید.

### دستورهای مفید

```powershell
# پاک کردن لاگ و دیدن لاگ زنده‌ی JS
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" logcat -c
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" logcat -s ReactNativeJS
```

```powershell
# حذف کامل اپ از دستگاه
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" uninstall com.polbin
```

```powershell
# بیلد تمیز وقتی چیزی عجیب شد
Set-Location "D:\personal projects\polbin\android"; & .\gradlew.bat clean
```

```powershell
# ری‌استارت Metro با کش خالی
Set-Location "D:\personal projects\polbin"; npx react-native start --reset-cache
```
