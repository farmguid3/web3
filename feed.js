// --- KONFIGURASI FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyCOdMX5y27KYI-Sko82wUV89AzG8yJSMxY",
    authDomain: "farmguide-62827.firebaseapp.com",
    projectId: "farmguide-62827",
    messagingSenderId: "407792688035",
    appId: "1:407792688035:web:d21abc766dc4589fe11816"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
lucide.createIcons();

let currentUserId = null;
let currentUserName = "Petani";
let uploadedLocalFiles = [];
let allPostsData = []; // Simpan data postingan secara global

// DOM Elements
const feedScroller = document.getElementById('feed-scroller');
const profileScroller = document.getElementById('profile-scroller');
const uploadModal = document.getElementById('upload-modal');
const inputMediaFiles = document.getElementById('input-media-files');
const mediaPreviewBox = document.getElementById('media-preview-box');
const postCaption = document.getElementById('post-caption');
const btnSubmitPost = document.getElementById('btn-submit-post');

// 1. Cek Login User
auth.onAuthStateChanged(user => {
    if (user) {
        currentUserId = user.uid;
        currentUserName = user.displayName || "Petani";
        
        // Update Info di Header My Profile
        document.getElementById('prof-avatar-big').innerText = currentUserName.charAt(0).toUpperCase();
        document.getElementById('prof-name-big').innerText = currentUserName;
        
        listenRealtimeFeed();
    } else {
        alert("Sesi tidak ditemukan. Silakan login terlebih dahulu.");
        window.location.href = "index.html";
    }
});

// 2. Sistem Tab Navigasi Bawah
// 2. Sistem Tab Navigasi Bawah
window.switchTab = function(tabName, btnElement) {
    // Ubah UI Tombol Aktif
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
    btnElement.classList.add('active');

    // Sembunyikan semua tab
    document.getElementById('tab-home').style.display = "none";
    document.getElementById('tab-profile').style.display = "none";

    // Munculkan tab yang dipilih dengan mode BLOCK agar scroll bekerja
    if (tabName === 'home') {
        document.getElementById('tab-home').style.display = "block"; // Diubah menjadi block
        document.getElementById('header-title').innerText = "Komunitas Petani";
    } else if (tabName === 'profile') {
        document.getElementById('tab-profile').style.display = "block"; // Diubah menjadi block
        document.getElementById('header-title').innerText = "Profil Saya";
    }
}

// 3. Sistem Upload (Modal, Preview, Simpan)
document.getElementById('btn-open-upload').addEventListener('click', () => uploadModal.classList.add('active'));
document.getElementById('btn-close-upload').addEventListener('click', resetUploadForm);

function resetUploadForm() {
    uploadModal.classList.remove('active');
    uploadedLocalFiles = [];
    mediaPreviewBox.innerHTML = "";
    mediaPreviewBox.style.display = "none";
    postCaption.value = "";
}

inputMediaFiles.addEventListener('change', (e) => {
    uploadedLocalFiles = Array.from(e.target.files);
    mediaPreviewBox.innerHTML = "";
    if (uploadedLocalFiles.length === 0) {
        mediaPreviewBox.style.display = "none"; return;
    }
    mediaPreviewBox.style.display = "flex";
    uploadedLocalFiles.forEach(file => {
        const url = URL.createObjectURL(file);
        mediaPreviewBox.innerHTML += file.type.startsWith('video/') ? `<video src="${url}"></video>` : `<img src="${url}">`;
    });
});

btnSubmitPost.addEventListener('click', async () => {
    const captionText = postCaption.value.trim();
    if (!captionText && uploadedLocalFiles.length === 0) return alert("Isi deskripsi atau pilih foto!");

    btnSubmitPost.innerText = "Membagikan...";
    btnSubmitPost.disabled = true;

    try {
        let mediaCollection = [];
        if (uploadedLocalFiles.length > 0) {
            const cloudName = "gxhjeysb"; // Pastikan sudah sesuai
            const uploadPromises = uploadedLocalFiles.map(async (file) => {
                const formData = new FormData();
                formData.append("file", file); formData.append("upload_preset", "farmguide");
                const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body: formData });
                const data = await res.json();
                return { url: data.secure_url, type: file.type.startsWith('video/') ? 'video' : 'image' };
            });
            mediaCollection = await Promise.all(uploadPromises);
        }

        await db.collection('community_posts').add({
            userId: currentUserId, userName: currentUserName, caption: captionText,
            mediaList: mediaCollection, likesCount: 0, likedBy: [], comments: [],
            waktu: firebase.firestore.FieldValue.serverTimestamp()
        });
        resetUploadForm();
    } catch (error) {
        alert("Gagal mengunggah postingan."); console.error(error);
    } finally {
        btnSubmitPost.innerText = "Bagikan"; btnSubmitPost.disabled = false;
    }
});

// 4. Sinkronisasi Data Firestore (Home & Profile)
function listenRealtimeFeed() {
    db.collection('community_posts').orderBy('waktu', 'desc').onSnapshot(snapshot => {
        allPostsData = [];
        let myPostsCount = 0;

        snapshot.forEach(doc => {
            const data = doc.data();
            allPostsData.push({ id: doc.id, ...data });
            if (data.userId === currentUserId) myPostsCount++;
        });

        document.getElementById('stat-posts').innerText = myPostsCount;
        
        renderHomeFeed();
        renderProfileFeed();
    });
}

