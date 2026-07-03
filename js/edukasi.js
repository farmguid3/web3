document.addEventListener("DOMContentLoaded", () => {
    
    // Variabel kosong yang akan diisi oleh data dari Firebase
    let articles = [];
    let categories = ["Semua"]; // "Semua" adalah tab bawaan wajib
    
    let currentSearch = "";
    let currentCategory = "Semua";

    const searchInput = document.getElementById('search-edu');
    const categoryContainer = document.getElementById('category-container');
    const articleContainer = document.getElementById('article-container');

    // ========================================================
    // 1. FUNGSI MENGAMBIL DATA DARI FIREBASE FIRESTORE
    // ========================================================
    async function fetchModulesFromFirebase() {
        // Tampilkan animasi loading saat memuat data
        articleContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--gray-500);">
                <i data-lucide="loader-2" class="spin-icon" style="margin-bottom: 12px; width: 32px; height: 32px;"></i>
                <p>Sedang memuat modul edukasi dari database...</p>
            </div>
        `;
        lucide.createIcons();

        try {
            // PERHATIAN: Pastikan nama collection di Firebase Anda adalah "isi_modul"
            const snapshot = await db.collection("isi_modul").get();
            
            const fetchedArticles = [];
            const fetchedCategories = new Set(["Semua"]); // Menggunakan Set agar kategori tidak duplikat

            snapshot.forEach(doc => {
                const data = doc.data();
                
                // Susun format data dari Firebase
                fetchedArticles.push({
                    id: doc.id,
                    title: data.judul || "Modul Tanpa Judul",
                    category: data.kategori || "Umum",
                    duration: data.durasi || "5 minit membaca",
                    level: data.level || "Pemula",
                    // Jika ada field 'deskripsi' pakai itu. Jika tidak, ambil 120 huruf pertama dari 'isi_materi'
                    desc: data.deskripsi || (data.isi_materi ? data.isi_materi.substring(0, 120) + "..." : "Deskripsi tidak tersedia.")
                });

                // Deteksi otomatis kategori baru untuk membuat Tab Navigasi
                if (data.kategori) {
                    fetchedCategories.add(data.kategori);
                }
            });

            // Timpa variabel kosong dengan data asli dari database
            articles = fetchedArticles;
            categories = Array.from(fetchedCategories);

            // Tampilkan ke layar (Render)
            renderCategories();
            renderArticles();

        } catch (error) {
            console.error("Gagal mengambil data modul: ", error);
            articleContainer.innerHTML = `
                <div class="no-article fade-in">
                    <i data-lucide="alert-circle" style="color: red;"></i>
                    <h4>Gagal Memuat Data</h4>
                    <p>Terjadi kesalahan saat menyambung ke pangkalan data Firebase.</p>
                </div>
            `;
            lucide.createIcons();
        }
    }

    // ========================================================
    // 2. CIPTA BUTANG KATEGORI (DINAMIS DARI FIREBASE)
    // ========================================================
    function renderCategories() {
        categoryContainer.innerHTML = '';
        categories.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = `cat-btn ${cat === currentCategory ? 'active' : ''}`;
            btn.textContent = cat;
            btn.addEventListener('click', () => {
                currentCategory = cat;
                renderCategories(); // Kemas kini status 'active'
                renderArticles();   // Tapis semula artikel
            });
            categoryContainer.appendChild(btn);
        });
    }

    // ========================================================
    // 3. RENDER KAD ARTIKEL BERDASARKAN PENAPIS (FILTER)
    // ========================================================
    // ========================================================
    // 3. RENDER KAD ARTIKEL BERDASARKAN PENAPIS (FILTER)
    // ========================================================
    function renderArticles() {
        const filtered = articles.filter(art => {
            const matchSearch = art.title.toLowerCase().includes(currentSearch.toLowerCase()) || 
                                art.desc.toLowerCase().includes(currentSearch.toLowerCase());
            const matchCategory = currentCategory === "Semua" || art.category === currentCategory;
            return matchSearch && matchCategory;
        });

        articleContainer.innerHTML = '';

        if (filtered.length > 0) {
            filtered.forEach(art => {
                // Perhatikan perubahan pada bagian .art-read di bawah ini (menggunakan tag <a>)
                const cardHTML = `
                    <div class="art-card article-card fade-in" data-module-id="${art.id}">
                        <div>
                            <div class="art-meta">
                                <span class="art-cat">${art.category}</span>
                                <span class="art-dur">${art.duration}</span>
                            </div>
                            <h3 class="art-title">${art.title}</h3>
                            <p class="art-desc">${art.desc}</p>
                        </div>
                        <div class="art-footer">
                            <span class="art-lvl">Tahap: ${art.level}</span>
                            
                            <a href="baca-modul.html?id=${art.id}" class="art-read" style="cursor:pointer; color: var(--green-600); font-weight: 600; display:flex; align-items:center; gap:4px; text-decoration: none;">
                                Baca Modul <i data-lucide="chevron-right"></i>
                            </a>
                        </div>
                    </div>
                `;
                articleContainer.innerHTML += cardHTML;
            });
        } else {
            articleContainer.innerHTML = `
                <div class="no-article fade-in">
                    <i data-lucide="book-open-check"></i>
                    <h4>Topik Tidak Ditemui</h4>
                    <p>Gunakan kata kunci pencarian lain atau pilih kategori yang berbeda.</p>
                </div>
            `;
        }

        lucide.createIcons();
    }

    // ========================================================
    // 4. PENJEJAK (LISTENER) CARIAN KOTAK TEKS
    // ========================================================
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value;
        renderArticles();
    });

    // ========================================================
    // 5. JALANKAN SAAT HALAMAN DIMUAT (INIT)
    // ========================================================
    fetchModulesFromFirebase();
});