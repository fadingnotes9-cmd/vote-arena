package io.github.fadingnotes9_cmd.votearena;

import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setupDisplay();
    }

    private void setupDisplay() {
        // Cegah layar mati otomatis
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Immersive mode (halus)
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat controller = 
            WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            // Cuma hide status bar, nav bar tetap ada untuk stabilitas
            controller.hide(WindowInsetsCompat.Type.statusBars());
            controller.setSystemBarsBehavior(
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            );
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            // Re-apply saat kembali dari background
            WindowInsetsControllerCompat controller = 
                WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
            if (controller != null) {
                controller.hide(WindowInsetsCompat.Type.statusBars());
            }
        }
    }
}
