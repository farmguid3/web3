// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCOdMX5y27KYI-Sko82wUV89AzG8yJSMxY",
    authDomain: "farmguide-62827.firebaseapp.com",
    projectId: "farmguide-62827",
    messagingSenderId: "407792688035",
    appId: "1:407792688035:web:d21abc766dc4589fe11816"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();
lucide.createIcons();

let currentUserId = null;
let allUsers = [];
let unreadListeners = {}; 

const contactList = document.getElementById('contact-list');
const searchInput = document.getElementById('search-input');

// 1. Cek Login Pengguna
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        loadUsers();
    } else {
        alert("Silakan login terlebih dahulu.");
        window.location.href = "index.html";
    }
});

// 2. Ambil Daftar Pengguna Dasar dari Firestore
async function loadUsers() {
    try {
        const snapshot = await db.collection("users").get();
        allUsers = [];

        snapshot.forEach(doc => {
            const userData = doc.data();
            
            if (doc.id !== currentUserId) {
                let emailAsli = userData.email || "";
                let emailTanpaGmail = emailAsli.replace("@gmail.com", "");

                allUsers.push({
                    uid: doc.id,
                    nama: userData.id_user_nama || "Pengguna Tanpa Nama",
                    email: emailTanpaGmail,
                    role: userData.role || "Petani",
                    unreadCount: 0,
                    lastMessageTime: new Date(0) // Default waktu chat terlama agar yang belum dichat ada di bawah
                });
            }
        });

        // Hubungkan ke pemantau realtime pesan masuk/keluar untuk sorting otomatis
        attachRoomListeners();
        
    } catch (error) {
        console.error("Gagal memuat pengguna:", error);
        contactList.innerHTML = `<div class="empty-state"><p style="color: #ef4444;">Gagal memuat data pengguna.</p></div>`;
    }
}

// 3. Hubungkan Pemantau Pesan Realtime ke Setiap Room Chat
function attachRoomListeners() {
    // Bersihkan listener lama jika ada
    Object.keys(unreadListeners).forEach(key => unreadListeners[key]());
    unreadListeners = {};

    allUsers.forEach(user => {
        const roomId = currentUserId < user.uid ? `${currentUserId}_${user.uid}` : `${user.uid}_${currentUserId}`;
        
        // Pantau sub-koleksi messages diurutkan dari yang paling baru
        unreadListeners[user.uid] = db.collection("private_chats").doc(roomId).collection("messages")
            .orderBy("waktu", "desc")
            .onSnapshot(snapshot => {
                let unreadCount = 0;
                let lastTime = null;

                snapshot.forEach(doc => {
                    const msgData = doc.data();
                    // Hitung jumlah pesan masuk dari lawan bicara yang belum dibaca
                    if (msgData.userId === user.uid && msgData.isRead === false) {
                        unreadCount++;
                    }
                });

                if (!snapshot.empty) {
                    const latestMsg = snapshot.docs[0].data();
                    // Ambil waktu dari pesan paling baru (bisa berupa pesan masuk maupun pesan keluar kita)
                    lastTime = latestMsg.waktu ? latestMsg.waktu.toDate() : new Date();
                }

                // Perbarui data objek user bersangkutan di array lokal
                user.unreadCount = unreadCount;
                user.lastMessageTime = lastTime || new Date(0);

                // Jalankan sorting dan render ulang secara otomatis setiap ada aktivitas chat baru
                sortAndRenderUsers();
            }, error => {
                console.log("Gagal memantau aktivitas room: ", roomId, error);
            });
    });
}

// 4. Urutkan Pengguna (Chat Terbaru Paling Atas) & Tampilkan ke HTML
function sortAndRenderUsers() {
    const keyword = searchInput.value.toLowerCase();
    
    // Filter berdasarkan kolom pencarian terlebih dahulu jika diisi
    let filteredUsers = allUsers.filter(user => 
        user.nama.toLowerCase().includes(keyword) || 
        user.email.toLowerCase().includes(keyword)
    );

    // LOGIKA UTAMA: Urutkan dari chat yang memiliki waktu paling baru (descending)
    filteredUsers.sort((a, b) => {
        const timeA = a.lastMessageTime.getTime();
        const timeB = b.lastMessageTime.getTime();
        
        if (timeB !== timeA) {
            return timeB - timeA; // Pesan terbaru melompat paling atas
        }
        return a.nama.localeCompare(b.nama); // Jika sama-sama belum pernah chat, urutkan abjad nama
    });

    // Render HTML ke halaman list chat
    contactList.innerHTML = '';

    if (filteredUsers.length === 0) {
        contactList.innerHTML = `<div class="empty-state"><p>Tidak ada pengguna lain ditemukan.</p></div>`;
        return;
    }

    filteredUsers.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'contact-item';
        const initial = user.nama.charAt(0).toUpperCase();

        // Tampilkan/sembunyikan badge berdasarkan ada tidaknya unreadCount
        const badgeStyle = user.unreadCount > 0 ? "display: flex;" : "display: none;";

        userItem.innerHTML = `
            <div class="contact-avatar">${initial}</div>
            <div class="contact-info">
                <div class="contact-name">${user.nama}</div>
                <div class="contact-email">${user.email}</div>
                <div class="contact-role">${user.role}</div>
            </div>
            <div class="contact-meta">
                <div class="unread-badge" id="badge-${user.uid}" style="${badgeStyle}">${user.unreadCount}</div>
                <button class="btn-chat" onclick="openChat('${user.uid}', '${user.nama}')" title="Chat dengan ${user.nama}">
                    <i data-lucide="message-circle"></i>
                </button>
            </div>
        `;
        contactList.appendChild(userItem);
    });

    lucide.createIcons();
}

// 5. Fitur Pencarian Dinamis
searchInput.addEventListener('input', sortAndRenderUsers);

// 6. Redirect ke halaman Private Chat
window.openChat = function(uid, nama) {
    window.location.href = `privatechat.html?uid=${uid}&name=${encodeURIComponent(nama)}`;
}







