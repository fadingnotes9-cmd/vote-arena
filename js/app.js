// ============================================
// VOTE ARENA — app.js
// Chunk 1: State + Save/Load + Background
// ============================================

const STORAGE_KEY = 'vote-arena-state';

// State default
const defaultState = {
  matchNumber: 1,
  target: 100,
  players: [
    { id: 1, name: 'RONALDO', emoji: '🇵🇹', color: '#dc2626', score: 0 },
    { id: 2, name: 'MESSI',   emoji: '🇦🇷', color: '#0891b2', score: 0 }
  ],
  history: []
};

let state = loadState();

// ============================================
// Save & Load
// ============================================
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultState));
    const parsed = JSON.parse(raw);
    // Validasi minimal
    if (!parsed.players || !Array.isArray(parsed.players)) {
      return JSON.parse(JSON.stringify(defaultState));
    }
    return parsed;
  } catch (e) {
    console.warn('⚠️ Load state gagal, pakai default');
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    console.log('💾 State saved');
  } catch (e) {
    console.warn('⚠️ Save gagal:', e);
  }
}

// ============================================
// Background Canvas — Partikel Mengambang
// ============================================
const bgCanvas = document.getElementById('bgCanvas');
const bgCtx = bgCanvas.getContext('2d');
let particles = [];
let bgTime = 0;

function initBackground() {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
  
  particles = [];
  const count = 40;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * bgCanvas.width,
      y: Math.random() * bgCanvas.height,
      r: Math.random() * 3 + 1,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      a: Math.random() * 0.5 + 0.2
    });
  }
}

function drawBackground() {
  bgTime += 0.005;
  
  // Gradient background animated
  const grad = bgCtx.createLinearGradient(0, 0, bgCanvas.width, bgCanvas.height);
  const hue1 = (bgTime * 30) % 360;
  const hue2 = (hue1 + 60) % 360;
  
  grad.addColorStop(0, `hsl(${240 + Math.sin(bgTime) * 20}, 60%, 8%)`);
  grad.addColorStop(0.5, `hsl(${260 + Math.cos(bgTime) * 20}, 60%, 10%)`);
  grad.addColorStop(1, `hsl(${220 + Math.sin(bgTime * 0.7) * 20}, 60%, 6%)`);
  
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);
  
  // Partikel
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    
    if (p.x < 0) p.x = bgCanvas.width;
    if (p.x > bgCanvas.width) p.x = 0;
    if (p.y < 0) p.y = bgCanvas.height;
    if (p.y > bgCanvas.height) p.y = 0;
    
    bgCtx.beginPath();
    bgCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    bgCtx.fillStyle = `rgba(255, 255, 255, ${p.a})`;
    bgCtx.fill();
  });
  
  requestAnimationFrame(drawBackground);
}

// Start background
initBackground();
drawBackground();

window.addEventListener('resize', () => {
  bgCanvas.width = window.innerWidth;
  bgCanvas.height = window.innerHeight;
});

// ============================================
// Chunk 2: Render Arena + Vote + Winner
// ============================================

const arena = document.getElementById('arena');
const voteFeed = document.getElementById('voteFeed');

// ============================================
// Sound (Web Audio API — no files needed)
// ============================================
let audioCtx = null;

