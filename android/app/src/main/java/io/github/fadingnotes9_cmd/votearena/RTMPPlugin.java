package io.github.fadingnotes9_cmd.votearena;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Build;
import android.util.Log;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.pedro.common.ConnectChecker;
import com.pedro.library.rtmp.RtmpDisplay;

/**
 * RTMP Plugin untuk Vote Arena
 * Fase 2b: MediaProjection screen capture + RTMP real streaming
 */
@CapacitorPlugin(name = "RTMP")
public class RTMPPlugin extends Plugin implements ConnectChecker {

    private static final String TAG = "RTMPPlugin";

    // Konfigurasi video/audio
    private static final int VIDEO_WIDTH = 720;
    private static final int VIDEO_HEIGHT = 1280;
    private static final int VIDEO_FPS = 30;
    private static final int VIDEO_BITRATE = 2500 * 1024;
    private static final int VIDEO_ROTATION = 0;
    private static final int VIDEO_DPI = 320;
    private static final int AUDIO_BITRATE = 128 * 1024;
    private static final int AUDIO_SAMPLE_RATE = 44100;
    private static final boolean AUDIO_STEREO = true;

    private RtmpDisplay rtmpDisplay;
    private String currentUrl;
    private String currentKey;
    private boolean useService = false;

    @PluginMethod
    public void ping(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("status", "pong");
        ret.put("version", "0.3.0-fase2b");
        ret.put("library", "RootEncoder 2.5.5");
        ret.put("androidVersion", Build.VERSION.SDK_INT);
        ret.put("useService", Build.VERSION.SDK_INT >= 34);
        ret.put("message", "Fase 2b: MediaProjection ready");
        call.resolve(ret);
    }

    @PluginMethod
    public void startStream(PluginCall call) {
        String url = call.getString("url", "");
        String key = call.getString("key", "");

        if (url.isEmpty() || key.isEmpty()) {
            call.reject("URL dan Stream Key wajib diisi");
            return;
        }

        this.currentUrl = url;
        this.currentKey = key;
        this.useService = Build.VERSION.SDK_INT >= 34;

        // Minta izin screen capture via MediaProjection
        try {
            MediaProjectionManager mpm = (MediaProjectionManager)
                getContext().getSystemService(Context.MEDIA_PROJECTION_SERVICE);
            Intent intent = mpm.createScreenCaptureIntent();
            startActivityForResult(call, intent, "handleScreenCaptureResult");
            Log.i(TAG, "Screen capture permission requested");
        } catch (Exception e) {
            Log.e(TAG, "MediaProjection error", e);
            call.reject("Gagal minta izin: " + e.getMessage());
        }
    }

    @ActivityCallback
    private void handleScreenCaptureResult(PluginCall call, ActivityResult result) {
        Log.i(TAG, "Screen capture result code: " + result.getResultCode());

        if (result.getResultCode() != Activity.RESULT_OK) {
            JSObject ret = new JSObject();
            ret.put("status", "permission_denied");
            ret.put("message", "Izin screen capture ditolak");
            if (call != null) call.resolve(ret);
            return;
        }

        try {
            // Inisialisasi RtmpDisplay
            rtmpDisplay = new RtmpDisplay(getContext(), useService, this);
            rtmpDisplay.setIntentResult(result.getResultCode(), result.getData());

            // Konfigurasi video & audio
            rtmpDisplay.prepareVideo(
                VIDEO_WIDTH, VIDEO_HEIGHT, VIDEO_FPS,
                VIDEO_BITRATE, VIDEO_ROTATION, VIDEO_DPI
            );
            rtmpDisplay.prepareAudio(AUDIO_BITRATE, AUDIO_SAMPLE_RATE, AUDIO_STEREO);

            // URL lengkap = URL + "/" + StreamKey
            String fullUrl = currentUrl;
            if (!fullUrl.endsWith("/")) fullUrl += "/";
            fullUrl += currentKey;

            rtmpDisplay.startStream(fullUrl);
            Log.i(TAG, "Stream started, waiting for connection...");

            JSObject ret = new JSObject();
            ret.put("status", "starting");
            ret.put("message", "Menghubungkan ke YouTube...");
            ret.put("resolution", VIDEO_WIDTH + "x" + VIDEO_HEIGHT);
            ret.put("fps", VIDEO_FPS);
            ret.put("bitrateKbps", VIDEO_BITRATE / 1024);
            if (call != null) call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "startStream error", e);
            JSObject ret = new JSObject();
            ret.put("status", "error");
            ret.put("message", e.getMessage() != null ? e.getMessage() : "Unknown error");
            if (call != null) call.resolve(ret);
        }
    }

    @PluginMethod
    public void stopStream(PluginCall call) {
        try {
            if (rtmpDisplay != null) {
                if (rtmpDisplay.isStreaming()) {
                    rtmpDisplay.stopStream();
                }
                if (useService) {
                    try { rtmpDisplay.stopService(); } catch (Exception ignored) {}
                }
                rtmpDisplay = null;
            }
            JSObject ret = new JSObject();
            ret.put("status", "stopped");
            ret.put("message", "Stream dihentikan");
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "stopStream error", e);
            JSObject ret = new JSObject();
            ret.put("status", "error");
            ret.put("message", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void isStreaming(PluginCall call) {
        JSObject ret = new JSObject();
        boolean streaming = rtmpDisplay != null && rtmpDisplay.isStreaming();
        ret.put("streaming", streaming);
        call.resolve(ret);
    }

    // ============================================
    // ConnectChecker callbacks
    // ============================================
    @Override
    public void onConnectionStarted(String url) {
        Log.i(TAG, "Connecting to: " + url);
        JSObject data = new JSObject();
        data.put("status", "connecting");
        data.put("message", "Menghubungkan...");
        notifyListeners("rtmpStatus", data);
    }

    @Override
    public void onConnectionSuccess() {
        Log.i(TAG, "CONNECTED!");
        JSObject data = new JSObject();
        data.put("status", "connected");
        data.put("message", "LIVE di YouTube!");
        notifyListeners("rtmpStatus", data);
    }

    @Override
    public void onConnectionFailed(String reason) {
        Log.e(TAG, "Connection failed: " + reason);
        JSObject data = new JSObject();
        data.put("status", "failed");
        data.put("message", reason);
        notifyListeners("rtmpStatus", data);
    }

    @Override
    public void onNewBitrate(long bitrate) {
        JSObject data = new JSObject();
        data.put("status", "bitrate");
        data.put("bitrateKbps", bitrate / 1024);
        notifyListeners("rtmpBitrate", data);
    }

    @Override
    public void onDisconnect() {
        Log.i(TAG, "Disconnected");
        JSObject data = new JSObject();
        data.put("status", "disconnected");
        data.put("message", "Stream berakhir");
        notifyListeners("rtmpStatus", data);
    }

    @Override
    public void onAuthError() {
        Log.e(TAG, "Auth error");
        JSObject data = new JSObject();
        data.put("status", "auth_error");
        data.put("message", "Stream Key salah atau expired");
        notifyListeners("rtmpStatus", data);
    }

    @Override
    public void onAuthSuccess() {
        Log.i(TAG, "Auth success");
    }
}
