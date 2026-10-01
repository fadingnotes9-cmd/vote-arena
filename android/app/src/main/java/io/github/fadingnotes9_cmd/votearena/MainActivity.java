package io.github.fadingnotes9_cmd.votearena;

import android.content.Intent;
import android.media.projection.MediaProjectionManager;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    public static final int SCREEN_CAPTURE_REQ = 9001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RTMPPlugin.class);
        super.onCreate(savedInstanceState);
    }

    // Dipanggil dari RTMPPlugin untuk minta izin screen capture
    public void requestScreenCapture() {
        MediaProjectionManager mpm = (MediaProjectionManager)
            getSystemService(MEDIA_PROJECTION_SERVICE);
        Intent intent = mpm.createScreenCaptureIntent();
        startActivityForResult(intent, SCREEN_CAPTURE_REQ);
    }

    // Override untuk capture hasil dari dialog Android
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == SCREEN_CAPTURE_REQ) {
            android.util.Log.i("MainActivity", "Screen capture result: " + resultCode);
            RTMPPlugin.onPermissionResult(resultCode, data);
        }
    }
}
