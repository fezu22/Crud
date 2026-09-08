package com.medi

import android.bluetooth.BluetoothProfile
import android.content.Context
import android.media.AudioDeviceInfo
import android.media.AudioManager
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class BluetoothAudioRouteModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {
  private var routedToBluetooth = false

  override fun getName() = "BluetoothAudioRoute"

  @ReactMethod
  fun setCallSpeaker(enabled: Boolean) {
    val manager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    manager.mode = AudioManager.MODE_IN_COMMUNICATION
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
      val type = if (enabled) AudioDeviceInfo.TYPE_BUILTIN_SPEAKER else AudioDeviceInfo.TYPE_BUILTIN_EARPIECE
      val device = manager.availableCommunicationDevices.firstOrNull { it.type == type }
      if (device != null) manager.setCommunicationDevice(device)
    } else {
      @Suppress("DEPRECATION")
      manager.isSpeakerphoneOn = enabled
    }
  }

  @ReactMethod
  fun stopCallAudio() {
    val manager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
      manager.clearCommunicationDevice()
    } else {
      @Suppress("DEPRECATION")
      manager.isSpeakerphoneOn = false
    }
    manager.mode = AudioManager.MODE_NORMAL
  }

  @ReactMethod
  fun start() {
    val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    val bluetoothDevice = audioManager.getDevices(AudioManager.GET_DEVICES_ALL)
      .firstOrNull { device ->
        device.type == AudioDeviceInfo.TYPE_BLUETOOTH_SCO ||
          device.type == AudioDeviceInfo.TYPE_BLE_HEADSET
      }

    if (bluetoothDevice == null) {
      routedToBluetooth = false
      return
    }

    try {
      audioManager.mode = AudioManager.MODE_IN_COMMUNICATION
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
        routedToBluetooth = audioManager.setCommunicationDevice(bluetoothDevice)
      } else {
        @Suppress("DEPRECATION")
        audioManager.startBluetoothSco()
        @Suppress("DEPRECATION")
        audioManager.isBluetoothScoOn = true
        routedToBluetooth = true
      }
    } catch (_: SecurityException) {
      routedToBluetooth = false
    }
  }

  @ReactMethod
  fun stop() {
    if (!routedToBluetooth) return

    val audioManager = reactContext.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    try {
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
        audioManager.clearCommunicationDevice()
      } else {
        @Suppress("DEPRECATION")
        audioManager.stopBluetoothSco()
        @Suppress("DEPRECATION")
        audioManager.isBluetoothScoOn = false
      }
      audioManager.mode = AudioManager.MODE_NORMAL
    } catch (_: SecurityException) {
      // Audio routing cleanup is best effort when the device revokes access.
    } finally {
      routedToBluetooth = false
    }
  }
}

class BluetoothAudioRoutePackage : com.facebook.react.ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext) =
    listOf(BluetoothAudioRouteModule(reactContext))

  override fun createViewManagers(reactContext: ReactApplicationContext) =
    emptyList<com.facebook.react.uimanager.ViewManager<*, *>>()
}