function initAudio() {
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch (e) { console.warn('⚠️ No audio'); }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
  const ctx = initAudio();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function sfxVote() { playTone(880, 0.1, 'sine', 0.12); }
function sfxWin() {
  [523, 659, 784, 1047].forEach((f, i) => 
    setTimeout(() => playTone(f, 0.4, 'triangle', 0.18), i * 130)
  );
}

// ============================================
// Render Top Bar
// ============================================
function updateTopBar() {
  document.getElementById('matchNum').textContent = '#' + state.matchNumber;
  document.getElementById('targetVal').textContent = state.target;
  
  const winner = state.players.find(p => p.score >= state.target);
  const status = document.getElementById('status');
  if (winner) {
    status.textContent = '🏆 ' + winner.name + ' MENANG';
    status.classList.remove('running');
    status.style.color = '#10b981';
  } else {
    status.textContent = '● LIVE';
    status.classList.add('running');
    status.style.color = '';
  }
}

// ============================================
// Render Arena — Player Cards
// ============================================
function renderArena() {
  arena.innerHTML = '';
  arena.className = 'players-' + Math.min(state.players.length, 6);
  
  const winner = state.players.find(p => p.score >= state.target);
  
  state.players.forEach(p => {
    const card = document.createElement('div');
    card.className = 'player-card';
    card.dataset.id = p.id;
    card.style.setProperty('--card-color', p.color);
    if (winner && winner.id === p.id) card.classList.add('winner');
    
    const pct = Math.min(100, (p.score / state.target) * 100);
    
    card.innerHTML = 
      '<div class="player-emoji">' + p.emoji + '</div>' +
      '<div class="player-name">' + escapeHtml(p.name) + '</div>' +
      '<div class="player-score" id="score-' + p.id + '">' + p.score + '</div>' +
      '<div class="player-progress">' +
        '<div class="player-progress-bar" style="width:' + pct + '%"></div>' +
      '</div>';
    
    arena.appendChild(card);
  });
  
  updateTopBar();
}

// ============================================
// Escape HTML (biar nama user aman)
// ============================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================
// Vote System
// ============================================
function addVote(playerId, username, isSuper, amount) {
  const p = state.players.find(x => x.id === playerId);
  if (!p) return false;
  
  // Cek sudah menang
  if (state.players.some(x => x.score >= state.target)) return false;
  
  // Super Chat = 5 poin, biasa = 1 poin
  const points = isSuper ? 5 : 1;
  p.score += points;
  p.lastVoteBy = username || 'Anonim';
  
  saveState();
  
  // Update UI card
  const scoreEl = document.getElementById('score-' + p.id);
  const cardEl = arena.querySelector('[data-id="' + p.id + '"]');
  if (scoreEl) {
    scoreEl.textContent = p.score;
    scoreEl.classList.remove('bump');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('bump');
  }
  if (cardEl) {
    const bar = cardEl.querySelector('.player-progress-bar');
    if (bar) bar.style.width = Math.min(100, (p.score / state.target) * 100) + '%';
  }
  
  // Feed
  addFeedItem(username, p, isSuper, amount);
  
  // Sound
  if (isSuper && typeof sfxSuperChat === 'function') {
    sfxSuperChat();
    showSuperChatPopup(username, p, amount);
  } else {
    sfxVote();
  }
  
  // Cek winner
  if (p.score >= state.target) {
    setTimeout(() => {
      sfxWin();
      renderArena();
      celebrateWinner(p);
    }, 300);
  } else {
    updateTopBar();
  }
  
  return true;
}

// ============================================
// Vote Feed
// ============================================
function addFeedItem(username, player, isSuper, amount) {
  const item = document.createElement('div');
  item.className = 'vote-item';
  if (isSuper) item.classList.add('vote-item-super');
  item.style.setProperty('--item-color', player.color);
  let displayName = String(username || 'user');
  // Kalau sudah ada @ di depan, jangan tambah @ lagi
  if (!displayName.startsWith('@')) displayName = '@' + displayName;
  const superTag = isSuper ? '💰 ' + (amount || 'SUPER') + ' ' : '';
  const pointsLabel = isSuper ? ' (+5)' : '';
  const feedLine = (isSuper ? (superTag.trim() + ' ') : '') + 
    '<strong>' + escapeHtml(displayName) + '</strong> → ' + 
    player.emoji + ' ' + escapeHtml(player.name) + pointsLabel;
  item.innerHTML = feedLine;
  voteFeed.appendChild(item);
  
  // Max 6 items
  while (voteFeed.children.length > 6) {
    voteFeed.removeChild(voteFeed.firstChild);
  }
  
  // Auto-remove setelah 30 detik
  setTimeout(() => {
    if (item.parentNode) item.parentNode.removeChild(item);
  }, 30000);
}

// ============================================
// Chunk 3: Modal Setup + Init + Wire
// ============================================

const setupBtn = document.getElementById('setupBtn');
const setupModal = document.getElementById('setupModal');
const playerInputs = document.getElementById('playerInputs');
const addPlayerBtn = document.getElementById('addPlayerBtn');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const resetBtn = document.getElementById('resetBtn');
const targetInput = document.getElementById('targetInput');
const matchInput = document.getElementById('matchInput');

const PRESET_COLORS = [
  '#dc2626', '#0891b2', '#f59e0b', '#10b981', '#8b5cf6',
  '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#6366f1'
];

const EMOJI_PRESETS = ['🔥', '⚡', '⭐', '🚀', '💎', '👑', '🎯', '🐉', '🦁', '🦅'];

// ============================================
// Modal — render player inputs
// ============================================
function renderPlayerInputs() {
  playerInputs.innerHTML = '';
  
  state.players.forEach((p, i) => {
    const row = document.createElement('div');
    row.className = 'player-input-row';
    
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = p.color;
    colorInput.dataset.idx = i;
    colorInput.dataset.field = 'color';
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.value = p.name;
    nameInput.placeholder = 'Nama player...';
    nameInput.maxLength = 16;
    nameInput.dataset.idx = i;
    nameInput.dataset.field = 'name';
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.dataset.idx = i;
    removeBtn.addEventListener('click', () => {
      if (state.players.length <= 2) return; // minimal 2
      state.players.splice(i, 1);
      renderPlayerInputs();
    });
    
    row.appendChild(colorInput);
    row.appendChild(nameInput);
    row.appendChild(removeBtn);
    playerInputs.appendChild(row);
  });
  
  // Set value target & match
  targetInput.value = state.target;
  matchInput.value = state.matchNumber;
}

// ============================================
// Modal Open/Close
// ============================================
function openSetup() {
  renderPlayerInputs();
  setupModal.classList.remove('hidden');
}

function closeSetup() {
  setupModal.classList.add('hidden');
}

setupBtn.addEventListener('click', openSetup);
cancelBtn.addEventListener('click', closeSetup);

// ============================================
// Add Player
// ============================================
addPlayerBtn.addEventListener('click', () => {
  if (state.players.length >= 6) {
    alert('Maksimal 6 player');
    return;
  }
  const idx = state.players.length;
  state.players.push({
    id: Date.now(),
    name: 'Player ' + (idx + 1),
    emoji: EMOJI_PRESETS[idx % EMOJI_PRESETS.length],
    color: PRESET_COLORS[idx % PRESET_COLORS.length],
    score: 0
  });
  renderPlayerInputs();
});

// ============================================
// Save Setup
// ============================================
saveBtn.addEventListener('click', () => {
  // Baca semua input
  playerInputs.querySelectorAll('input').forEach(inp => {
    const idx = parseInt(inp.dataset.idx);
    const field = inp.dataset.field;
    if (state.players[idx]) {
      state.players[idx][field] = inp.value || (field === 'name' ? 'Player' : '#888');
    }
  });
  
  state.target = Math.max(10, parseInt(targetInput.value) || 100);
  state.matchNumber = Math.max(1, parseInt(matchInput.value) || 1);
  
  saveState();
  renderArena();
  closeSetup();
  console.log('✅ Setup saved');
});

// ============================================
// Reset Skor (New Match)
// ============================================
resetBtn.addEventListener('click', () => {
  if (!confirm('Reset semua skor & mulai match baru?')) return;
  
  state.players.forEach(p => p.score = 0);
  state.matchNumber++;
  saveState();
  renderArena();
  closeSetup();
  console.log('🔄 New match:', state.matchNumber);
});

// ============================================
// Test Vote (klik card untuk simulasi)
// ============================================
arena.addEventListener('click', (e) => {
  const card = e.target.closest('.player-card');
  if (!card) return;
  const id = parseInt(card.dataset.id);
  addVote(id, 'TestUser');
});

// ============================================
// Init
// ============================================
function init() {
  renderArena();
  console.log('🎯 Vote Arena ready');
  console.log('State:', state);
}

init();

// ============================================
// Task 2.4: Firebase Listener Integration
// ============================================

// Mapping command → player (case-insensitive)
function findPlayerByCommand(cmd) {
  if (!cmd) return null;
  const lower = cmd.toLowerCase().trim();
  return state.players.find(p => 
    p.name.toLowerCase() === lower ||
    lower.includes(p.name.toLowerCase())
  );
}

// Subscribe vote baru dari Firebase
function setupFirebaseListener() {
  if (typeof onNewVote !== 'function') {
    console.warn('⚠️ firebase.js belum loaded');
    return;
  }
  onNewVote((data) => {
    if (!data || !data.cmd) return;
    const player = findPlayerByCommand(data.cmd);
    if (player) {
      addVote(player.id, data.username || 'Viewer', data.isSuper, data.amount);
    } else {
      console.log('⚠️ Unknown command:', data.cmd);
    }
  });
  console.log('✅ Firebase vote listener active');
}

// Wire setelah DOM + firebase ready
window.addEventListener('load', () => {
  setTimeout(() => {
    if (typeof db !== 'undefined' && db) {
      setupFirebaseListener();
    } else {
      setTimeout(setupFirebaseListener, 1000);
    }
  }, 500);
});

// ============================================
// Sesi 3: Super Chat Popup + Sound
// ============================================

function sfxSuperChat() {
  // Fanfare mewah: C-E-G-C-E-G-C (2 oktaf)
  const notes = [523, 659, 784, 1047, 1319, 1568, 2093];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.3, 'triangle', 0.18), i * 90);
  });
}

