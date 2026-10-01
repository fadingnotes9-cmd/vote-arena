package io.github.fadingnotes9_cmd.votearena;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// RootEncoder imports — verify library loads
import com.pedro.common.ConnectChecker;
import com.pedro.library.rtmp.RtmpDisplay;

/**
 * RTMP Plugin untuk Vote Arena
 * Bridge JavaScript <-> RootEncoder (screen capture + RTMP)
 */
@CapacitorPlugin(name = "RTMP")
public class RTMPPlugin extends Plugin implements ConnectChecker {

    private static final String TAG = "RTMPPlugin";

    @PluginMethod
    public void ping(PluginCall call) {
        Log.i(TAG, "Ping called from JS");
        JSObject ret = new JSObject();
        ret.put("status", "pong");
        ret.put("version", "0.2.0-fase2");
        ret.put("library", "RootEncoder 2.5.5");
        ret.put("rtmpClass", RtmpDisplay.class.getSimpleName());
        ret.put("message", "Fase 2: RootEncoder classes loaded");
        call.resolve(ret);
    }

    // ============================================
    // ConnectChecker implementation (callbacks dari RootEncoder)
    // ============================================
    @Override
    public void onConnectionStarted(String url) {
        Log.i(TAG, "RTMP connection started: " + url);
    }

    @Override
    public void onConnectionSuccess() {
        Log.i(TAG, "RTMP connection SUCCESS");
        notifyListeners("rtmpStatus", makeStatus("connected", "Streaming live!"));
    }

    @Override
    public void onConnectionFailed(String reason) {
        Log.e(TAG, "RTMP connection FAILED: " + reason);
        notifyListeners("rtmpStatus", makeStatus("failed", reason));
    }

    @Override
    public void onNewBitrate(long bitrate) {
        // Optional: log bitrate
    }

    @Override
    public void onDisconnect() {
        Log.i(TAG, "RTMP disconnected");
        notifyListeners("rtmpStatus", makeStatus("disconnected", "Stream stopped"));
    }

    @Override
    public void onAuthError() {
        Log.e(TAG, "RTMP auth error");
        notifyListeners("rtmpStatus", makeStatus("auth_error", "Stream key salah"));
    }

    @Override
    public void onAuthSuccess() {
        Log.i(TAG, "RTMP auth success");
    }

    private JSObject makeStatus(String status, String message) {
        JSObject o = new JSObject();
        o.put("status", status);
        o.put("message", message);
        o.put("timestamp", System.currentTimeMillis());
        return o;
    }

    @PluginMethod
    public void startStream(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("status", "not_implemented");
        ret.put("message", "Fase 2a: Ready, next step implement MediaProjection");
        call.resolve(ret);
    }

    @PluginMethod
    public void stopStream(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("status", "stopped");
        call.resolve(ret);
    }
}
