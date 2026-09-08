package com.polbin

import android.app.Activity
import android.content.ClipData
import android.content.Context
import android.content.Intent
import android.print.PrintAttributes
import android.print.PrintManager
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.core.content.FileProvider
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.BaseActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

/**
 * کارهای فایلی که ری‌اکت‌نیتیو خودش ندارد: ذخیره و هم‌رسانی فایل، انتخاب فایل
 * از حافظه، و چاپ.
 *
 * چرا خودمان نوشتیم و کتابخانه نصب نکردیم: هر سه کار API استاندارد اندروید
 * دارند و مجموعاً کمتر از دویست خط است، در حالی که کتابخانه‌های آماده‌ی این
 * حوزه یا قدیمی‌اند یا هرکدام یک وابستگی نیتیو دیگر می‌آورند.
 */
class PolbinFilesModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

  override fun getName() = NAME

  private var pickPromise: Promise? = null

  private val activityListener: ActivityEventListener =
      object : BaseActivityEventListener() {
        override fun onActivityResult(
            activity: Activity,
            requestCode: Int,
            resultCode: Int,
            data: Intent?,
        ) {
          if (requestCode != PICK_FILE_REQUEST) return

          val promise = pickPromise ?: return
          pickPromise = null

          if (resultCode != Activity.RESULT_OK || data?.data == null) {
            promise.resolve(null)
            return
          }

          try {
            val text =
                reactContext.contentResolver.openInputStream(data.data!!)?.use {
                  it.readBytes().toString(Charsets.UTF_8)
                }
            promise.resolve(text)
          } catch (error: Exception) {
            promise.reject(ERROR_READ, error.message, error)
          }
        }
      }

  init {
    reactContext.addActivityEventListener(activityListener)
  }

  /**
   * فایل را در پوشه‌ی موقت می‌نویسد و منوی هم‌رسانی اندروید را باز می‌کند.
   *
   * فایل در cache می‌ماند نه حافظه‌ی عمومی، چون کاربر خودش انتخاب می‌کند کجا
   * ذخیره‌اش کند و ما نباید بدون اجازه جایی بنویسیم.
   */
  @ReactMethod
  fun saveAndShare(fileName: String, mimeType: String, content: String, promise: Promise) {
    try {
      val folder = File(reactContext.cacheDir, "exports").apply { mkdirs() }
      val file = File(folder, fileName)
      file.writeText(content, Charsets.UTF_8)

      val uri =
          FileProvider.getUriForFile(reactContext, "${reactContext.packageName}.fileprovider", file)

      val share =
          Intent(Intent.ACTION_SEND).apply {
            type = mimeType
            putExtra(Intent.EXTRA_STREAM, uri)
            // بدون clipData، اجازه‌ی خواندن فقط به مقصد نهایی می‌رسد و نه به خود
            // منوی انتخاب؛ نتیجه‌اش Permission Denial و نبود پیش‌نمایش است.
            clipData = ClipData.newRawUri(fileName, uri)
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
          }

      val chooser =
          Intent.createChooser(share, null).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_GRANT_READ_URI_PERMISSION)
          }

      reactContext.startActivity(chooser)
      promise.resolve(file.absolutePath)
    } catch (error: Exception) {
      promise.reject(ERROR_WRITE, error.message, error)
    }
  }

  /** انتخاب یک فایل متنی و برگرداندن محتوایش. اگر کاربر منصرف شود null می‌دهد. */
  @ReactMethod
  fun pickTextFile(promise: Promise) {
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject(ERROR_NO_ACTIVITY, "اپ در حال حاضر صفحه‌ای باز ندارد.")
      return
    }

    pickPromise = promise

    val intent =
        Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
          addCategory(Intent.CATEGORY_OPENABLE)
          // بعضی فایل‌منیجرها JSON را با نوع دیگری اعلام می‌کنند، پس عام می‌گیریم
          type = "*/*"
        }

    activity.startActivityForResult(intent, PICK_FILE_REQUEST)
  }

  /**
   * باز کردن پنجره‌ی چاپ اندروید با محتوای HTML.
   *
   * از WebView استفاده می‌کنیم چون خودش شکل‌دهی حروف فارسی و راست‌به‌چپ را
   * درست انجام می‌دهد — کاری که رسم دستی روی canvas بسیار سخت‌ترش می‌کند.
   * کاربر در همان پنجره «ذخیره به‌صورت PDF» را انتخاب می‌کند.
   */
  @ReactMethod
  fun printHtml(html: String, jobName: String, promise: Promise) {
    val activity = reactContext.currentActivity
    if (activity == null) {
      promise.reject(ERROR_NO_ACTIVITY, "اپ در حال حاضر صفحه‌ای باز ندارد.")
      return
    }

    activity.runOnUiThread {
      try {
        val webView = WebView(activity)
        webView.webViewClient =
            object : WebViewClient() {
              override fun onPageFinished(view: WebView, url: String) {
                val printManager =
                    activity.getSystemService(Context.PRINT_SERVICE) as PrintManager

                printManager.print(
                    jobName,
                    view.createPrintDocumentAdapter(jobName),
                    PrintAttributes.Builder()
                        .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                        .build(),
                )

                promise.resolve(true)
              }
            }

        webView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null)
      } catch (error: Exception) {
        promise.reject(ERROR_PRINT, error.message, error)
      }
    }
  }

  private companion object {
    const val NAME = "PolbinFiles"
    const val PICK_FILE_REQUEST = 4021
    const val ERROR_WRITE = "E_WRITE"
    const val ERROR_READ = "E_READ"
    const val ERROR_PRINT = "E_PRINT"
    const val ERROR_NO_ACTIVITY = "E_NO_ACTIVITY"
  }
}
