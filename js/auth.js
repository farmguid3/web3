// js/auth.js
document.addEventListener("DOMContentLoaded", () => {
    // === ELEMEN UI ===
    const btnLoginDesktop = document.getElementById("btn-login-desktop");
    const btnLoginMobile = document.getElementById("btn-login-mobile");
    const profileContainerDesktop = document.getElementById("profile-container-desktop");
    const profileContainerMobile = document.getElementById("profile-container-mobile");
    
    const btnLogoutDesktop = document.getElementById("btn-logout-desktop");
    const btnLogoutMobile = document.getElementById("btn-logout-mobile");
    const dropdownMenuDesktop = document.getElementById("dropdown-menu-desktop");
    const btnProfileDesktop = document.getElementById("btn-profile-desktop");
    
    // === ELEMEN MODAL POP-UP ===
    const authModal = document.getElementById("auth-modal");
    const authForm = document.getElementById("auth-form");
    const btnCloseModal = document.getElementById("btn-close-modal");
    const btnToggleMode = document.getElementById("btn-toggle-mode");
    const modalTitle = document.getElementById("modal-title");
    const btnSubmitText = document.getElementById("btn-submit-text");
    const toggleText = document.getElementById("toggle-text");
    
    // === ELEMEN INPUT ===
    const inputName = document.getElementById("input-name");
    const inputEmail = document.getElementById("input-email");
    const inputPassword = document.getElementById("input-password");

    let isLoginMode = true; 

    // ==========================================
    // LOGIKA BUKA-TUTUP MODAL
    // ==========================================
    const openModal = () => { if (authModal) authModal.classList.remove("hidden"); };
    const closeModal = () => { if (authModal) authModal.classList.add("hidden"); };

    if (btnLoginDesktop) btnLoginDesktop.addEventListener("click", openModal);
    if (btnLoginMobile) btnLoginMobile.addEventListener("click", openModal);
    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);

    // Ganti antara Login dan Daftar Akun
    if (btnToggleMode) {
        btnToggleMode.addEventListener("click", (e) => {
            e.preventDefault();
            isLoginMode = !isLoginMode;
            
            if (isLoginMode) {
                modalTitle.innerText = "Masuk ke Akun";
                btnSubmitText.innerText = "Masuk";
                toggleText.innerText = "Belum punya akun?";
                btnToggleMode.innerText = "Daftar di sini";
                inputName.classList.add("hidden");
                inputName.required = false;
            } else {
                modalTitle.innerText = "Buat Akun Baru";
                btnSubmitText.innerText = "Daftar";
                toggleText.innerText = "Sudah punya akun?";
                btnToggleMode.innerText = "Masuk di sini";
                inputName.classList.remove("hidden");
                inputName.required = true;
            }
        });
    }

    // ==========================================
    // LOGIKA DAFTAR & MASUK FIREBASE
    // ==========================================
    // ==========================================
    // LOGIKA DAFTAR & MASUK FIREBASE
    // ==========================================
    if (authForm) {
        authForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = inputEmail.value;
            const password = inputPassword.value;
            const name = inputName.value;

            try {
                if (isLoginMode) {
                    // --- PROSES LOGIN ---
                    await auth.signInWithEmailAndPassword(email, password);
                    alert("Berhasil masuk!");
                } else {
                    // --- PROSES BUAT AKUN BARU ---
                    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                    
                    // 1. Perbarui profil di Firebase Authentication
                    await userCredential.user.updateProfile({ displayName: name });
                    
                    // 2. Simpan nama pengguna ke Firestore dengan nama field id_user_nama
                    await db.collection("users").doc(userCredential.user.uid).set({
                        id_user_nama: name,          // Sesuai permintaanmu
                        email: email,                // Menyimpan data email juga
                        createdAt: new Date().toISOString() // Keterangan waktu pendaftaran
                    });

                    alert("Akun berhasil dibuat! Halo, " + name);
                }
                closeModal();
                authForm.reset();
            } catch (error) {
                console.error("Gagal Otentikasi:", error);
                alert("Kesalahan: " + error.message);
            }
        });
    }

    // ==========================================
    // LOGIKA KELUAR (LOGOUT)
    // ==========================================
    const handleLogout = async (e) => {
        e.preventDefault();
        if (confirm("Yakin ingin keluar?")) {
            try {
                await auth.signOut();
                alert("Berhasil keluar.");
            } catch (error) {
                console.error("Gagal Logout:", error);
            }
        }
    };

    if (btnLogoutDesktop) btnLogoutDesktop.addEventListener("click", handleLogout);
    if (btnLogoutMobile) btnLogoutMobile.addEventListener("click", handleLogout);

    // ==========================================
    // MONITORING LOGIN (UBAH TAMPILAN)
    // ==========================================
    auth.onAuthStateChanged((user) => {
        if (user) {
            // Jika sudah login
            const userName = user.displayName || "Petani Farmguide";
            
            if (btnLoginDesktop) btnLoginDesktop.classList.add("hidden");
            if (btnLoginMobile) btnLoginMobile.classList.add("hidden");
            if (profileContainerDesktop) profileContainerDesktop.classList.remove("hidden");
            if (profileContainerMobile) profileContainerMobile.classList.remove("hidden");

            const desktopNameEl = document.querySelector("#dropdown-menu-desktop h4");
            const mobileNameEl = document.querySelector(".mobile-user-card h4");
            if (desktopNameEl) desktopNameEl.innerText = userName;
            if (mobileNameEl) mobileNameEl.innerText = userName;
        } else {
            // Jika belum login / habis logout
            if (btnLoginDesktop) btnLoginDesktop.classList.remove("hidden");
            if (btnLoginMobile) btnLoginMobile.classList.remove("hidden");
            if (profileContainerDesktop) profileContainerDesktop.classList.add("hidden");
            if (profileContainerMobile) profileContainerMobile.classList.add("hidden");
            if (dropdownMenuDesktop) dropdownMenuDesktop.classList.add("hidden");
        }
    });

    // ==========================================
    // DROPDOWN MENU PROFIL
    // ==========================================
    if (btnProfileDesktop && dropdownMenuDesktop) {
        btnProfileDesktop.addEventListener("click", (event) => {
            event.stopPropagation();
            dropdownMenuDesktop.classList.toggle("hidden");
        });
        document.addEventListener("click", () => {
            dropdownMenuDesktop.classList.add("hidden");
        });
    }
});