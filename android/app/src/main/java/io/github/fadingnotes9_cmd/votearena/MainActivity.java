package io.github.fadingnotes9_cmd.votearena;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(RTMPPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
