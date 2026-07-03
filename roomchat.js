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

// Variabel Global
let currentUserId = null;
let currentUserName = "Anonim";
let activeReply = null; 
let firestoreMessages = []; 
let localUploads = []; 

const chatBox = document.getElementById('chat-box');
const msgInput = document.getElementById('msg-input');
const btnSend = document.getElementById('btn-send');

// Modal Welcome
function showWelcomeModal() {
    if (!sessionStorage.getItem('chatWarningShown')) {
        document.getElementById('welcome-modal').classList.add('active');
        sessionStorage.setItem('chatWarningShown', 'true');
    }
}
function closeWelcomeModal() { document.getElementById('welcome-modal').classList.remove('active'); }

// Modal Polling
function openPollModal() { document.getElementById('poll-modal').classList.add('active'); lucide.createIcons(); }
function closePollModal() {
    document.getElementById('poll-modal').classList.remove('active');
    document.getElementById('poll-question-input').value = "";
    document.getElementById('poll-multi-select').checked = false; 
    document.getElementById('poll-options-container').innerHTML = `
        <input type="text" class="poll-opt-field" placeholder="Opsi 1">
        <input type="text" class="poll-opt-field" placeholder="Opsi 2">
    `;
}
function addPollOptionField() {
    const container = document.getElementById('poll-options-container');
    const input = document.createElement('input');
    input.type = "text";
    input.className = "poll-opt-field";
    input.placeholder = `Opsi ${container.children.length + 1}`;
    container.appendChild(input);
}

// Modal Modul Materi
async function openModuleModal() {
    const container = document.getElementById('module-list-container');
    container.innerHTML = `
        <div style="text-align:center; padding: 20px; color: var(--gray-500);">
            <i data-lucide="loader-2" class="spin-icon" style="margin-bottom: 8px;"></i>
            <p style="font-size: 0.85rem;">Memuat daftar modul...</p>
        </div>
    `;
    document.getElementById('module-modal').classList.add('active');
    lucide.createIcons();

    try {
        const snapshot = await db.collection("isi_modul").get();
        container.innerHTML = ""; // Bersihkan loading

        if (snapshot.empty) {
            container.innerHTML = `<p style="text-align:center; font-size: 0.85rem; color: var(--gray-500);">Belum ada modul yang tersedia di database.</p>`;
            return;
        }

        snapshot.forEach(doc => {
            const mod = doc.data();
            const safeTitle = (mod.judul || "Tanpa Judul").replace(/'/g, "\\'");
            const safeDesc = (mod.deskripsi_singkat || "").replace(/'/g, "\\'");

            container.innerHTML += `
                <div class="module-item" onclick="shareModule('${doc.id}', '${safeTitle}', '${safeDesc}')">
                    <div class="module-item-icon"><i data-lucide="file-text" style="width:24px;height:24px;"></i></div>
                    <div class="module-item-info">
                        <div class="module-item-title">${mod.judul}</div>
                        <div class="module-item-desc">${mod.deskripsi_singkat || 'Klik untuk membagikan modul ini'}</div>
                    </div>
                </div>
            `;
        });
        lucide.createIcons();
    } catch (error) {
        console.error("Gagal memuat daftar modul:", error);
        container.innerHTML = `<p style="text-align:center; font-size: 0.85rem; color: #ef4444;">Gagal memuat modul. Periksa koneksi Anda.</p>`;
    }
}

function closeModuleModal() { document.getElementById('module-modal').classList.remove('active'); }

// 1. Ambil Data Akun (DIUBAH KE ALAMAT EMAIL)
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        
        // --- LOGIKA MENGAMBIL EMAIL ---
        if (user.email) {
            // Jika ada email, gunakan email dan hapus teks @gmail.com
            currentUserName = user.email.replace('@gmail.com', '');
        } else {
            // Fallback jika karena alasan tertentu email tidak ada
            currentUserName = user.displayName || "Petani";
        }
        
        const displayElement = document.getElementById('display-nama-user');
        if (displayElement) {
            let shortName = currentUserName.split(" ")[0]; 
            if (shortName.length > 10) shortName = shortName.substring(0, 10) + "...";
            displayElement.innerText = shortName;
        }

        showWelcomeModal(); 
        loadRealtimeChat();
    } else {
        alert("Silakan login terlebih dahulu.");
        window.location.href = "index.html"; 
    }
});

