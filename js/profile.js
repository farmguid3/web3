// js/profile.js

document.addEventListener("DOMContentLoaded", () => {
    // Inisialisasi Ikon Lucide UI
    lucide.createIcons();

    // Referensi Komponen DOM
    const viewLoggedOut = document.getElementById("profile-logged-out");
    const viewLoading = document.getElementById("profile-loading");
    const viewLoggedIn = document.getElementById("profile-logged-in");

    const profUserTitle = document.getElementById("prof-user-title");
    const profUserDbTag = document.getElementById("prof-user-db-tag");
    const profName = document.getElementById("prof-name");
    const profEmail = document.getElementById("prof-email");
    const profPhone = document.getElementById("prof-phone");
    const profModulesCount = document.getElementById("prof-modules-count");
    const profLastModule = document.getElementById("prof-last-module");

    const phoneForm = document.getElementById("phone-form");
    const inputProfPhone = document.getElementById("input-prof-phone");
    const btnSavePhone = document.getElementById("btn-save-phone");

    let currentUid = null;
    let currentCleanName = "";

    // ========================================================
    // 1. PANTAU STATUS AUTHENTICATION USER
    // ========================================================
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Tampilkan Loading
            viewLoggedOut.classList.add("hidden");
            viewLoading.classList.remove("hidden");
            viewLoggedIn.classList.add("hidden");

            currentUid = user.uid;
            // Bersihkan nama dari spasi/karakter khusus untuk penamaan database kustom
            const rawName = user.displayName || "Petani_Farmguide";
            currentCleanName = rawName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

            await loadUserProfileData(user);
        } else {
            // Jika tidak ada user login
            viewLoggedOut.classList.remove("hidden");
            viewLoading.classList.add("hidden");
            viewLoggedIn.classList.add("hidden");
        }
    });

    // ========================================================
    // 2. FUNGSI MENGAMBIL DATA DARI FIRESTORE
    // ========================================================
    async function loadUserProfileData(authUser) {
        try {
            /**
             * Sesuai permintaan penamaan: "iduser_nama_user"
             * Kita membuat penamaan ID Dokumen unik di Firestore kombinasi antara UID & Nama Bersih
             */
            const customDocId = `${currentUid}_${currentCleanName}`;
            profUserDbTag.innerText = `DOC_ID: ${customDocId}`;

            // Tarik data dari collection 'users' dengan ID dokumen kustom tadi
            let docRef = db.collection("users").doc(customDocId);
            let docSnap = await docRef.get();

            // Skenario Backup: Jika data di ID kustom belum ada, coba cek data bawaan registrasi awal
            if (!docSnap.exists) {
                const legacySnap = await db.collection("users").doc(currentUid).get();
                if (legacySnap.exists) {
                    // Migrasikan atau salin data lama ke struktur dokumen nama baru agar sesuai instruksi
                    const oldData = legacySnap.data();
                    await docRef.set({
                        name: oldData.name || authUser.displayName || "Tanpa Nama",
                        email: oldData.email || authUser.email,
                        phone: oldData.phone || "",
                        readModules: oldData.readModules || [],
                        lastReadModule: oldData.lastReadModule || ""
                    }, { merge: true });
                    // Refresh snapshot ke dokumen baru
                    docSnap = await docRef.get();
                } else {
                    // Jika benar-benar user baru gres tanpa records database sebelumnya
                    await docRef.set({
                        name: authUser.displayName || "Petani Anonim",
                        email: authUser.email,
                        phone: "",
                        readModules: [],
                        lastReadModule: ""
                    }, { merge: true });
                    docSnap = await docRef.get();
                }
            }

            const userData = docSnap.data();

            // Render Informasi Dasar ke UI Halaman
            profUserTitle.innerText = userData.name || "Petani Farmguide";
            profName.innerText = userData.name || "Belum diatur";
            profEmail.innerText = userData.email || authUser.email;

            // Logika Penkondisian nomor HP (Jika belum ada, munculkan Input Form)
            if (userData.phone && userData.phone.trim() !== "") {
                profPhone.innerText = userData.phone;
                profPhone.classList.remove("hidden");
                phoneForm.classList.add("hidden");
            } else {
                profPhone.classList.add("hidden");
                phoneForm.classList.remove("hidden");
            }

            // Hitung & Render statistik pembacaan modul pintar
            const modulesArray = userData.readModules || [];
            profModulesCount.innerText = `${modulesArray.length} Modul Terbaca`;

            if (userData.lastReadModule && userData.lastReadModule.trim() !== "") {
                profLastModule.innerText = userData.lastReadModule;
            } else if (modulesArray.length > 0) {
                // Alternatif fallback jika text judul kosong namun ada array indeks terakhir
                profLastModule.innerText = `Modul ID: ${modulesArray[modulesArray.length - 1]}`;
            } else {
                profLastModule.innerText = "Belum ada modul yang diselesaikan";
            }

            // Tampilkan Container Utama Profil
            viewLoading.classList.add("hidden");
            viewLoggedIn.classList.remove("hidden");

        } catch (error) {
            console.error("Gagal memuat profil petani dari Firestore: ", error);
            alert("Terjadi kendala saat menyinkronkan data profil dari cloud server.");
        }
    }

    // ========================================================
    // 3. LOGIKA TOMBOL SIMPAN NOMOR HANDPHONE BARU
    // ========================================================
    if (btnSavePhone) {
        btnSavePhone.addEventListener("click", async () => {
            const inputVal = inputProfPhone.value.trim();

            if (inputVal === "" || inputVal.length < 9) {
                alert("Silakan masukkan format nomor HP yang valid!");
                return;
            }

            try {
                btnSavePhone.disabled = true;
                btnSavePhone.innerText = "...";

                const customDocId = `${currentUid}_${currentCleanName}`;
                
                // Update ke Firebase Firestore dokumen iduser_nama_user
                await db.collection("users").doc(customDocId).update({
                    phone: inputVal
                });

                // Perbarui tampilan interface tanpa perlu hard-reload
                profPhone.innerText = inputVal;
                profPhone.classList.remove("hidden");
                phoneForm.classList.add("hidden");

                alert("Nomor Handphone Anda berhasil diverifikasi & disimpan!");
            } catch (err) {
                console.error("Gagal mengupdate nomor telepon: ", err);
                alert("Gagal mengamankan data nomor HP ke Firestore.");
            } finally {
                btnSavePhone.disabled = false;
                btnSavePhone.innerText = "Simpan";
            }
        });
    }
});