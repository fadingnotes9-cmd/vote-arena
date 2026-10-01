// ============================================
// Firebase Helper - Vote Arena
// ============================================
// Baca list vote dari Firebase, kirim ke app.js

const DB_PATH = 'votes';
let db = null;

function initFirebase() {
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK belum di-load');
        return false;
    }
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    console.log('✅ Firebase initialized');
    return true;
}

// Push vote ke database (dari Node listener)
async function pushVote(cmd, username) {
    if (!db) return null;
    const ref = db.ref(DB_PATH).push();
    await ref.set({
        cmd: cmd,       // 'ronaldo' | 'messi'
        username: username,
        timestamp: Date.now()
    });
    return ref.key;
}

// Subscribe vote baru (untuk UI game)
function onNewVote(callback) {
    if (!db) return;
    db.ref(DB_PATH).on('child_added', (snapshot) => {
        const data = snapshot.val();
        console.log('📥 New vote:', data);
        callback(data, snapshot.key);
    });
}

// Hapus semua votes (reset match)
async function clearVotes() {
    if (!db) return;
    await db.ref(DB_PATH).remove();
    console.log('🗑️ Votes cleared');
}

// Status dot
function testConnection() {
    if (!db) return;
    db.ref('.info/connected').on('value', (snap) => {
        const dot = document.getElementById('fbStatus');
        if (!dot) return;
        if (snap.val() === true) {
            dot.textContent = '🔥';
            dot.title = 'Firebase connected';
        } else {
            dot.textContent = '⚠️';
            dot.title = 'Firebase disconnected';
        }
    });
}

// Auto-init
window.addEventListener('DOMContentLoaded', () => {
    if (initFirebase()) {
        testConnection();
    }
});