function showSuperChatPopup(username, player, amount) {
  // Remove existing popup
  const old = document.getElementById('superPopup');
  if (old) old.remove();
  
  const popup = document.createElement('div');
  popup.id = 'superPopup';
  popup.style.setProperty('--player-color', player.color);
  
  const displayName = String(username || 'user').replace(/^@+/, '');
  
  popup.innerHTML = 
    '<div class="super-popup-inner">' +
      '<div class="super-popup-label">💰 SUPER CHAT</div>' +
      '<div class="super-popup-amount">' + escapeHtml(amount || 'SUPER') + '</div>' +
      '<div class="super-popup-user">@' + escapeHtml(displayName) + '</div>' +
      '<div class="super-popup-vote">→ ' + player.emoji + ' ' + escapeHtml(player.name) + ' (+5)</div>' +
    '</div>';
  
  document.body.appendChild(popup);
  
  // Auto-remove setelah 6 detik
  setTimeout(() => {
    popup.classList.add('fade-out');
    setTimeout(() => popup.remove(), 500);
  }, 6000);
  
  console.log('💰 Super popup shown for', displayName);
}


// ============================================
// Sesi 4.1: Winner Celebration + Confetti
// ============================================

function celebrateWinner(player) {
  // Trophy overlay
  showTrophyOverlay(player);
  // Confetti
  startConfetti();
  // Auto-reset setelah 10 detik
  setTimeout(() => {
    hideTrophyOverlay();
    stopConfetti();
    autoResetMatch();
  }, 10000);
}

