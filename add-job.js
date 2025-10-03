import { auth, db, collection, addDoc, serverTimestamp } from "./firebase.js";

const form = document.getElementById('add-job-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  if (!user) {
    alert('Войдите в аккаунт!');
    window.location.href = 'register.html';
    return;
  }

  const job = {
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
    createdAt: serverTimestamp(),
    createdBy: user.uid, // Это поле должно сохраняться!
    status: 'active'
  };

  console.log('Creating job with data:', job); // Для отладки

  try {
    await addDoc(collection(db, 'vacancies'), job);
    alert('Вакансия успешно добавлена!');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Ошибка при добавлении вакансии:', error);
    alert('Ошибка при добавлении вакансии: ' + error.message);
  }
});