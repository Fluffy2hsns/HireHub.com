import { 
  auth, db, onAuthStateChanged, getDoc, doc, updateDoc, 
  signOut, setPersistence, browserLocalPersistence 
} from "./firebase.js";

const form = document.getElementById('edit-vacancy-form');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');

let currentVacancyId = null;
let currentUser = null;

// Получаем ID вакансии из URL
const urlParams = new URLSearchParams(window.location.search);
currentVacancyId = urlParams.get('id');

setPersistence(auth, browserLocalPersistence);

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'block';
    await loadVacancyData();
  } else {
    alert('Пожалуйста, войдите в систему');
    window.location.href = 'register.html';
  }
});

async function loadVacancyData() {
  if (!currentVacancyId) {
    alert('Вакансия не найдена');
    window.location.href = 'index.html';
    return;
  }

  try {
    const vacancyDoc = await getDoc(doc(db, 'vacancies', currentVacancyId));
    
    if (!vacancyDoc.exists()) {
      alert('Вакансия не найдена');
      window.location.href = 'index.html';
      return;
    }

    const vacancy = vacancyDoc.data();

    // Проверяем, является ли пользователь владельцем вакансии
    if (vacancy.createdBy !== currentUser.uid) {
      alert('У вас нет прав для редактирования этой вакансии');
      window.location.href = 'index.html';
      return;
    }

    // Заполняем форму данными
    document.getElementById('job-title').value = vacancy.title;
    document.getElementById('company-name').value = vacancy.companyName;
    document.getElementById('job-salary').value = vacancy.salary;
    document.getElementById('job-type').value = vacancy.employmentType;
    document.getElementById('job-experience').value = vacancy.experience;
    document.getElementById('job-city').value = vacancy.city;
    document.getElementById('job-description').value = vacancy.description;
    document.getElementById('job-requirements').value = vacancy.requirements || '';
    document.getElementById('job-benefits').value = vacancy.benefits || '';
    document.getElementById('contact-email').value = vacancy.contactEmail || '';
    document.getElementById('job-status').value = vacancy.status || 'active';

  } catch (error) {
    console.error('Ошибка загрузки вакансии:', error);
    alert('Ошибка загрузки данных вакансии');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const updatedVacancy = {
    title: document.getElementById('job-title').value,
    companyName: document.getElementById('company-name').value,
    salary: document.getElementById('job-salary').value,
    employmentType: document.getElementById('job-type').value,
    experience: document.getElementById('job-experience').value,
    city: document.getElementById('job-city').value,
    description: document.getElementById('job-description').value,
    requirements: document.getElementById('job-requirements').value,
    benefits: document.getElementById('job-benefits').value,
    contactEmail: document.getElementById('contact-email').value,
    status: document.getElementById('job-status').value,
    updatedAt: new Date()
  };

  try {
    await updateDoc(doc(db, 'vacancies', currentVacancyId), updatedVacancy);
    alert('✅ Вакансия успешно обновлена!');
    window.location.href = `vacancy.html?id=${currentVacancyId}`;
  } catch (error) {
    alert('Ошибка при обновлении вакансии: ' + error.message);
  }
});

logoutBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  await signOut(auth);
  window.location.href = 'index.html';
});