// ============================================
// YouTube Chat Listener - Vote Arena
// Baca chat → filter !vote → push ke Firebase
// Usage: node youtube-listener.mjs <VIDEO_ID>
// ============================================

import { LiveChat } from 'youtube-chat-next';

const DATABASE_URL = 'https://sensus-ekonomi-2026-default-rtdb.asia-southeast1.firebasedatabase.app';
const VIDEO_ID = process.argv[2];

if (!VIDEO_ID) {
  console.error('❌ Usage: node youtube-listener.mjs <VIDEO_ID>');
  console.error('   Contoh: node youtube-listener.mjs dQw4w9WgXcQ');
  process.exit(1);
}

// Push vote ke Firebase via REST API
async function pushVote(cmd, author, isSuper, amount, color) {
  const payload = {
    cmd: cmd,
    username: author,
    isSuper: isSuper || false,
    amount: amount || null,
    color: color || null,
    timestamp: Date.now()
  };
  const url = DATABASE_URL + '/votes.json';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

console.log('🚀 Starting listener for video:', VIDEO_ID);

// ============================================
// Setup LiveChat
// ============================================
const chat = new LiveChat({ liveId: VIDEO_ID });

// Event: chat message masuk
chat.on('chat', async (msg) => {
  const author = msg.author?.name || 'Unknown';
  // msg.message bisa array (dengan emoji/format) atau string
  const message = Array.isArray(msg.message)
    ? msg.message.map(p => p.text || p.emojiText || '').join('').trim()
    : String(msg.message || '').trim();

  // Detect Super Chat
  const isSuper = !!(msg.superchat && msg.superchat.amount);
  const scAmount = isSuper ? msg.superchat.amount : null;
  const scColor = isSuper ? msg.superchat.color : null;
  
  if (isSuper) {
    console.log(`💰 SUPER CHAT: ${author} — ${scAmount}`);
  }

  // Cek command vote
  if (message.startsWith('!')) {
    const cmd = message.substring(1).toLowerCase().trim();
    // Validasi: hanya huruf, angka, underscore (max 20 char)
    if (cmd && /^[a-z0-9_]{1,20}$/.test(cmd)) {
      console.log(`💬 [${author}] ${message} → cmd: ${cmd}`);
      try {
        await pushVote(cmd, author, isSuper, scAmount, scColor);
        const tag = isSuper ? `💰 SUPER +5` : '✅ VOTE';
        console.log(`${tag}: ${cmd} by ${author}`);
      } catch (err) {
        console.error('❌ Failed push:', err.message);
      }
    }
  }
});

// Event: error
chat.on('error', (err) => {
  console.error('❌ Chat error:', err);
});

// Event: end
chat.on('end', (reason) => {
  console.log('🏁 Chat ended:', reason);
  process.exit(0);
});

// ============================================
// Start
// ============================================
(async () => {
  console.log('⏳ Connecting to live chat...');
  try {
    const ok = await chat.start();
    console.log(ok ? '🔥 LISTENER ACTIVE — chat is live' : '⚠️ Failed to start');
  } catch (err) {
    console.error('❌ Start error:', err);
    process.exit(1);
  }
})();
