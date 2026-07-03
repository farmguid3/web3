// 1. Deklarasikan variabel di luar fungsi agar bisa diakses secara global
var map;
var marker;

function initFarmMap() {
    // 2. Cek apakah peta sudah pernah dimuat. Jika sudah, hapus yang lama.
    if (map !== undefined) {
        map.remove(); 
    }

    // 3. Inisialisasi peta baru (Titik awal: Surakarta)
    map = L.map('map').setView([-7.5561, 110.8316], 13);

    // 4. Masukkan TileLayer (Desain Peta)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    // 5. Buat Marker
    marker = L.marker([-7.5561, 110.8316]).addTo(map);

    // 6. Ambil lokasi akurat (Geolokasi GPS)
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lng = position.coords.longitude;
            
            map.setView([lat, lng], 15);
            marker.setLatLng([lat, lng]);
            
            // Opsional: Update teks di UI
            document.getElementById('location-text').innerText = "Lokasi Akurat Ditemukan";
        }, function(error) {
            console.warn("Akses lokasi ditolak atau gagal.");
        });
    }
}

// Panggil fungsinya saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", function() {
    initFarmMap();
});