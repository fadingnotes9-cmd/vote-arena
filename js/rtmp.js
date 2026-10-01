// ============================================
// RTMP Bridge — JS <-> Capacitor Plugin
// ============================================
// Deteksi kalau jalan di APK (Capacitor) atau browser biasa.

class RTMPBridge {
  constructor() {
    this.available = false;
    this.plugin = null;
  }

  async init() {
    if (typeof Capacitor === 'undefined') {
      console.log('🌐 Mode browser — RTMP tidak tersedia');
      return false;
    }
    try {
      this.plugin = Capacitor.Plugins.RTMP;
      if (!this.plugin) {
        console.warn('⚠️ RTMP plugin tidak di-register');
        return false;
      }
      this.available = true;
      console.log('✅ RTMP bridge siap');
      return true;
    } catch (e) {
      console.warn('⚠️ Init error:', e);
      return false;
    }
  }

  async ping() {
    if (!this.available) return { status: 'unavailable' };
    try {
      return await this.plugin.ping();
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }

  async startStream(url, key) {
    if (!this.available) return { status: 'unavailable' };
    try {
      return await this.plugin.startStream({ url, key });
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }

  async stopStream() {
    if (!this.available) return { status: 'unavailable' };
    try {
      return await this.plugin.stopStream();
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }
}

window.RTMPBridge = new RTMPBridge();

window.addEventListener('DOMContentLoaded', async () => {
  await window.RTMPBridge.init();
});


// ============================================
// Test Button Handler
// ============================================
window.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('testRtmpBtn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    console.log('🔌 Testing RTMP bridge...');
    const result = await window.RTMPBridge.ping();
    console.log('📦 Result:', result);
    alert('RTMP Bridge Result:\n\n' + JSON.stringify(result, null, 2));
  });
});