// 2. Sinkronisasi Data Firestore
function loadRealtimeChat() {
    db.collection("chat_global").orderBy("waktu", "asc").onSnapshot((snapshot) => {
        firestoreMessages = [];
        snapshot.forEach((doc) => {
            firestoreMessages.push({ id: doc.id, ...doc.data() });
        });
        renderAllMessages();
    });
}

// 3. Render Percakapan
function renderAllMessages() {
    chatBox.innerHTML = ''; 
    
    if (firestoreMessages.length === 0 && localUploads.length === 0) {
        chatBox.innerHTML = '<div class="loading-chat">Belum ada percakapan. Mulai obrolan Anda!</div>';
        return;
    }

    firestoreMessages.forEach(msg => chatBox.appendChild(createMessageElement(msg, false)));
    localUploads.forEach(msg => chatBox.appendChild(createMessageElement(msg, true)));

    lucide.createIcons(); 
    chatBox.scrollTop = chatBox.scrollHeight;
}

// 4. Proses Desain Balon Percakapan
function createMessageElement(data, isLocalUpload) {
    const isSelf = isLocalUpload || data.userId === currentUserId;
    let timeString = data.waktu ? data.waktu.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "Memuat...";

    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${isSelf ? 'msg-self' : 'msg-other'}`;

    let replyHtml = "";
    if (data.replyTo) {
        replyHtml = `
            <div class="replied-box">
                <div class="reply-name">${data.replyTo.namaUser}</div>
                <div class="reply-text">${data.replyTo.pesan}</div>
            </div>`;
    }

    let deleteBtnHtml = (isSelf && !isLocalUpload) 
        ? `<button class="btn-delete-msg" onclick="window.deleteMessage('${data.id}')" title="Hapus"><i data-lucide="trash-2" style="width:14px; height:14px;"></i></button>` 
        : '';

    // --- LOGIKA TIPE PERCAKAPAN: MODUL MATERI ---
    if (data.type === "module") {
        const targetUrl = `baca-modul.html?id=${data.moduleId}`; 

        wrapper.innerHTML = `
            <div class="message-sender">${data.namaUser}</div>
            <div class="message-bubble" style="width: 100%; max-width: 100%;">
                ${replyHtml}
                <div class="module-box">
                    <div class="module-box-header">
                        <div class="module-box-icon"><i data-lucide="book-open" style="width:24px;height:24px;"></i></div>
                        <div>
                            <div class="module-box-title">${data.moduleTitle}</div>
                            <div class="module-box-desc">${data.moduleDesc}</div>
                        </div>
                    </div>
                    <a href="${targetUrl}" class="btn-read-module">Baca Modul</a>
                </div>
                <div class="message-footer">
                    <div class="message-time" style="margin-right:auto;">${timeString}</div>
                    ${deleteBtnHtml}
                </div>
            </div>`;
        return wrapper;
    }

    // --- LOGIKA TIPE PERCAKAPAN: POLLING ---
    if (data.type === "poll") {
        let optionsHtml = "";
        let totalVotes = 0;
        data.pollOptions.forEach(opt => { totalVotes += (data.votes && data.votes[opt] ? data.votes[opt].length : 0); });

        data.pollOptions.forEach(opt => {
            const arr = data.votes && data.votes[opt] ? data.votes[opt] : [];
            const voteCount = arr.length;
            const pct = totalVotes > 0 ? (voteCount / totalVotes) * 100 : 0;
            const hasVoted = arr.includes(currentUserId);
            let votersNames = [];
            arr.forEach(uid => { if (data.voterNames && data.voterNames[uid]) votersNames.push(data.voterNames[uid]); });
            
            optionsHtml += `
                <div class="poll-option-item ${hasVoted ? 'voted' : ''}" onclick="window.handleVote('${data.id}', '${opt.replace(/'/g, "\\'")}')">
                    <div class="poll-progress-bar" style="width: ${pct}%"></div>
                    <div class="poll-option-header"><span>${opt}</span><span>${voteCount} suara</span></div>
                    <div class="poll-voters-list">${votersNames.length > 0 ? `👉 ${votersNames.join(", ")}` : "Belum ada pemilih"}</div>
                </div>`;
        });

        wrapper.innerHTML = `
            <div class="message-sender">${data.namaUser}</div>
            <div class="message-bubble" style="width: 100%; max-width: 100%;">
                ${replyHtml}
                <div class="poll-box">
                    <span class="poll-question">📊 ${data.pollQuestion}</span>
                    <span class="poll-type-badge">${data.allowMultiple ? "Pilihan Ganda" : "Pilihan Tunggal"}</span>
                    ${optionsHtml}
                </div>
                <div class="message-footer"><div class="message-time" style="margin-right:auto;">${timeString}</div>${deleteBtnHtml}</div>
            </div>`;
        return wrapper;
    }

    // --- LOGIKA TIPE PERCAKAPAN: MEDIA (GAMBAR/VIDEO) ---
    let mediaHtml = "";
    if (data.fileUrl) {
        let mediaTag = data.fileType === "video" 
            ? `<video ${!isLocalUpload ? 'controls' : ''} class="chat-video"><source src="${data.fileUrl}"></video>` 
            : `<img src="${data.fileUrl}" class="chat-media">`;

        mediaHtml = isLocalUpload 
            ? `<div class="media-container">${mediaTag}<div class="upload-overlay"><i data-lucide="loader-2" class="upload-spinner"></i></div></div>`
            : (data.fileType === "video" ? mediaTag : `<a href="${data.fileUrl}" target="_blank">${mediaTag}</a>`);
    }

    let textHtml = data.pesan ? `<span>${data.pesan}</span>` : "";
    let rawText = data.pesan || (data.fileType === 'video' ? '📹 Video' : '📷 Gambar');

    wrapper.innerHTML = `
        <div class="message-sender">${data.namaUser}</div>
        <div class="message-bubble">
            ${replyHtml}
            ${mediaHtml}
            ${textHtml}
            <div class="message-footer">
                <div class="message-time" style="margin-right:auto;">${timeString}</div>
                ${deleteBtnHtml}
                ${!isLocalUpload ? `<button class="btn-reply-msg" title="Balas"><i data-lucide="reply" style="width:14px; height:14px;"></i></button>` : ''}
            </div>
        </div>`;

    if (!isLocalUpload) wrapper.querySelector('.btn-reply-msg').addEventListener('click', () => setupReply(data.namaUser, rawText));
    return wrapper;
}

// 5. Setup Reply & Delete
function setupReply(nama, pesan) {
    activeReply = { namaUser: nama, pesan: pesan };
    document.getElementById('reply-name').innerText = `Membalas ${nama}`;
    document.getElementById('reply-text').innerText = pesan;
    document.getElementById('reply-banner').style.display = 'flex';
    msgInput.focus();
}
function cancelReply() { activeReply = null; document.getElementById('reply-banner').style.display = 'none'; }

window.deleteMessage = async function(docId) {
    if (confirm("Hapus pesan ini?")) {
        try { await db.collection("chat_global").doc(docId).delete(); } 
        catch (error) { console.error(error); alert("Gagal menghapus pesan."); }
    }
};

// 6. Fungsi Membagikan Modul ke Chat
window.shareModule = async function(moduleId, title, desc) {
    closeModuleModal();
    const currentReply = activeReply; 
    cancelReply();

    try {
        await db.collection("chat_global").add({
            userId: currentUserId,
            namaUser: currentUserName,
            type: "module",
            moduleId: moduleId, 
            moduleTitle: title,
            moduleDesc: desc,
            waktu: firebase.firestore.FieldValue.serverTimestamp(),
            replyTo: currentReply
        });
    } catch (error) {
        console.error("Gagal mengirim modul:", error);
    }
}

// 7. Pengiriman Teks & Polling & File Upload
async function sendMessage() {
    const teksPesan = msgInput.value.trim();
    if (teksPesan === "") return;
    btnSend.disabled = true; msgInput.value = ""; 
    const currentReply = activeReply; cancelReply();
    try {
        await db.collection("chat_global").add({
            userId: currentUserId, namaUser: currentUserName, pesan: teksPesan,
            fileUrl: null, waktu: firebase.firestore.FieldValue.serverTimestamp(), replyTo: currentReply
        });
    } catch (error) { console.error(error); } finally { btnSend.disabled = false; msgInput.focus(); }
}

async function submitPoll() {
    const question = document.getElementById('poll-question-input').value.trim();
    const fields = document.getElementsByClassName('poll-opt-field');
    const allowMultiple = document.getElementById('poll-multi-select').checked; 
    let options = [];
    for (let f of fields) if (f.value.trim() !== "") options.push(f.value.trim());
    if (!question || options.length < 2) return alert("Isi pertanyaan & minimal 2 opsi!");
    let defaultVotes = {}; options.forEach(opt => { defaultVotes[opt] = []; });
    try {
        await db.collection("chat_global").add({
            userId: currentUserId, namaUser: currentUserName, type: "poll",
            pollQuestion: question, pollOptions: options, allowMultiple: allowMultiple,
            votes: defaultVotes, voterNames: {}, waktu: firebase.firestore.FieldValue.serverTimestamp(), replyTo: null
        });
        closePollModal();
    } catch (error) { console.error(error); }
}

window.handleVote = async function(docId, optionText) {
    if (!docId) return;
    const docRef = db.collection("chat_global").doc(docId);
    try {
        const doc = await docRef.get(); if (!doc.exists) return;
        const data = doc.data();
        let votes = data.votes || {}; let voterNames = data.voterNames || {};
        const allowMultiple = data.allowMultiple || false;
        data.pollOptions.forEach(opt => { if (!votes[opt]) votes[opt] = []; });
        let userSudahMemilih = votes[optionText].includes(currentUserId);

        if (!allowMultiple) {
            if (userSudahMemilih) votes[optionText] = votes[optionText].filter(uid => uid !== currentUserId);
            else {
                data.pollOptions.forEach(opt => { votes[opt] = votes[opt].filter(uid => uid !== currentUserId); });
                votes[optionText].push(currentUserId); voterNames[currentUserId] = currentUserName;
            }
        } else {
            if (userSudahMemilih) votes[optionText] = votes[optionText].filter(uid => uid !== currentUserId);
            else { votes[optionText].push(currentUserId); voterNames[currentUserId] = currentUserName; }
        }
        await docRef.update({ votes: votes, voterNames: voterNames });
    } catch (error) { console.error(error); }
};

async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) return alert("Maksimal ukuran file 10MB.");
    const fileType = file.type.startsWith("video") ? "video" : "image";
    const previewUrl = URL.createObjectURL(file); 
    const uploadId = Date.now().toString(); 
    const currentReply = activeReply; cancelReply();
    localUploads.push({ id: uploadId, fileUrl: previewUrl, fileType: fileType, namaUser: currentUserName, replyTo: currentReply });
    renderAllMessages(); event.target.value = ""; 
    const cloudName = "gxhjeysb"; const uploadPreset = "farmguide"; 
    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const formData = new FormData(); formData.append("file", file); formData.append("upload_preset", uploadPreset);
    try {
        const response = await fetch(cloudinaryUrl, { method: "POST", body: formData });
        const data = await response.json(); if (!response.ok) throw new Error("Gagal upload");
        await db.collection("chat_global").add({
            userId: currentUserId, namaUser: currentUserName, pesan: "", 
            fileUrl: data.secure_url, fileType: fileType, waktu: firebase.firestore.FieldValue.serverTimestamp(), replyTo: currentReply
        });
    } catch (error) { console.error(error); alert("Gagal mengunggah file. Pastikan Preset Cloudinary Anda Unsigned.");
    } finally { localUploads = localUploads.filter(u => u.id !== uploadId); renderAllMessages(); }
}

btnSend.addEventListener('click', sendMessage);
msgInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });
document.getElementById('input-gallery').addEventListener('change', handleFileUpload);
document.getElementById('input-camera').addEventListener('change', handleFileUpload);




// --- FITUR MENU DROPDOWN ---
function toggleMenu(menuId) {
    document.getElementById(menuId).classList.toggle("show");
}

// Tutup menu jika user mengklik di luar area menu
window.onclick = function(event) {
    if (!event.target.closest('.menu-btn')) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}