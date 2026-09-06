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

## بخش ۲ — اجرا روی گوشی واقعی

### قدم ۱: معماری را عوض کن (بدون این، اپ روی گوشی نصب نمی‌شود)

الان پروژه فقط برای `x86_64` بیلد می‌شود که معماری شبیه‌ساز است. گوشی‌های واقعی ARM هستند.
در [android/gradle.properties](android/gradle.properties) خط `reactNativeArchitectures` را عوض کن:

```properties
# برای گوشی واقعی (اکثر گوشی‌های امروزی):
reactNativeArchitectures=arm64-v8a

# برای نسخه‌ی نهایی کافه‌بازار (همه‌ی گوشی‌ها):
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64
```

بعد از این تغییر یک بیلد کامل لازم است (چند دقیقه، چون C++ برای معماری جدید کامپایل می‌شود).

### قدم ۲: روی گوشی، Developer Options را باز کن

۱. **تنظیمات ← درباره‌ی گوشی**
۲. روی **شماره‌ی ساخت** (Build number) هفت بار پشت سر هم بزن
۳. برگرد به تنظیمات ← **گزینه‌های توسعه‌دهنده** (Developer options) ظاهر شده
۴. **اشکال‌زدایی USB** (USB debugging) را روشن کن

### قدم ۳: با کابل وصل کن

گوشی را با کابل به کامپیوتر بزن. روی گوشی یک دیالوگ می‌آید که اثر انگشت کامپیوتر را نشان
می‌دهد — **Allow** را بزن و تیک «همیشه» را بگذار.

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" devices
```

باید سریال گوشی را با وضعیت `device` ببینی. اگر `unauthorized` بود، دیالوگ روی گوشی را تایید نکرده‌ای.
اگر اصلاً چیزی نبود، کابل را عوض کن — خیلی از کابل‌ها فقط شارژ هستند و دیتا رد نمی‌کنند.

### قدم ۴: Metro و پل پورت

Metro را روشن کن (مثل قدم ۳ بخش شبیه‌ساز)، بعد پورت ۸۰۸۱ را به گوشی پل بزن:

```powershell
& "E:\android_studio\Android\Sdk\platform-tools\adb.exe" reverse tcp:8081 tcp:8081
```

این دستور را **بعد از هر بار وصل کردن مجدد کابل** باید تکرار کنی.

### قدم ۵: بیلد و نصب

```powershell
Set-Location "D:\personal projects\polbin\android"; $env:ANDROID_HOME = "E:\android_studio\Android\Sdk"; & .\gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
```

### قدم ۶: اجرا

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

## عیب‌یابی

خطاهایی که واقعاً در این پروژه دیدیم و علتشان:

| خطا | علت | راه حل |
|---|---|---|
| `Unable to establish loopback connection` | `JAVA_TOOL_OPTIONS` ست نشده | نکته‌ی ۱ بالا |
| `'gradlew.bat' is not recognized` | `npm run android` زده‌ای | مستقیم `gradlew.bat` را صدا بزن |
| `Could not find com.android.tools.build:gradle` | VPN خاموش است | VPN را روشن کن |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | حافظه‌ی شبیه‌ساز پر است | Device Manager ← سه‌نقطه ← **Wipe Data** |
| `No connected devices!` | شبیه‌ساز/گوشی وصل نیست | `adb devices` را چک کن |
| صفحه‌ی قرمز `Unable to load script` | Metro خاموش است یا پورت پل نخورده | `npm start` + `adb reverse tcp:8081 tcp:8081` |
| چیدمان چپ‌به‌راست است | اپ بعد از نصب restart نشده | اپ را کامل ببند و باز کن |
| اپ روی گوشی نصب نمی‌شود | فقط `x86_64` بیلد شده | قدم ۱ بخش گوشی واقعی |

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
