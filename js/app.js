document.addEventListener("DOMContentLoaded", () => {
    // 1. Inisialisasi Ikon Lucide
    lucide.createIcons();

    // 2. Kawalan Navigasi (Tab Switching)
    const tabBtns = document.querySelectorAll('.tab-btn');
    const viewSections = document.querySelectorAll('.view-section');
    const mobileMenu = document.getElementById('mobile-menu');
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const menuIcon = document.getElementById('menu-icon');

    function switchTab(targetId) {
        tabBtns.forEach(btn => btn.classList.remove('active'));
        viewSections.forEach(sec => {
            sec.classList.remove('active');
            sec.classList.add('hidden');
        });

        document.querySelectorAll(`.tab-btn[data-target="${targetId}"]`).forEach(btn => {
            btn.classList.add('active');
        });

        const activeView = document.getElementById(`view-${targetId}`);
        if(activeView) {
            activeView.classList.remove('hidden');
            activeView.classList.add('active');
        }

        if(!mobileMenu.classList.contains('hidden')) {
            mobileMenu.classList.add('hidden');
            menuIcon.setAttribute('data-lucide', 'menu');
            lucide.createIcons();
        }
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const target = e.currentTarget.getAttribute('data-target');
            switchTab(target);
        });
    });

    // 3. Kawalan Menu Mudah Alih
    if (btnMobileMenu) {
        btnMobileMenu.addEventListener('click', () => {
            const isHidden = mobileMenu.classList.contains('hidden');
            if(isHidden) {
                mobileMenu.classList.remove('hidden');
                menuIcon.setAttribute('data-lucide', 'x');
            } else {
                mobileMenu.classList.add('hidden');
                menuIcon.setAttribute('data-lucide', 'menu');
            }
            lucide.createIcons();
        });
    }

    // 4. Sistem Geolokasi & Integrasi Maps
    const inputCity = document.getElementById('search-city');
    const btnSearchCity = document.getElementById('btn-search-city');

    // --- INISIALISASI PETA LEAFLET ---
    const defaultLat = -2.5489; 
    const defaultLng = 118.0149;
    let map = null;
    let marker = null;
    
    // Perbaikan: Cek dulu apakah div #map ada di HTML
    const mapElement = document.getElementById('map');
    if (mapElement) {
        map = L.map('map').setView([defaultLat, defaultLng], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);

        // --- LOGIKA DRAG PIN MAPS MANUAL ---
        marker.on('dragend', function (e) {
            const position = marker.getLatLng();
            const lat = position.lat.toFixed(4);
            const lng = position.lng.toFixed(4);
            
            if (typeof fetchWeatherByCoords === "function") {
                fetchWeatherByCoords(lat, lng);
            }
        });

        // --- LOGIKA KLIK PETA ---
        map.on('click', function(e) {
            const lat = e.latlng.lat.toFixed(4);
            const lng = e.latlng.lng.toFixed(4);
            
            marker.setLatLng(e.latlng);
            
            if (typeof fetchWeatherByCoords === "function") {
                fetchWeatherByCoords(lat, lng);
            }
        });
    }

    // Ambil cuaca default walau peta belum dirender
    if (typeof fetchWeatherByCoords === "function") {
        fetchWeatherByCoords(defaultLat, defaultLng);
    }

    // Fungsi mendapatkan lokasi dari GPS Perangkat asli
    function getLocation() {
        if (!navigator.geolocation) {
            alert("Geolokasi tidak didukung oleh browser Anda.");
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(4);
                const lng = position.coords.longitude.toFixed(4);
                
                if (map !== null && marker !== null) {
                    map.setView([lat, lng], 13);
                    marker.setLatLng([lat, lng]);
                }
                
                if (typeof fetchWeatherByCoords === "function") {
                    fetchWeatherByCoords(lat, lng);
                }
            },
            (error) => {
                console.error(error);
                alert("Gagal memuat GPS otomatis. Pastikan izin lokasi aktif.");
            }
        );
    }

    // --- LOGIKA TOMBOL CARI KOTA KUSTOM ---
    if (btnSearchCity && inputCity) {
        btnSearchCity.addEventListener('click', async () => {
            const cityName = inputCity.value.trim();
            if (!cityName) return alert("Silakan ketik nama kota terlebih dahulu!");

            if (typeof fetchWeatherByCity === "function") {
                const coords = await fetchWeatherByCity(cityName);
                if (coords && map !== null && marker !== null) {
                    map.setView([coords.lat, coords.lon], 11);
                    marker.setLatLng([coords.lat, coords.lon]);
                }
            }
        });

        inputCity.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                btnSearchCity.click();
            }
        });
    }

    // ========================================================
    // 5. LOGIKA POPOVER PILIHAN LOKASI (YANG BARU & BERSIH)
    // ========================================================
    const btnLocation = document.getElementById('btn-location');
    const popover = document.getElementById('location-popover');
    const btnPopoverGps = document.getElementById('btn-popover-gps');
    const btnPopoverManual = document.getElementById('btn-popover-manual');
    const btnMobileLocation = document.getElementById('btn-mobile-location');

    // Klik tombol utama untuk memunculkan dropdown
    if (btnLocation && popover) {
        const newBtnLocation = btnLocation.cloneNode(true);
        btnLocation.parentNode.replaceChild(newBtnLocation, btnLocation);

        newBtnLocation.addEventListener('click', (e) => {
            e.stopPropagation(); 
            popover.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!popover.contains(e.target) && !newBtnLocation.contains(e.target)) {
                popover.classList.remove('show');
            }
        });
    }

    // Aksi Opsi 1: Lokasi Saat Ini (GPS)
    if (btnPopoverGps) {
        btnPopoverGps.addEventListener('click', () => {
            if (popover) popover.classList.remove('show');
            getLocation();
        });
    }

    // Aksi Opsi 2: Pilih Melalui Maps (Manual)
    if (btnPopoverManual) {
        btnPopoverManual.addEventListener('click', () => {
            if (popover) popover.classList.remove('show');
            const mapContainer = document.getElementById('map'); 
            if (mapContainer) {
                mapContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                alert("Area Peta belum ditambahkan pada tampilan ini.");
            }
        });
    }

    // Tombol Mobile (Langsung pakai GPS saja supaya gampang)
    if (btnMobileLocation) {
        btnMobileLocation.addEventListener('click', getLocation);
    }

    // ========================================================
    // 6. LOGIKA JAM DIGITAL REAL-TIME
    // ========================================================
    function startLiveClock() {
        const clockElement = document.getElementById('live-clock');
        if (!clockElement) return;

        setInterval(() => {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');

            clockElement.textContent = `${hours}:${minutes}:${seconds}`;
        }, 1000); 
    }
    
    startLiveClock();
});








