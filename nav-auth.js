// nav-auth.js - общий скрипт для управления авторизацией в навигации
import { 
  auth, db, onAuthStateChanged, getDoc, doc, signOut 
} from "./firebase.js";

// Находим элементы навигации (они могут отсутствовать на некоторых страницах)
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const resumeBtn = document.getElementById('resume-btn');
const addJobBtn = document.getElementById('add-job-btn');
const applicationsBtn = document.getElementById('applications-btn');
const notificationsBtn = document.getElementById('notifications-btn');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // Пользователь авторизован
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (applicationsBtn) applicationsBtn.style.display = 'block';
    if (notificationsBtn) notificationsBtn.style.display = 'block';
    
    // Получаем роль пользователя
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userRole = userDoc.data().role;
        
        if (resumeBtn) {
          resumeBtn.style.display = userRole === 'seeker' ? 'block' : 'none';
        }
        if (addJobBtn) {
          addJobBtn.style.display = userRole === 'employer' ? 'block' : 'none';
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
    }
  } else {
    // Пользователь не авторизован
    if (loginBtn) loginBtn.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (resumeBtn) resumeBtn.style.display = 'none';
    if (addJobBtn) addJobBtn.style.display = 'none';
    if (applicationsBtn) applicationsBtn.style.display = 'none';
    if (notificationsBtn) notificationsBtn.style.display = 'none';
  }
});

// Обработчик выхода
if (logoutBtn) {
  logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await signOut(auth);
      window.location.href = 'index.html';
    } catch (error) {
      alert('Ошибка выхода: ' + error.message);
    }
  });
}