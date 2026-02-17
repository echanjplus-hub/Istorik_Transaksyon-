import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, onValue, push, update } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyB1VTPakleoggsbLdpm_HS7nSb3A7A99Qw",
    authDomain: "echanj-plus-778cd.firebaseapp.com",
    databaseURL: "https://echanj-plus-778cd-default-rtdb.firebaseio.com",
    projectId: "echanj-plus-778cd",
    storageBucket: "echanj-plus-778cd.firebasestorage.app",
    messagingSenderId: "111144762929",
    appId: "1:111144762929:web:e64ce9a6da65781c289f10"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let activeUid = null;

// --- AUTH ---
document.getElementById('login-btn').onclick = () => {
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-pass').value;
    signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Erè Login"));
};

document.getElementById('logout-btn').onclick = () => signOut(auth);

onAuthStateChanged(auth, (user) => {
    if (user && user.uid === "i7f8bCxlYeQze5Ushz1zdhcEJ3B2") {
        document.getElementById('lock-screen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        initAdmin();
    } else {
        document.getElementById('lock-screen').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('hidden');
    }
});

// --- INIT PANEL ---
function initAdmin() {
    onValue(ref(db, 'users'), (snap) => {
        const list = document.getElementById('user-list');
        list.innerHTML = "";
        snap.forEach((child) => {
            const u = child.val();
            const uid = child.key;
            const tr = document.createElement('tr');
            
            const name = u.fullname || "Kliyan Senp";
            const balance = u.balance || 0;

            tr.innerHTML = `
                <td><b>${name}</b> <span id="dot-${uid}" class="hidden"></span><br><small>${u.email || 'Pa gen email'}</small></td>
                <td>${balance} G</td>
                <td><button class="edit-btn">✏️</button></td>
            `;

            // Lojik Alert (Pwen Vèt)
            onValue(ref(db, 'withdrawals'), (wSnap) => {
                wSnap.forEach(wDoc => {
                    if(wDoc.val().uid === uid) document.getElementById(`dot-${uid}`).className = "notif-dot";
                });
            });

            tr.querySelector('.edit-btn').onclick = (e) => {
                e.stopPropagation();
                const v = prompt("Nouvo balans:", balance);
                if(v) update(ref(db, `users/${uid}`), { balance: parseFloat(v) });
            };

            tr.onclick = () => {
                selectUser(uid, name);
                document.getElementById(`dot-${uid}`).className = "hidden";
            };
            list.appendChild(tr);
        });
    });
}

// --- SELECT USER & HISTORY ---
function selectUser(uid, name) {
    activeUid = uid;
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('client-details').classList.remove('hidden');
    document.getElementById('focus-name').innerText = name;
    document.getElementById('chat-with').innerText = name;

    onValue(ref(db, 'withdrawals'), (snap) => {
        const h = document.getElementById('tx-history');
        h.innerHTML = "<h3>Istorik Tranzaksyon</h3>";
        snap.forEach(child => {
            const t = child.val();
            if(t.uid === uid) {
                const card = document.createElement('div');
                card.className = 'tx-card';
                card.innerHTML = `<b>${t.method || 'Retrè'}</b>: ${t.amount || t.Kantite || 0} G<br><small>${t.date || ''}</small>`;
                card.onclick = () => openModal(t);
                h.appendChild(card);
            }
        });
    });
    loadChat(uid);
}

// --- MODAL DETAY ---
function openModal(t) {
    const body = document.getElementById('full-details-body');
    body.innerHTML = `
        <div class="detail-item"><b>Kliyan:</b> <span>${t.name || '---'}</span></div>
        <div class="detail-item"><b>Metòd:</b> <span>${t.method || '---'}</span></div>
        <div class="detail-item"><b>Kantite:</b> <span>${t.amount || t.Kantite || 0} G</span></div>
        <div class="detail-item"><b>Nimero:</b> <span>${t.phone || t.Nimero || '---'}</span></div>
        <div class="detail-item"><b>Dat:</b> <span>${t.date || '---'}</span></div>
    `;
    document.getElementById('details-modal').classList.remove('hidden');
}

document.querySelector('.close-modal').onclick = () => document.getElementById('details-modal').classList.add('hidden');

// --- CHAT ---
function loadChat(uid) {
    onValue(ref(db, `messages/${uid}`), (snap) => {
        const b = document.getElementById('chat-body');
        b.innerHTML = "";
        snap.forEach(c => {
            const m = c.val();
            b.innerHTML += `<div class="msg ${m.sender === 'admin' ? 'me' : 'client'}">${m.text}</div>`;
        });
        b.scrollTop = b.scrollHeight;
    });
}

document.getElementById('send-msg').onclick = () => {
    const txt = document.getElementById('chat-input').value;
    if(txt && activeUid) {
        push(ref(db, `messages/${activeUid}`), { text: txt, sender: 'admin' });
        document.getElementById('chat-input').value = "";
    }
};

document.getElementById('toggle-chat').onclick = () => document.getElementById('chat-widget').classList.toggle('chat-closed');
setInterval(() => { document.getElementById('live-clock').innerText = new Date().toLocaleTimeString(); }, 1000);
                