function showTrophyOverlay(player) {
  const old = document.getElementById('trophyOverlay');
  if (old) old.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'trophyOverlay';
  overlay.style.setProperty('--winner-color', player.color);
  
  overlay.innerHTML = 
    '<div class="trophy-inner">' +
      '<div class="trophy-icon">🏆</div>' +
      '<div class="trophy-label">PEMENANG</div>' +
      '<div class="trophy-name">' + player.emoji + ' ' + escapeHtml(player.name) + '</div>' +
      '<div class="trophy-score">' + player.score + ' poin</div>' +
      '<div class="trophy-next">Match berikutnya dalam <span id="nextTimer">10</span>s...</div>' +
    '</div>';
  
  document.body.appendChild(overlay);
  
  // Countdown 10 → 0
  let count = 10;
  const timer = setInterval(() => {
    count--;
    const el = document.getElementById('nextTimer');
    if (el) el.textContent = count;
    if (count <= 0) clearInterval(timer);
  }, 1000);
}

function hideTrophyOverlay() {
  const o = document.getElementById('trophyOverlay');
  if (o) {
    o.classList.add('fade-out');
    setTimeout(() => o.remove(), 500);
  }
}

function autoResetMatch() {
  state.players.forEach(p => p.score = 0);
  state.matchNumber++;
  saveState();
  renderArena();
  voteFeed.innerHTML = '';
  console.log('🔄 Auto-reset untuk match #' + state.matchNumber);
}

// ============================================
// Confetti System (Canvas overlay)
// ============================================
let confettiAnim = null;
let confettiParticles = [];

function startConfetti() {
  stopConfetti();
  
  let canvas = document.getElementById('confettiCanvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'confettiCanvas';
    document.body.appendChild(canvas);
  }
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  
  // Generate particles
  confettiParticles = [];
  const colors = ['#fbbf24', '#ef4444', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];
  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 200,
      vx: (Math.random() - 0.5) * 4,
      vy: 2 + Math.random() * 4,
      size: 4 + Math.random() * 8,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3
    });
  }
  
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    confettiParticles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.rotation += p.rotSpeed;
      
      // Reset kalau jatuh keluar layar
      if (p.y > canvas.height + 20) {
        p.y = -20;
        p.x = Math.random() * canvas.width;
        p.vy = 2 + Math.random() * 4;
      }
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.5);
      ctx.restore();
    });
    
    confettiAnim = requestAnimationFrame(loop);
  }
  loop();
}

function stopConfetti() {
  if (confettiAnim) {
    cancelAnimationFrame(confettiAnim);
    confettiAnim = null;
  }
  const canvas = document.getElementById('confettiCanvas');
  if (canvas) canvas.remove();
  confettiParticles = [];
}
