// ============================================
// RTMP Bridge — JS <-> Capacitor Plugin
// Fase 2b: Full UI integration
// ============================================

class RTMPBridge {
  constructor() {
    this.available = false;
    this.plugin = null;
    this.isStreaming = false;
  }

  async init() {
    if (typeof Capacitor === 'undefined') {
      console.log('🌐 Mode browser — RTMP tidak tersedia');
      this.updateUI('unavailable', 'Hanya di APK');
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

      // Listen status updates dari Java
      this.plugin.addListener('rtmpStatus', (data) => {
        console.log('📡 RTMP status:', data);
        this.handleStatus(data);
      });
      this.plugin.addListener('rtmpBitrate', (data) => {
        // Optional log bitrate
      });

      return true;
    } catch (e) {
      console.warn('⚠️ Init error:', e);
      return false;
    }
  }

  handleStatus(data) {
    const s = data.status;
    const msg = data.message || '';

    if (s === 'connecting') this.updateUI('connecting', '⏳ Menghubungkan...');
    else if (s === 'connected') {
      this.isStreaming = true;
      this.updateUI('live', '🔴 LIVE di YouTube!');
      this.toggleButtons(true);
    }
    else if (s === 'failed') this.updateUI('failed', '❌ ' + msg);
    else if (s === 'auth_error') this.updateUI('failed', '🔐 ' + msg);
    else if (s === 'disconnected') {
      this.isStreaming = false;
      this.updateUI('stopped', 'Stream berakhir');
      this.toggleButtons(false);
    }
    else if (s === 'cancelled') {
      this.isStreaming = false;
      this.updateUI('ready', 'Siap (dibatalkan)');
      this.toggleButtons(false);
    }
  }

  updateUI(status, text) {
    const box = document.getElementById('rtmpStatusText');
    if (!box) return;
    box.textContent = text;
    const colors = {
      ready: '#fbbf24',
      connecting: '#3b82f6',
      live: '#10b981',
      failed: '#dc2626',
      stopped: '#a0a0b0',
      unavailable: '#a0a0b0'
    };
    box.style.color = colors[status] || '#fbbf24';
  }

  toggleButtons(streaming) {
    const start = document.getElementById('rtmpStartBtn');
    const stop = document.getElementById('rtmpStopBtn');
    if (!start || !stop) return;
    if (streaming) {
      start.style.display = 'none';
      stop.style.display = 'block';
    } else {
      start.style.display = 'block';
      stop.style.display = 'none';
    }
  }

  async ping() {
    if (!this.available) return { status: 'unavailable' };
    try { return await this.plugin.ping(); }
    catch (e) { return { status: 'error', message: e.message }; }
  }

  async startStream(url, key) {
    if (!this.available) return { status: 'unavailable' };
    try {
      this.updateUI('connecting', '⏳ Meminta izin...');
      return await this.plugin.startStream({ url, key });
    } catch (e) {
      this.updateUI('failed', '❌ ' + e.message);
      return { status: 'error', message: e.message };
    }
  }

  async stopStream() {
    if (!this.available) return { status: 'unavailable' };
    try {
      const r = await this.plugin.stopStream();
      this.isStreaming = false;
      this.toggleButtons(false);
      return r;
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }
}

window.RTMPBridge = new RTMPBridge();

// ============================================
// Setup UI saat DOM ready
// ============================================
window.addEventListener('DOMContentLoaded', async () => {
  await window.RTMPBridge.init();

  const liveBtn = document.getElementById('rtmpLiveBtn');
  const modal = document.getElementById('rtmpModal');
  const closeBtn = document.getElementById('rtmpCloseBtn');
  const startBtn = document.getElementById('rtmpStartBtn');
  const stopBtn = document.getElementById('rtmpStopBtn');
  const urlInput = document.getElementById('rtmpUrlInput');
  const keyInput = document.getElementById('rtmpKeyInput');
  const testBtn = document.getElementById('testRtmpBtn');

  // Buka modal
  if (liveBtn && modal) {
    liveBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      console.log('📱 RTMP modal opened');
    });
  }

  // Tutup modal
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });
  }

  // Start streaming
  if (startBtn) {
    startBtn.addEventListener('click', async () => {
      const url = urlInput.value.trim();
      const key = keyInput.value.trim();
      if (!url || !key) {
        alert('URL dan Stream Key wajib diisi!');
        return;
      }
      // Simpan key di localStorage (biar tidak perlu ketik ulang)
      try { localStorage.setItem('rtmp-key', key); } catch (e) {}
      const result = await window.RTMPBridge.startStream(url, key);
      console.log('🎬 Start result:', result);
    });
  }

  // Stop streaming
  if (stopBtn) {
    stopBtn.addEventListener('click', async () => {
      const result = await window.RTMPBridge.stopStream();
      console.log('⏹ Stop result:', result);
    });
  }

  // Load stream key tersimpan
  if (keyInput) {
    try {
      const saved = localStorage.getItem('rtmp-key');
      if (saved) keyInput.value = saved;
    } catch (e) {}
  }

  // Test button (existing)
  if (testBtn) {
    testBtn.addEventListener('click', async () => {
      console.log('🔌 Testing RTMP bridge...');
      const result = await window.RTMPBridge.ping();
      console.log('📦 Result:', result);
      alert('RTMP Bridge Result:\\n\\n' + JSON.stringify(result, null, 2));
    });
  }

  console.log('✅ RTMP UI handlers ready');
});
