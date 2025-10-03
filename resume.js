import { auth, db, onAuthStateChanged, getDoc, doc, updateDoc } from "./firebase.js";

const form = document.getElementById('resume-form');
const resumeTitle = document.getElementById('resume-title');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadResumeData(user.uid);
  } else {
    alert('Пожалуйста, войдите в систему');
    window.location.href = 'register.html';
  }
});

async function loadResumeData(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.resume) {
        // Меняем заголовок на "Редактировать резюме"
        resumeTitle.textContent = 'Редактировать резюме';
        
        // Заполняем форму данными
        const resume = userData.resume;
        document.getElementById('name').value = resume.name || '';
        document.getElementById('surname').value = resume.surname || '';
        document.getElementById('patronymic').value = resume.patronymic || '';
        document.getElementById('birth-date').value = resume.birthDate || '';
        document.getElementById('phone').value = resume.phone || '';
        document.getElementById('email').value = resume.email || '';
        document.getElementById('profession').value = resume.profession || '';
        document.getElementById('salary').value = resume.salary || '';
        document.getElementById('employment-type').value = resume.employmentType || '';
        document.getElementById('work-schedule').value = resume.workSchedule || '';
        document.getElementById('experience').value = resume.experience || '';
        document.getElementById('skills').value = resume.skills || '';
        document.getElementById('about').value = resume.about || '';
        document.getElementById('education').value = resume.education || '';
        document.getElementById('language').value = resume.language || '';
        document.getElementById('citizenship').value = resume.citizenship || '';
        document.getElementById('city').value = resume.city || '';
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки резюме:', error);
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (!user) {
    alert('Войдите в аккаунт!');
    return;
  }

  const resumeData = {
    name: form.name.value,
    surname: form.surname.value,
    patronymic: form.patronymic.value,
    birthDate: form['birth-date'].value,
    phone: form.phone.value,
    email: form.email.value,
    profession: form.profession.value,
    salary: form.salary.value,
    employmentType: form['employment-type'].value,
    workSchedule: form['work-schedule'].value,
    experience: form.experience.value,
    skills: form.skills.value,
    about: form.about.value,
    education: form.education.value,
    language: form.language.value,
    citizenship: form.citizenship.value,
    city: form.city.value
  };

  try {
    await updateDoc(doc(db, 'users', user.uid), {
      resume: resumeData
    });

    // Обновляем состояние в AuthManager
    if (window.authManager) {
      window.authManager.hasResume = true;
      window.authManager.updateNavigation();
    }

    alert('✅ Резюме успешно сохранено!');
    window.location.href = 'index.html';
  } catch (error) {
    console.error('Ошибка сохранения резюме:', error);
    alert('Ошибка сохранения резюме: ' + error.message);
  }
});