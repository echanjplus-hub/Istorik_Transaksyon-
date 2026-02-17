import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase, ref, onValue, update, push } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

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

// --- KONEKSYON ---
const loginBtn = document.getElementById('login-btn');
if(loginBtn) {
    loginBtn.onclick = () => {
        const email = document.getElementById('admin-email').value;
        const pass = document.getElementById('admin-pass').value;
        signInWithEmailAndPassword(auth, email, pass).catch(err => alert("Erè: " + err.message));
    };
}

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
    // Rale tout itilizatè yo
    onValue(ref(db, 'users'), (snap) => {
        const list = document.getElementById('user-list');
        list.innerHTML = "";
        snap.forEach((child) => {
            const u = child.val();
            const uid = child.key;
            const tr = document.createElement('tr');
            
            // Si fullname pa la, sèvi ak email oswa 'Itilizatè'
            const name = u.fullname || u.email || "Itilizatè " + uid.substring(0,4);

            tr.innerHTML = `
                <td>
                    <b>${name}</b> <span id="dot-${uid}" class="hidden"></span>
                    <br><small>${u.email || 'Pa gen email'}</small>
                </td>
                <td>${u.balance || 0} G</td>
                <td><button class="edit-btn">✏️</button></td>
            `;

            // Pwen vèt Notifikasyon
            onValue(ref(db, 'withdrawals'), (wSnap) => {
                wSnap.forEach(wDoc => {
                    if(wDoc.val().uid === uid) document.getElementById(`dot-${uid}`).className = "notif-dot";
                });
            });

            tr.onclick = () => {
                selectUser(uid, name);
                document.getElementById(`dot-${uid}`).className = "hidden";
            };
            list.appendChild(tr);
        });
    });
}

// --- SELEKSYON KLIYAN ---
function selectUser(uid, name) {
    activeUid = uid;
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('client-details').classList.remove('hidden');
    document.getElementById('focus-name').innerText = name;
    document.getElementById('chat-with').innerText = name;

    onValue(ref(db, 'withdrawals'), (snap) => {
        const h = document.getElementById('tx-history');
        h.innerHTML = "<h3>Istorik Tranzaksyon</h3>";
        let found = false;
        snap.forEach(child => {
            const t = child.val();
            if(t.uid === uid) {
                found = true;
                const card = document.createElement('div');
                card.className = 'tx-card';
                // Ranje undefined: tcheke amount OSWA Kantite
                const mantiye = t.amount || t.Kantite || 0;
                card.innerHTML = `
                    <b>${t.method || 'Tranzaksyon'}</b>: ${mantiye} G<br>
                    <small>${t.date || ''}</small>
                `;
                card.onclick = () => openModal(t);
                h.appendChild(card);
            }
        });
        if(!found) h.innerHTML += "<p>Pa gen tranzaksyon.</p>";
    });
    loadChat(uid);
}

// --- MODAL DETAY ---
function openModal(t) {
    const body = document.getElementById('full-details-body');
    body.innerHTML = `
        <div class="detail-item"><b>Non:</b> <span>${t.name || '---'}</span></div>
        <div class="detail-item"><b>Metòd:</b> <span>${t.method || '---'}</span></div>
        <div class="detail-item"><b>Kantite:</b> <span>${t.amount || t.Kantite || 0} G</span></div>
        <div class="detail-item"><b>Nimero:</b> <span>${t.phone || t.Nimero || '---'}</span></div>
        <div class="detail-item"><b>Dat:</b> <span>${t.date || '---'}</span></div>
    `;
    document.getElementById('details-modal').classList.remove('hidden');
}

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
        push(ref(db, `messages/${activeUid}`), { text: txt, sender: 'admin', time: Date.now() });
        document.getElementById('chat-input').value = "";
    }
};

document.querySelector('.close-modal').onclick = () => document.getElementById('details-modal').classList.add('hidden');
document.getElementById('toggle-chat').onclick = () => document.getElementById('chat-widget').classList.toggle('chat-closed');
setInterval(() => { 
    if(document.getElementById('live-clock')) {
        document.getElementById('live-clock').innerText = new Date().toLocaleTimeString(); 
    }
}, 1000);