// --- LOGIKA NOTIFIKASI ADMIN (REALTIME FIRESTORE) ---

const notifContainer = document.getElementById('notification-list-container');
const btnSendNotif = document.getElementById('btn-send-notif');
const notifTitleInput = document.getElementById('notif-title');
const notifContentInput = document.getElementById('notif-content');

// 1. Ambil Data Notifikasi Secara Realtime dari Firestore
function listenAdminNotifications() {
    db.collection("notifikasi_admin").orderBy("waktu", "desc").onSnapshot((snapshot) => {
        notifContainer.innerHTML = "";
        
        if (snapshot.empty) {
            notifContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                    <i data-lucide="bell-off" style="width: 48px; height: 48px; margin-bottom: 8px; stroke-width: 1.5;"></i>
                    <p style="font-size: 0.9rem;">Belum ada pengumuman resmi saat ini.</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;
            
            // Format waktu pendaftaran data
            const formatWaktu = data.waktu 
                ? data.waktu.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                : "Baru saja";

            // FITUR 1: LOGIKA GAMBAR UTUH (TIDAK TER-CROP)
            let imageHtml = "";
            if (data.gambarUrl) {
                imageHtml = `
                    <div style="width: 100%; background: #f8fafc; border-radius: 8px; overflow: hidden; margin-bottom: 12px; border: 1px solid var(--gray-200); display: flex; justify-content: center; align-items: center;">
                        <img src="${data.gambarUrl}" style="width: 100%; max-height: 350px; object-fit: contain; display: block;">
                    </div>
                `;
            }

            // LOOPING DAFTAR KOMENTAR
            let commentListHtml = "";
            if (data.comments && data.comments.length > 0) {
                data.comments.forEach(c => {
                    commentListHtml += `
                        <div style="background: white; padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; border: 1px solid var(--gray-100); margin-bottom: 4px;">
                            <strong style="color: var(--green-700); font-size: 0.82rem;">${c.nama}</strong>
                            <p style="margin: 2px 0 0 0; color: var(--gray-700); line-height: 1.3;">${c.teks}</p>
                        </div>
                    `;
                });
            } else {
                commentListHtml = `<p id="empty-comment-${id}" style="font-size: 0.78rem; color: var(--gray-400); text-align: center; margin: 10px 0;">Belum ada komentar.</p>`;
            }

            notifContainer.innerHTML += `
                <div class="notif-card" style="background: white; padding: 16px; border-radius: 12px; border-left: 4px solid var(--green-600); box-shadow: 0 2px 8px rgba(0,0,0,0.04); border-top: 1px solid var(--gray-100); border-right: 1px solid var(--gray-100); border-bottom: 1px solid var(--gray-100); position: relative; margin-bottom: 16px;">
                    <h4 style="margin: 0 0 6px 0; color: var(--gray-800); font-size: 1rem; font-weight: 600; padding-right: 32px;">${data.judul}</h4>
                    
                    ${imageHtml}

                    <p style="margin: 0 0 12px 0; color: var(--gray-600); font-size: 0.88rem; line-height: 1.5; white-space: pre-line;">${data.isi}</p>
                    
                    <div style="font-size: 0.75rem; color: var(--gray-500); display: flex; align-items: center; gap: 4px; margin-bottom: 12px;">
                        <i data-lucide="clock" style="width: 12px; height: 12px;"></i> ${formatWaktu}
                    </div>

                    <div style="display: flex; gap: 16px; border-top: 1px solid var(--gray-100); padding-top: 10px;">
                        <button onclick="likeNotification('${id}')" style="background: none; border: none; color: #e11d48; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 0.85rem; font-weight: 500; font-family: 'Poppins', sans-serif; padding: 4px 0;">
                            <i data-lucide="heart" style="width: 16px; height: 16px; fill: ${data.likes > 0 ? '#e11d48' : 'none'};"></i> 
                            <span>${data.likes || 0} Suka</span>
                        </button>
                        <button onclick="toggleCommentSection('${id}')" style="background: none; border: none; color: var(--gray-600); cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 0.85rem; font-weight: 500; font-family: 'Poppins', sans-serif; padding: 4px 0;">
                            <i data-lucide="message-circle" style="width: 16px; height: 16px;"></i> 
                            <span>${data.comments ? data.comments.length : 0} Komentar</span>
                        </button>
                    </div>

                    <div id="comment-box-${id}" style="display: none; margin-top: 12px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid var(--gray-100);">
                        <div id="comment-list-${id}" style="max-height: 150px; overflow-y: auto; margin-bottom: 10px; padding-right: 4px;">
                            ${commentListHtml}
                        </div>
                        <div style="display: flex; gap: 6px;">
                            <input type="text" id="comment-input-${id}" placeholder="Tulis tanggapan..." style="flex: 1; padding: 8px 12px; border: 1px solid var(--gray-200); border-radius: 6px; font-size: 0.85rem; font-family: 'Poppins', sans-serif; outline: none; background: white;">
                            <button onclick="submitComment('${id}')" style="background: var(--green-600); color: white; border: none; width: 36px; height: 36px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                                <i data-lucide="send" style="width: 14px; height: 14px;"></i>
                            </button>
                        </div>
                    </div>

                    <button onclick="deleteNotification('${id}')" style="position: absolute; top: 14px; right: 14px; background: none; border: none; color: #ef4444; cursor: pointer; padding: 4px; border-radius: 50%; display: flex; align-items: center; justify-content: center;" title="Hapus Pengumuman">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                </div>
            `;
        });
        lucide.createIcons();
    });
}

