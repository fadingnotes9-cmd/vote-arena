package io.github.fadingnotes9_cmd.votearena;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * RTMP Plugin untuk Vote Arena
 * Bridge JavaScript <-> RootEncoder (screen capture + RTMP)
 */
@CapacitorPlugin(name = "RTMP")
public class RTMPPlugin extends Plugin {

    private static final String TAG = "RTMPPlugin";

    @PluginMethod
    public void ping(PluginCall call) {
        Log.i(TAG, "Ping called from JS");
        JSObject ret = new JSObject();
        ret.put("status", "pong");
        ret.put("version", "0.1.0-mvp");
        ret.put("library", "RootEncoder 2.5.5");
        ret.put("message", "Bridge Java <-> JS bekerja!");
        call.resolve(ret);
    }

    @PluginMethod
    public void startStream(PluginCall call) {
        String url = call.getString("url", "");
        String key = call.getString("key", "");
        Log.i(TAG, "startStream called: " + url);

        // MVP: hanya return, belum implement streaming real
        JSObject ret = new JSObject();
        ret.put("status", "not_implemented");
        ret.put("message", "Streaming belum diimplementasi (MVP phase)");
        ret.put("url", url);
        ret.put("keyLength", key.length());
        call.resolve(ret);
    }

    @PluginMethod
    public void stopStream(PluginCall call) {
        Log.i(TAG, "stopStream called");
        JSObject ret = new JSObject();
        ret.put("status", "stopped");
        call.resolve(ret);
    }
}
