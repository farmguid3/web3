document.addEventListener("DOMContentLoaded", () => {
    // Input Elemen
    const inputMoisture = document.getElementById('input-moisture');
    const inputTemp = document.getElementById('input-temp');
    const inputPh = document.getElementById('input-ph');
    const valMoisture = document.getElementById('val-moisture');
    const valTemp = document.getElementById('val-temp');
    const valPh = document.getElementById('val-ph');
    const cropType = document.getElementById('crop-type');
    
    const simForm = document.getElementById('simulasi-form');
    const btnRunSim = document.getElementById('btn-run-sim');
    const simIcon = document.getElementById('sim-icon');
    const simText = document.getElementById('sim-text');

    // Paparan Keputusan Elemen
    const simEmpty = document.getElementById('sim-empty');
    const simLoading = document.getElementById('sim-loading');
    const simContent = document.getElementById('sim-content');

    // Kemas kini Teks Nilai Slider secara langsung
    inputMoisture.addEventListener('input', (e) => valMoisture.textContent = `${e.target.value}%`);
    inputTemp.addEventListener('input', (e) => valTemp.textContent = `${e.target.value}°C`);
    inputPh.addEventListener('input', (e) => valPh.textContent = e.target.value);

    // Logik Pengiraan Simulasi AI
    function calculateYield(m, t, p) {
        let base = 95;
        if (m < 40 || m > 85) base -= 25;
        if (t < 22 || t > 35) base -= 20;
        if (p < 5.5 || p > 7.5) base -= 15;
        return Math.max(15, base);
    }

    function determineRisk(m, t, p) {
        if (m < 35) return { status: "Kekeringan Akut", css: "background-color: #fef2f2; color: #dc2626;" };
        if (m > 85) return { status: "Busuk Akar / Kulat", css: "background-color: #fff7ed; color: #ea580c;" };
        if (p < 5.0) return { status: "Tanah Terlalu Asid", css: "background-color: #fefce8; color: #ca8a04;" };
        if (t > 36) return { status: "Haba Melampau (Heat Stress)", css: "background-color: #fffbeb; color: #d97706;" };
        return { status: "Keadaan Aman / Optimal", css: "background-color: #f0fdf4; color: #16a34a;" };
    }

    // Pemprosesan Borang
    simForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Dapatkan Nilai Semasa
        const m = parseInt(inputMoisture.value);
        const t = parseInt(inputTemp.value);
        const p = parseFloat(inputPh.value);
        const crop = cropType.value;

        // Ubah Status Butang kepada Loading
        btnRunSim.disabled = true;
        simIcon.setAttribute('data-lucide', 'loader-2');
        simIcon.classList.add('spin-icon');
        simText.textContent = "Mengira...";
        lucide.createIcons();

        // Tukar Paparan Panel Kanan
        simEmpty.classList.add('hidden');
        simContent.classList.add('hidden');
        simLoading.classList.remove('hidden');

        // Simulasikan Kelewatan Pemprosesan AI (2 saat)
        setTimeout(() => {
            const yieldPot = calculateYield(m, t, p);
            const riskLevel = determineRisk(m, t, p);

            // Bina HTML Keputusan
            const resultHTML = `
                <div class="res-grid-top fade-in">
                    <div class="res-box">
                        <div>
                            <span class="lbl">Potensi Anggaran Panen</span>
                            <div class="val-panen">${yieldPot}%</div>
                        </div>
                        <p class="desc">Peratusan kejayaan berdasarkan sisihan piawai nilai optimum biologi bagi ${crop}.</p>
                    </div>

                    <div class="res-box risk" style="${riskLevel.css}">
                        <div>
                            <span class="lbl" style="opacity: 0.8; color: inherit;">Klasifikasi Utama Risiko</span>
                            <div class="val-risk">${riskLevel.status}</div>
                        </div>
                        <div class="act">
                            <i data-lucide="check-circle" style="width:16px; height:16px;"></i>
                            <span>Tindakan pencegahan disyorkan</span>
                        </div>
                    </div>
                </div>

                <div class="analysis-grid fade-in">
                    <div class="analysis-card">
                        <div class="num">1</div>
                        <div>
                            <h4>Keseimbangan Air</h4>
                            <p>Tahap kelembapan ${m}% dinilai ${m < 45 ? 'Kritikal Rendah' : m > 85 ? 'Tepu Air' : 'Optimal'} untuk kitaran vegetatif.</p>
                        </div>
                    </div>
                    <div class="analysis-card">
                        <div class="num">2</div>
                        <div>
                            <h4>Suhu Panas Tanah</h4>
                            <p>Suhu ${t}°C berisiko ${t > 32 ? 'Tinggi' : 'Sangat Rendah'} memicu perkembangan patogen hawar daun.</p>
                        </div>
                    </div>
                    <div class="analysis-card">
                        <div class="num">3</div>
                        <div>
                            <h4>Aktiviti Kimia Tanah</h4>
                            <p>Nilai pH ${p} menandakan tanah bersifat ${p < 6 ? 'Berasid' : p > 7.5 ? 'Beralikali' : 'Neutral/Sangat Baik'} bagi serapan baja NPK.</p>
                        </div>
                    </div>
                    <div class="analysis-card">
                        <div class="num">4</div>
                        <div>
                            <h4>Intervensi Mekanikal</h4>
                            <p>Saranan taktikal: Berikan sungkupan jerami (mulsa) bagi mengekalkan kelembapan mikro tanah dari pancaran terus matahari.</p>
                        </div>
                    </div>
                </div>
            `;

            // Suntik ke dalam DOM
            simContent.innerHTML = resultHTML;
            
            // Render semula ikon baru dalam HTML yang disuntik
            lucide.createIcons();

            // Kembalikan status asal
            simLoading.classList.add('hidden');
            simContent.classList.remove('hidden');
            
            btnRunSim.disabled = false;
            simIcon.classList.remove('spin-icon');
            simIcon.setAttribute('data-lucide', 'trending-up');
            simText.textContent = "Jalankan Model AI";
            lucide.createIcons();

        }, 2000);
    });
});