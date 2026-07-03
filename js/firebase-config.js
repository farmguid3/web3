// js/firebase-config.js

// Konfigurasi Firebase-mu
const firebaseConfig = {
    apiKey: "AIzaSyCOdMX5y27KYI-Sko82wUV89AzG8yJSMxY",
    authDomain: "farmguide-62827.firebaseapp.com",
    projectId: "farmguide-62827",
    storageBucket: "farmguide-62827.firebasestorage.app",
    messagingSenderId: "407792688035",
    appId: "1:407792688035:web:d21abc766dc4589fe11816",
    measurementId: "G-JD66VYW3EG"
};

// Inisialisasi Firebase App, Auth, & Firestore
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth(); 
const db = firebase.firestore(); // <-- TAMBAHKAN BARIS INI