// // firebase.js
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
// import {
//   getAuth,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
//   setPersistence,
//   browserLocalPersistence
// } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
// import {
//   getFirestore,
//   doc,
//   setDoc,
//   getDoc,
//   collection,
//   addDoc,
//   getDocs,
//   query,
//   where,
//   updateDoc,
//   arrayUnion,
//   orderBy,
//   serverTimestamp,
//   deleteDoc  // ← ДОБАВЬТЕ ЭТУ СТРОЧКУ
// } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// const firebaseConfig = {
//   apiKey: "AIzaSyDv1Tee47BEUMwIy0GzE4K3r3olt80XBVo",
//   authDomain: "web-app-hh.firebaseapp.com",
//   projectId: "web-app-hh",
//   storageBucket: "web-app-hh.appspot.com",
//   messagingSenderId: "291545678678",
//   appId: "1:291545678678:web:dc9cd637f7a2c7c696ccf7",
//   measurementId: "G-B62GJBY70M"
// };

// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
// const db = getFirestore(app);

// export {
//   auth,
//   db,
//   createUserWithEmailAndPassword,
//   signInWithEmailAndPassword,
//   signOut,
//   onAuthStateChanged,
//   setPersistence,
//   browserLocalPersistence,
//   doc,
//   setDoc,
//   getDoc,
//   collection,
//   addDoc,
//   getDocs,
//   query,
//   where,
//   updateDoc,
//   arrayUnion,
//   orderBy,
//   serverTimestamp,
//   deleteDoc  // ← ДОБАВЬТЕ ЭТУ СТРОЧКУ
// };


// // В конец firebase.js добавьте:
// import {
//   onSnapshot,
//   arrayUnion,
//   deleteDoc
// } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

// export {
//   onSnapshot,
//   arrayUnion,
//   deleteDoc
// };


// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  orderBy,
  serverTimestamp,
  deleteDoc,
  onSnapshot  // ← ДОБАВИЛИ onSnapshot СЮДА
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDv1Tee47BEUMwIy0GzE4K3r3olt80XBVo",
  authDomain: "web-app-hh.firebaseapp.com",
  projectId: "web-app-hh",
  storageBucket: "web-app-hh.appspot.com",
  messagingSenderId: "291545678678",
  appId: "1:291545678678:web:dc9cd637f7a2c7c696ccf7",
  measurementId: "G-B62GJBY70M"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  arrayUnion,
  orderBy,
  serverTimestamp,
  deleteDoc,
  onSnapshot  // ← И ЭКСПОРТИРУЕМ onSnapshot ОДИН РАЗ
};