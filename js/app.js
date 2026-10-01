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
function addVote(playerId, username) {
  const p = state.players.find(x => x.id === playerId);
  if (!p) return false;
  
  // Cek sudah menang
  if (state.players.some(x => x.score >= state.target)) return false;
  
  p.score++;
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
  addFeedItem(username, p);
  
  // Sound
  sfxVote();
  
  // Cek winner
  if (p.score >= state.target) {
    setTimeout(() => {
      sfxWin();
      renderArena();
    }, 300);
  } else {
    updateTopBar();
  }
  
  return true;
}

// ============================================
// Vote Feed
// ============================================
function addFeedItem(username, player) {
  const item = document.createElement('div');
  item.className = 'vote-item';
  item.style.setProperty('--item-color', player.color);
  item.innerHTML = '<strong>@' + escapeHtml(username || 'user') + '</strong> → ' + 
                   player.emoji + ' ' + escapeHtml(player.name);
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
