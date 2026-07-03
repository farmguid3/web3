// js/weather.js
const API_KEY = '58b763b9d9ce4fce7aba28c7674c42c8'; // <-- Isi dengan API Key OpenWeatherMap Anda
const BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Fungsi mengambil data cuaca dari API berdasarkan koordinat GPS
 */
async function fetchWeatherByCoords(lat, lon) {
    // Menggunakan parameter lat dan lon agar akurat sesuai posisi GPS user
    const url = `${BASE_URL}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Koordinat lokasi tidak ditemukan atau gangguan API");
        }
        
        const data = await response.json();
        renderWeatherCard(data);
    } catch (error) {
        console.error("Gagal mengambil data cuaca:", error);
        showWeatherError(error.message);
    }
}

/**
 * Fungsi untuk menyuntikkan data cuaca ke dalam elemen HTML
 */
/**
 * Fungsi untuk menyuntikkan data cuaca & lokasi lengkap ke dalam elemen HTML
 */
function renderWeatherCard(data) {
    const container = document.getElementById('weather-container');
    if (!container) return; 

    // Mengambil data lengkap dari OpenWeather API
    const { name, main, weather, sys, coord } = data;
    const temp = Math.round(main.temp); 
    const feelsLike = Math.round(main.feels_like);
    const description = weather[0].description; 
    
    // Konversi kode negara singkat menjadi nama lengkap khusus Indonesia
    const countryName = (sys && sys.country === 'ID') ? 'Indonesia' : (sys ? sys.country : '');
    
    // Format koordinat menjadi 2 angka di belakang koma agar rapi
    const latVal = coord ? coord.lat.toFixed(2) : '0.00';
    const lonVal = coord ? coord.lon.toFixed(2) : '0.00';

    // =========================================================
    // 1. UPDATE TAG LOKASI NAVBAR (Lengkap dengan Negara & Koordinat)
    // =========================================================
    const locTextDesktop = document.getElementById('location-text');
    const locTextMobile = document.getElementById('mobile-location-text');

    // Desain string HTML lokasi yang kaya informasi
    const richLocationHTML = `
        <span>${name}, ${countryName}</span>
        <span style="font-size: 0.75rem; color: #a3a3a3; font-weight: 400; margin-left: 4px; background: #f4f4f5; padding: 2px 6px; border-radius: 4px; border: 1px solid #e4e4e7;">
            ${latVal}, ${lonVal}
        </span>
    `;

    if (locTextDesktop) {
        locTextDesktop.innerHTML = richLocationHTML;
    }
    if (locTextMobile) {
        locTextMobile.innerHTML = richLocationHTML;
    }

    // =========================================================
    // 2. RENDER WIDGET CUACA DI DROPBOX (Ditambah Parameter Angin & Tekanan)
    // =========================================================
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 14px;">
            <h4 style="margin: 0; color: var(--green-700); font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 6px;">
                📍 ${name}, ${countryName}
            </h4>
            <p style="margin: 4px 0 0 0; font-size: 0.75rem; color: var(--gray-400); font-family: monospace;">
                ID Node IoT: GEO-[${latVal}, ${lonVal}]
            </p>
            <p style="margin: 6px 0 0 0; color: var(--green-600); font-size: 0.85rem; text-transform: capitalize; font-weight: 500;">
                ${description}
            </p>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: var(--green-50); padding: 12px; border-radius: 8px; margin-bottom: 10px;">
            <div style="text-align: center; border-right: 1px dashed var(--green-200);">
                <span style="display: block; font-size: 1.5rem; font-weight: 700; color: var(--green-800);">${temp}°C</span>
                <span style="font-size: 0.65rem; color: var(--green-900); font-weight: 600; text-transform: uppercase;">Suhu Aktual</span>
            </div>
            <div style="text-align: center;">
                <span style="display: block; font-size: 1.5rem; font-weight: 700; color: var(--green-800);">${main.humidity}%</span>
                <span style="font-size: 0.65rem; color: var(--green-900); font-weight: 600; text-transform: uppercase;">Kelembapan</span>
            </div>
        </div>

        <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--gray-600); background: var(--gray-50); padding: 8px 12px; border-radius: 6px;">
            <span>💨 Angin: <strong>${data.wind ? data.wind.speed : 0} m/s</strong></span>
            <span>🌡️ Terasa: <strong>${feelsLike}°C</strong></span>
            <span>🎈 Tekanan: <strong>${main.pressure} hPa</strong></span>
        </div>
    `;

    // =========================================================
    // 3. UPDATE KARTU SENSOR DI DASHBOARD UTAMA
    // =========================================================
    const weatherTempVal = document.getElementById('weather-temp-val');
    const weatherHumidityVal = document.getElementById('weather-humidity-val');
    const weatherDescVal = document.getElementById('weather-desc-val');

    if (weatherTempVal) weatherTempVal.textContent = `${temp}°C`;
    if (weatherHumidityVal) weatherHumidityVal.textContent = `${main.humidity}%`;
    if (weatherDescVal) {
        const formatDesc = description.charAt(0).toUpperCase() + description.slice(1);
        weatherDescVal.textContent = formatDesc;
    }
}