import { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, doc, setDoc, onAuthStateChanged, setPersistence, browserLocalPersistence } from "./firebase.js";

setPersistence(auth, browserLocalPersistence);

const roleSelect = document.getElementById("role-select");
const registerForm = document.getElementById("register-form");
const loginForm = document.getElementById("login-form");
const roleFields = document.getElementById("role-fields");
const pageTitle = document.getElementById("page-title");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submit-btn");
const switchToLogin = document.getElementById("switch-to-login");
const switchToRegister = document.getElementById("switch-to-register");

let selectedRole = null;

function showMessage(text, type = "info") {
  message.textContent = text;
  message.className = type;
}

roleSelect.querySelectorAll("button").forEach(btn => {
  btn.addEventListener("click", () => {
    selectedRole = btn.dataset.role;
    roleSelect.style.display = "none";
    registerForm.style.display = "block";
    renderFields(selectedRole);
  });
});

function renderFields(role) {
  pageTitle.textContent = `Регистрация — ${role === "seeker" ? "Соискатель" : "Работодатель"}`;
  roleFields.innerHTML = role === "seeker" ? `
    <label>Имя <input type="text" id="name" required></label>
    <label>Специальность <input type="text" id="profession" required></label>
    <label>О себе <textarea id="about"></textarea></label>
    <label>Телефон <input type="tel" id="phone"></label>
  ` : `
    <label>Название компании <input type="text" id="companyName" required></label>
    <label>О компании <textarea id="companyAbout"></textarea></label>
    <label>Телефон <input type="tel" id="phone"></label>
  `;
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;
  showMessage("Регистрация...", "info");
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  let profile = { email, role: selectedRole };
  if (selectedRole === "seeker") {
    Object.assign(profile, {
      name: document.getElementById("name").value,
      profession: document.getElementById("profession").value,
      about: document.getElementById("about").value,
      phone: document.getElementById("phone").value
    });
  } else {
    Object.assign(profile, {
      companyName: document.getElementById("companyName").value,
      companyAbout: document.getElementById("companyAbout").value,
      phone: document.getElementById("phone").value
    });
  }
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, "users", cred.user.uid), profile);
    await signInWithEmailAndPassword(auth, email, password);
    onAuthStateChanged(auth, user => {
      if (user) window.location.href = "index.html";
    }, { once: true });
  } catch (err) {
    showMessage("Ошибка: " + err.message, "error");
    submitBtn.disabled = false;
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("Вход...", "info");
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  try {
    await signInWithEmailAndPassword(auth, email, password);
    onAuthStateChanged(auth, user => {
      if (user) window.location.href = "index.html";
    }, { once: true });
  } catch (err) {
    showMessage("Ошибка: " + err.message, "error");
  }
});

switchToLogin.addEventListener("click", e => {
  e.preventDefault();
  registerForm.style.display = "none";
  loginForm.style.display = "block";
  pageTitle.textContent = "Вход";
  roleSelect.style.display = "none";
});

switchToRegister.addEventListener("click", e => {
  e.preventDefault();
  loginForm.style.display = "none";
  roleSelect.style.display = "block";
  pageTitle.textContent = "Регистрация";
});