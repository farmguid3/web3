// js/modules.js

let currentUser = null;
let currentCustomDocId = null;

// ========================================================
// 1. PANTAU STATUS AUTENTIKASI USER SECARA LANGSUNG
// ========================================================
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        
        // Buat format nama bersih untuk ID dokumen: iduser_nama_user
        const rawName = user.displayName || "Petani_Farmguide";
        const cleanName = rawName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
        currentCustomDocId = `${user.uid}_${cleanName}`;

        // Sinkronisasi statistik bacaan saat pertama kali halaman dimuat
        await syncUserProfileStats();
    } else {
        currentUser = null;
        currentCustomDocId = null;
        resetModuleUIState();
    }
});

// ========================================================
// 2. FUNGSI SINKRONISASI STATISTIK BACAAN DARI FIRESTORE
// ========================================================
async function syncUserProfileStats() {
    if (!currentCustomDocId) return;

    try {
        const docSnap = await db.collection("users").doc(currentCustomDocId).get();

        if (docSnap.exists) {
            const userData = docSnap.data();
            const readModulesList = userData.readModules || [];
            
            // Update elemen jumlah modul jika ada di halaman tersebut
            const statCountEl = document.getElementById('stat-modules-count');
            if (statCountEl) statCountEl.innerText = readModulesList.length;
        }
    } catch (err) {
        console.error("Gagal sinkronisasi statistik profil:", err);
    }
}

// ========================================================
// 3. EVENT LISTENER: OTOMATIS HITUNG SAAT TOMBOL DIKLIK
// ========================================================
// Menggunakan event delegation pada body agar mendeteksi kartu modul yang dirender dinamis
document.addEventListener('click', async (e) => {
    // Cari apakah yang diklik adalah tombol/area "Baca Modul"
    const targetBaca = e.target.closest('.art-read') || e.target.closest('.article-card');
    
    if (targetBaca) {
        // Jika user belum login, beri peringatan
        if (!currentUser || !currentCustomDocId) {
            alert("Silakan masuk atau daftar akun terlebih dahulu untuk menyimpan riwayat bacaan Anda!");
            return;
        }

        // Ambil elemen kartu artikel terdekat untuk mendapatkan Judul Materi
        const articleCard = targetBaca.closest('.article-card') || targetBaca;
        if (!articleCard) return;

        const articleTitle = articleCard.querySelector('.art-title')?.innerText || "Modul Tanpa Judul";

        try {
            // Gunakan ID Dokumen Kustom: iduser_nama_user
            const docRef = db.collection("users").doc(currentCustomDocId);
            
            // Ambil data terbaru untuk pengecekan duplikasi array
            const docSnap = await docRef.get();
            let readModulesArray = [];
            
            if (docSnap.exists) {
                readModulesArray = docSnap.data().readModules || [];
            }

            // Gabungkan data: update judul terakhir dibaca & masukkan ke daftar array jika belum pernah dibaca
            const updateData = {
                lastReadModule: articleTitle
            };

            // Jika judul belum ada di dalam daftar yang pernah dibaca, tambahkan otomatis
            if (!readModulesArray.includes(articleTitle)) {
                updateData.readModules = firebase.firestore.FieldValue.arrayUnion(articleTitle);
            }

            // Tembak data pembaruan ke Firestore
            await docRef.set(updateData, { merge: true });

            // Perbarui statistik visual di halaman secara real-time
            await syncUserProfileStats();
            
            console.log(`Berhasil mencatat riwayat membuka modul: "${articleTitle}"`);
            
        } catch (err) {
            console.error("Gagal menyimpan progres buka modul ke Firestore: ", err);
        }
    }
});

// ========================================================
// 4. RESET UI APABILA USER LOGOUT
// ========================================================
function resetModuleUIState() {
    const statCountEl = document.getElementById('stat-modules-count');
    if (statCountEl) statCountEl.innerText = "0";
    
    if (document.getElementById('stat-modules-list')) {
        document.getElementById('stat-modules-list').innerText = "Silakan login untuk melihat.";
    }
}