// Render Generator Template Kartu HTML
function createPostCardHTML(post) {
    const isMyPost = post.userId === currentUserId;
    const formatTime = post.waktu ? post.waktu.toDate().toLocaleDateString('id-ID', {day: 'numeric', month: 'short'}) : "Baru saja";
    const avatar = post.userName.charAt(0).toUpperCase();

    // Render Hapus Button jika itu postingan milik user
    const deleteBtnHtml = isMyPost 
        ? `<button class="btn-delete-post" onclick="window.deletePost('${post.id}')" title="Hapus"><i data-lucide="trash-2" style="width: 18px; height: 18px;"></i></button>`
        : '';

    // Render Media Swipe
    let mediaSection = "";
    if (post.mediaList && post.mediaList.length > 0) {
        mediaSection = `<div class="post-media-slider">`;
        post.mediaList.forEach(m => {
            mediaSection += m.type === 'video' ? `<video src="${m.url}" class="slider-item" controls></video>` : `<img src="${m.url}" class="slider-item" loading="lazy">`;
        });
        mediaSection += `</div>`;
        if (post.mediaList.length > 1) mediaSection += `<div class="swipe-indicator">Geser melihat foto lainnya ➔</div>`;
    }

    // Render Komentar
    let commentsHtml = "";
    if (post.comments && post.comments.length > 0) {
        post.comments.forEach(c => { commentsHtml += `<p class="comment-item"><strong>${c.nama}</strong>${c.teks}</p>`; });
    }

    const userSudahLike = post.likedBy && post.likedBy.includes(currentUserId);

    return `
        <div class="post-card">
            <div class="post-card-header">
                <div class="post-user-info">
                    <div class="post-user-avatar">${avatar}</div>
                    <div><h5 class="post-user-name">${post.userName}</h5><p class="post-meta-time">${formatTime}</p></div>
                </div>
                ${deleteBtnHtml}
            </div>
            
            ${mediaSection}

            <div class="post-action-panel">
                <button class="btn-feed-action ${userSudahLike ? 'liked' : ''}" onclick="window.toggleLike('${post.id}')">
                    <i data-lucide="heart" style="fill: ${userSudahLike ? '#e11d48' : 'none'}"></i> ${post.likesCount || 0}
                </button>
                <button class="btn-feed-action"><i data-lucide="message-circle"></i> ${post.comments ? post.comments.length : 0}</button>
                <button class="btn-feed-action" onclick="window.location.href='roomchat.html'"><i data-lucide="send"></i> Bagikan</button>
            </div>

            <div class="post-caption-block"><strong>${post.userName}</strong>${post.caption}</div>

            <div class="post-comments-section">
                <div style="max-height: 120px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;">${commentsHtml}</div>
                <div class="comment-input-form">
                    <input type="text" id="comment-${post.id}" class="comment-text-field" placeholder="Komentar...">
                    <button onclick="window.postComment('${post.id}')" class="btn-submit-comment"><i data-lucide="send" style="width:12px; height:12px;"></i></button>
                </div>
            </div>
        </div>
    `;
}

// Pisahkan Render Beranda & Profil
function renderHomeFeed() {
    feedScroller.innerHTML = allPostsData.length === 0 ? `<div class="loading-state">Belum ada kiriman komunitas.</div>` : "";
    allPostsData.forEach(post => feedScroller.innerHTML += createPostCardHTML(post));
    lucide.createIcons();
}

function renderProfileFeed() {
    const myPosts = allPostsData.filter(post => post.userId === currentUserId);
    profileScroller.innerHTML = myPosts.length === 0 ? `<div class="loading-state">Anda belum membagikan postingan apa pun.</div>` : "";
    myPosts.forEach(post => profileScroller.innerHTML += createPostCardHTML(post));
    lucide.createIcons();
}

// 5. Fitur Interaksi (Hapus, Like, Komen)
window.deletePost = async function(postId) {
    if (confirm("Yakin ingin menghapus postingan ini?")) {
        try { await db.collection('community_posts').doc(postId).delete(); } 
        catch (e) { alert("Gagal menghapus."); }
    }
};

window.toggleLike = async function(postId) {
    const docRef = db.collection('community_posts').doc(postId);
    try {
        const doc = await docRef.get(); if (!doc.exists) return;
        const post = doc.data();
        let likedByArr = post.likedBy || [];
        let likesCount = post.likesCount || 0;

        if (likedByArr.includes(currentUserId)) {
            likedByArr = likedByArr.filter(uid => uid !== currentUserId);
            likesCount = Math.max(0, likesCount - 1);
        } else {
            likedByArr.push(currentUserId); likesCount += 1;
        }
        await docRef.update({ likedBy: likedByArr, likesCount: likesCount });
    } catch (e) { console.error(e); }
};

window.postComment = async function(postId) {
    const input = document.getElementById(`comment-${postId}`);
    const text = input.value.trim();
    if (!text) return;
    try {
        input.disabled = true;
        await db.collection('community_posts').doc(postId).update({
            comments: firebase.firestore.FieldValue.arrayUnion({
                nama: currentUserName, teks: text, waktu: new Date()
            })
        });
        input.value = "";
    } catch (e) { console.error(e); } finally { input.disabled = false; }
};