// 2. Fungsi untuk Mengirim Notifikasi ke Firestore (Aksi Tombol Kirim)
if (btnSendNotif) {
    btnSendNotif.addEventListener('click', async () => {
        const judul = notifTitleInput.value.trim();
        const isi = notifContentInput.value.trim();

        if (judul === "" || isi === "") {
            alert("⚠️ Harap isi judul dan detail informasi terlebih dahulu!");
            return;
        }

        try {
            btnSendNotif.disabled = true;
            btnSendNotif.innerHTML = `<i data-lucide="loader-2" class="spin-icon" style="width:16px; height:16px;"></i> Mengirim...`;
            lucide.createIcons();

            await db.collection("notifikasi_admin").add({
                judul: judul,
                isi: isi,
                likes: 0,         // Inisialisasi field likes bawaan
                comments: [],      // Inisialisasi field comments bawaan
                waktu: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Reset Form setelah sukses
            notifTitleInput.value = "";
            notifContentInput.value = "";
            alert("🎉 Notifikasi pengumuman sukses disebarkan!");
        } catch (error) {
            console.error("Gagal mengirim broadcast:", error);
            alert("Gagal memproses pengiriman ke database.");
        } finally {
            btnSendNotif.disabled = false;
            btnSendNotif.innerHTML = `<i data-lucide="send" style="width: 16px; height: 16px;"></i> Kirim Notifikasi Resmi`;
            lucide.createIcons();
        }
    });
}

// 3. Fungsi Menghapus Notifikasi Khusus Admin
window.deleteNotification = async function(docId) {
    if (confirm("Apakah Anda yakin ingin menghapus pengumuman ini dari aplikasi?")) {
        try {
            await db.collection("notifikasi_admin").doc(docId).delete();
        } catch (error) {
            console.error("Gagal menghapus:", error);
        }
    }
};

// ========================================================
// INTERAKSI BARU: FUNGSI LOGIKA LIKE & KOMENTAR
// ========================================================

// Aksi Like Notifikasi
window.likeNotification = async function(id) {
    try {
        await db.collection("notifikasi_admin").doc(id).update({
            likes: firebase.firestore.FieldValue.increment(1)
        });
    } catch (error) {
        console.error("Gagal menyukai:", error);
    }
};

// Buka/Tutup Kolom Komentar Publik
window.toggleCommentSection = function(id) {
    const box = document.getElementById(`comment-box-${id}`);
    if (box) {
        box.style.display = box.style.display === "none" ? "block" : "none";
    }
};

// Kirim Komentar Baru
window.submitComment = async function(id) {
    const input = document.getElementById(`comment-input-${id}`);
    if (!input) return;
    
    const teks = input.value.trim();
    if (!teks) return;

    // Ambil nama user aktif dari Firebase Auth
    const userAktif = firebase.auth().currentUser;
    const namaUser = userAktif && userAktif.displayName ? userAktif.displayName : "Pengguna";

    try {
        input.disabled = true;
        await db.collection("notifikasi_admin").doc(id).update({
            comments: firebase.firestore.FieldValue.arrayUnion({
                nama: namaUser,
                teks: teks,
                waktu: new Date()
            })
        });
        input.value = "";
    } catch (error) {
        console.error("Gagal mengirim komentar:", error);
        alert("Gagal memposting komentar.");
    } finally {
        input.disabled = false;
        input.focus();
    }
};

// Jalankan Listener saat halaman pertama kali siap
document.addEventListener("DOMContentLoaded", () => {
    listenAdminNotifications();
});



// Script untuk Notifikasi Instal APK
document.addEventListener("DOMContentLoaded", () => {
    const apkModal = document.getElementById('apk-install-modal');
    const btnCloseApk = document.getElementById('btn-close-apk-modal');
    const modalContent = document.getElementById('apk-modal-content');
    const btnDownload = document.getElementById('btn-download-apk');

    // Cek apakah pengguna sudah pernah menutup notif ini sebelumnya
    const hasSeenApkModal = localStorage.getItem('hasSeenApkModal');

    if (!hasSeenApkModal) {
        // Tampilkan modal dengan delay 2 detik agar pengguna melihat dashboard dulu
        setTimeout(() => {
            apkModal.classList.remove('hidden');
            
            // Render ulang ikon Lucide untuk modal
            if(window.lucide) { window.lucide.createIcons(); }
            
            // Berikan sedikit jeda untuk trigger animasi CSS
            setTimeout(() => {
                apkModal.style.opacity = '1';
                modalContent.style.transform = 'translateY(0)';
            }, 50);
        }, 2000); // Muncul setelah 2 detik
    }

    // Fungsi untuk menyembunyikan modal
    const closeModal = () => {
        apkModal.style.opacity = '0';
        modalContent.style.transform = 'translateY(20px)';
        
        // Tunggu animasi selesai baru sembunyikan elemen
        setTimeout(() => {
            apkModal.classList.add('hidden');
        }, 300);
        
        // Simpan data di local storage agar tidak muncul lagi di kunjungan berikutnya
        localStorage.setItem('hasSeenApkModal', 'true');
    };

    // Event listener tombol tutup
    if (btnCloseApk) {
        btnCloseApk.addEventListener('click', closeModal);
    }
    
    // Jika user klik tombol download, kita juga bisa menutup modalnya
    if (btnDownload) {
        btnDownload.addEventListener('click', () => {
            // Biarkan proses download berjalan, lalu tutup modal
            setTimeout(closeModal, 500); 
        });
    }
});
