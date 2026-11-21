package com.bmteam.duelstars

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.UpdateAvailability

// Atualização pelo próprio Google Play (In-App Updates): o app descobre que
// há versão nova na loja e abre a tela do Play que baixa e reinicia, sem a
// pessoa sair do app. Só funciona em app instalado pela loja; em debug ou
// sideload a checagem diz que não há atualização.
class AppUpdateModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private val manager = AppUpdateManagerFactory.create(context)

  override fun getName() = "AppUpdate"

  override fun getConstants(): Map<String, Any> =
    mapOf("versionCode" to BuildConfig.VERSION_CODE, "versionName" to BuildConfig.VERSION_NAME)

  @ReactMethod
  fun check(promise: Promise) {
    manager.appUpdateInfo
      .addOnSuccessListener { info ->
        val result = Arguments.createMap()
        val availability = info.updateAvailability()
        result.putBoolean(
          "available",
          availability == UpdateAvailability.UPDATE_AVAILABLE ||
            availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS,
        )
        result.putInt("availableVersionCode", info.availableVersionCode())
        promise.resolve(result)
      }
      .addOnFailureListener {
        val result = Arguments.createMap()
        result.putBoolean("available", false)
        result.putInt("availableVersionCode", 0)
        promise.resolve(result)
      }
  }

  // true = a tela do Play abriu; false = não deu (sem atualização, app fora
  // da loja), e o JS cai no link da loja.
  @ReactMethod
  fun start(promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.resolve(false)
      return
    }
    manager.appUpdateInfo
      .addOnSuccessListener { info ->
        val availability = info.updateAvailability()
        val ready =
          (availability == UpdateAvailability.UPDATE_AVAILABLE ||
            availability == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) &&
            info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)
        if (!ready) {
          promise.resolve(false)
          return@addOnSuccessListener
        }
        try {
          manager.startUpdateFlowForResult(
            info,
            activity,
            AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build(),
            REQUEST_CODE,
          )
          promise.resolve(true)
        } catch (e: Exception) {
          promise.resolve(false)
        }
      }
      .addOnFailureListener { promise.resolve(false) }
  }

  companion object {
    private const val REQUEST_CODE = 4127
  }
}
