import { 
  auth, 
  db, 
  onAuthStateChanged, 
  getDocs, 
  collection, 
  query, 
  where, 
  getDoc, 
  doc, 
  deleteDoc,
  updateDoc 
} from "./firebase.js";

const applicationsList = document.getElementById('applications-list');

// Функция для получения метки статуса
function getStatusLabel(status) {
  const statusLabels = {
    'active': 'Активна',
    'paused': 'На паузе', 
    'closed': 'Закрыта'
  };
  return statusLabels[status] || 'Активна';
}

// Функция для получения метки типа занятости
function getEmploymentTypeLabel(type) {
  const labels = {
    'full': 'Полная занятость',
    'part': 'Частичная занятость',
    'project': 'Проектная работа',
    'internship': 'Стажировка',
    'remote': 'Удаленная работа'
  };
  return labels[type] || type || 'Не указан';
}

// Функция для получения метки опыта
function getExperienceLabel(experience) {
  const labels = {
    'no': 'Без опыта',
    '1-3': '1-3 года',
    '3-6': '3-6 лет',
    '6+': 'Более 6 лет'
  };
  return labels[experience] || experience || 'Не указан';
}

// Функция для получения метки графика работы
function getWorkScheduleLabel(schedule) {
  const labels = {
    'full': 'Полный день',
    'shift': 'Сменный график',
    'flexible': 'Гибкий график',
    'remote': 'Удаленная работа'
  };
  return labels[schedule] || schedule || 'Не указан';
}

// Загрузка откликов соискателя
async function loadSeekerApplications(userId) {
  applicationsList.innerHTML = '<h3>Мои отклики</h3>';
  
  try {
    const q = query(collection(db, 'applications'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      applicationsList.innerHTML += '<p>У вас пока нет откликов</p>';
      return;
    }
    
    for (const app of snapshot.docs) {
      const appData = app.data();
      const job = await getDoc(doc(db, 'vacancies', appData.jobId));
      
      if (job.exists()) {
        const jobData = job.data();
        applicationsList.innerHTML += `
          <div class="application-item">
            <h4>${jobData.title}</h4>
            <p><strong>Компания:</strong> ${jobData.companyName}</p>
            <p><strong>Описание:</strong> ${jobData.description}</p>
            <p><strong>Дата отклика:</strong> ${appData.appliedAt.toDate().toLocaleString()}</p>
            <p><strong>Статус:</strong> ${appData.status === 'pending' ? 'На рассмотрении' : appData.status}</p>
            <hr>
          </div>
        `;
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки откликов:', error);
    applicationsList.innerHTML += '<p>Ошибка загрузки откликов</p>';
  }
}

// Загрузка вакансий работодателя
async function loadEmployerVacancies(employerId) {
  applicationsList.innerHTML = `
    <div class="employer-header">
      <h3>Мои вакансии</h3>
      <a href="add-job.html" class="add-vacancy-btn">➕ Добавить вакансию</a>
    </div>
  `;
  
  try {
    const jobsQ = query(collection(db, 'vacancies'), where('createdBy', '==', employerId));
    const jobs = await getDocs(jobsQ);
    
    if (jobs.empty) {
      applicationsList.innerHTML += `
        <div class="no-vacancies">
          <p>У вас пока нет вакансий</p>
          <a href="add-job.html" class="add-vacancy-btn">Добавить первую вакансию</a>
        </div>
      `;
      return;
    }
    
    for (const job of jobs.docs) {
      const jobData = job.data();
      
      // Получаем количество откликов на эту вакансию
      const appsQ = query(collection(db, 'applications'), where('jobId', '==', job.id));
      const apps = await getDocs(appsQ);
      
      applicationsList.innerHTML += `
        <div class="vacancy-item" data-id="${job.id}">
          <div class="vacancy-header">
            <h4>${jobData.title || 'Без названия'}</h4>
            <span class="status-badge ${jobData.status || 'active'}">${getStatusLabel(jobData.status)}</span>
          </div>
          <div class="vacancy-info">
            <p><strong>Компания:</strong> ${jobData.companyName || 'Не указана'}</p>
            <p><strong>Зарплата:</strong> ${jobData.salary || 'Не указана'}</p>
            <p><strong>Город:</strong> ${jobData.city || 'Не указан'}</p>
            <p><strong>Тип занятости:</strong> ${getEmploymentTypeLabel(jobData.employmentType)}</p>
            <p><strong>Опыт:</strong> ${getExperienceLabel(jobData.experience)}</p>
            <p><strong>Откликов:</strong> ${apps.size}</p>
            <p><strong>Опубликовано:</strong> ${jobData.createdAt?.toDate?.()?.toLocaleDateString() || 'Неизвестно'}</p>
          </div>
          <div class="vacancy-description">
            <p>${jobData.description || 'Описание отсутствует'}</p>
          </div>
          <div class="vacancy-actions">
            <button class="edit-btn" onclick="editVacancy('${job.id}')">✏️ Редактировать</button>
            <button class="view-applications-btn" onclick="viewApplications('${job.id}')">📋 Отклики (${apps.size})</button>
            <button class="delete-btn" onclick="deleteVacancy('${job.id}')">🗑️ Удалить</button>
            <button class="status-btn" onclick="changeVacancyStatus('${job.id}', '${jobData.status || 'active'}')">🔄 Изменить статус</button>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Ошибка загрузки вакансий:', error);
    applicationsList.innerHTML += `
      <div class="error-message">
        <p>Ошибка загрузки вакансий: ${error.message}</p>
      </div>
    `;
  }
}

// Функция для просмотра откликов на вакансию
window.viewApplications = async function(jobId) {
  try {
    const applicationsSection = document.createElement('div');
    applicationsSection.className = 'applications-section';
    applicationsSection.innerHTML = '<h4>Отклики на вакансию</h4>';
    
    const appsQ = query(collection(db, 'applications'), where('jobId', '==', jobId));
    const apps = await getDocs(appsQ);
    
    if (apps.empty) {
      applicationsSection.innerHTML += '<p>На эту вакансию пока нет откликов</p>';
    } else {
      for (const app of apps.docs) {
        const appData = app.data();
        const applicant = await getDoc(doc(db, 'users', appData.userId));
        const resume = applicant.data().resume || {};
        
        applicationsSection.innerHTML += `
          <div class="applicant-item">
            <div class="applicant-info">
              <p><strong>Соискатель:</strong> ${resume.name || 'N/A'} ${resume.surname || ''}</p>
              <p><strong>Email:</strong> ${resume.email || 'N/A'}</p>
              <p><strong>Телефон:</strong> ${resume.phone || 'N/A'}</p>
              <p><strong>Специальность:</strong> ${resume.profession || 'N/A'}</p>
              <p><strong>Город:</strong> ${resume.city || 'N/A'}</p>
              <p><strong>Желаемая зарплата:</strong> ${resume.salary || 'N/A'}</p>
              <p><strong>Дата отклика:</strong> ${appData.appliedAt.toDate().toLocaleString()}</p>
            </div>
            <div class="applicant-actions">
              <button class="view-resume-btn" onclick="viewFullResume('${appData.userId}')">👁️ Посмотреть полное резюме</button>
              <button class="download-resume-btn" onclick="downloadResume('${appData.userId}')">📄 Скачать PDF</button>
            </div>
          </div>
        `;
      }
    }
    
    showModal(applicationsSection);
  } catch (error) {
    console.error('Ошибка загрузки откликов:', error);
    alert('Ошибка загрузки откликов: ' + error.message);
  }
};

// Функция для просмотра полного резюме
window.viewFullResume = async function(userId) {
  try {
    const applicant = await getDoc(doc(db, 'users', userId));
    const resume = applicant.data().resume || {};
    
    const resumeSection = document.createElement('div');
    resumeSection.className = 'full-resume';
    resumeSection.innerHTML = `
      <h4>Резюме соискателя</h4>
      <div class="resume-content">
        <div class="resume-section">
          <h5>👤 Личная информация</h5>
          <p><strong>ФИО:</strong> ${resume.name || 'Не указано'} ${resume.surname || ''} ${resume.patronymic || ''}</p>
          <p><strong>Дата рождения:</strong> ${resume.birthDate || 'Не указана'}</p>
          <p><strong>Email:</strong> ${resume.email || 'Не указан'}</p>
          <p><strong>Телефон:</strong> ${resume.phone || 'Не указан'}</p>
          <p><strong>Город:</strong> ${resume.city || 'Не указан'}</p>
          <p><strong>Гражданство:</strong> ${resume.citizenship || 'Не указано'}</p>
        </div>
        
        <div class="resume-section">
          <h5>💼 Профессиональная информация</h5>
          <p><strong>Специальность:</strong> ${resume.profession || 'Не указана'}</p>
          <p><strong>Желаемая зарплата:</strong> ${resume.salary || 'Не указана'}</p>
          <p><strong>Тип занятости:</strong> ${getEmploymentTypeLabel(resume.employmentType)}</p>
          <p><strong>График работы:</strong> ${getWorkScheduleLabel(resume.workSchedule)}</p>
        </div>
        
        ${resume.experience ? `
        <div class="resume-section">
          <h5>📈 Опыт работы</h5>
          <p>${resume.experience}</p>
        </div>
        ` : ''}
        
        ${resume.skills ? `
        <div class="resume-section">
          <h5>🛠️ Навыки</h5>
          <p>${resume.skills}</p>
        </div>
        ` : ''}
        
        ${resume.about ? `
        <div class="resume-section">
          <h5>👋 О себе</h5>
          <p>${resume.about}</p>
        </div>
        ` : ''}
        
        ${resume.education ? `
        <div class="resume-section">
          <h5>🎓 Образование</h5>
          <p>${resume.education}</p>
        </div>
        ` : ''}
        
        ${resume.language ? `
        <div class="resume-section">
          <h5>🌐 Знание языков</h5>
          <p>${resume.language}</p>
        </div>
        ` : ''}
      </div>
      <div class="resume-actions">
        <button class="download-resume-btn" onclick="downloadResume('${userId}')">📄 Скачать PDF</button>
        <button class="close-btn" onclick="closeModal()">Закрыть</button>
      </div>
    `;
    
    showModal(resumeSection);
  } catch (error) {
    alert('Ошибка загрузки резюме: ' + error.message);
  }
};

// Функция для скачивания резюме в PDF
window.downloadResume = async function(userId) {
  try {
    const applicant = await getDoc(doc(db, 'users', userId));
    const resume = applicant.data().resume || {};
    
    if (!resume.name) {
      alert('Резюме соискателя не найдено');
      return;
    }

    const docDefinition = {
      content: [
        // Заголовок
        { text: 'РЕЗЮМЕ', style: 'header' },
        
        // Личная информация
        { text: 'Личная информация:', style: 'sectionHeader' },
        `ФИО: ${resume.name || 'Не указано'} ${resume.surname || ''} ${resume.patronymic || ''}`.trim(),
        `Дата рождения: ${resume.birthDate || 'Не указана'}`,
        `Email: ${resume.email || 'Не указан'}`,
        `Телефон: ${resume.phone || 'Не указан'}`,
        `Город: ${resume.city || 'Не указан'}`,
        `Гражданство: ${resume.citizenship || 'Не указано'}`,
        { text: '', margin: [0, 5] },
        
        // Профессиональная информация
        { text: 'Профессиональная информация:', style: 'sectionHeader' },
        `Специальность: ${resume.profession || 'Не указана'}`,
        `Желаемая зарплата: ${resume.salary || 'Не указана'}`,
        `Тип занятости: ${getEmploymentTypeLabel(resume.employmentType)}`,
        `График работы: ${getWorkScheduleLabel(resume.workSchedule)}`,
        { text: '', margin: [0, 5] },
        
        // Опыт работы (если есть)
        ...(resume.experience ? [
          { text: 'Опыт работы:', style: 'sectionHeader' },
          { text: resume.experience, margin: [0, 0, 0, 10] }
        ] : []),
        
        // Навыки (если есть)
        ...(resume.skills ? [
          { text: 'Навыки:', style: 'sectionHeader' },
          { text: resume.skills, margin: [0, 0, 0, 10] }
        ] : []),
        
        // О себе (если есть)
        ...(resume.about ? [
          { text: 'О себе:', style: 'sectionHeader' },
          { text: resume.about, margin: [0, 0, 0, 10] }
        ] : []),
        
        // Образование (если есть)
        ...(resume.education ? [
          { text: 'Образование:', style: 'sectionHeader' },
          { text: resume.education, margin: [0, 0, 0, 10] }
        ] : []),
        
        // Языки (если есть)
        ...(resume.language ? [
          { text: 'Знание языков:', style: 'sectionHeader' },
          { text: resume.language, margin: [0, 0, 0, 10] }
        ] : [])
      ],
      
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 15]
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          margin: [0, 10, 0, 5]
        }
      },
      
      // Настройки страницы
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      defaultStyle: {
        fontSize: 12,
        lineHeight: 1.3
      }
    };

    // Скачиваем PDF
    const fileName = `resume_${resume.name}_${resume.surname || ''}.pdf`.replace(/\s+/g, '_');
    pdfMake.createPdf(docDefinition).download(fileName);
    
  } catch (error) {
    console.error('Ошибка при создании PDF:', error);
    alert('Ошибка при создании резюме: ' + error.message);
  }
};

// Функция для изменения статуса вакансии
window.changeVacancyStatus = async function(jobId, currentStatus) {
  const statuses = {
    'active': 'Активна',
    'paused': 'На паузе', 
    'closed': 'Закрыта'
  };
  
  const newStatus = prompt(
    `Текущий статус: ${statuses[currentStatus]}\n\nВведите новый статус:\n- active (Активна)\n- paused (На паузе)\n- closed (Закрыта)`,
    currentStatus
  );
  
  if (newStatus && ['active', 'paused', 'closed'].includes(newStatus)) {
    try {
      await updateDoc(doc(db, 'vacancies', jobId), {
        status: newStatus
      });
      alert(`Статус вакансии изменен на: ${statuses[newStatus]}`);
      window.location.reload();
    } catch (error) {
      alert('Ошибка при изменении статуса: ' + error.message);
    }
  } else if (newStatus) {
    alert('Неверный статус. Используйте: active, paused или closed');
  }
};

// Функция для редактирования вакансии
window.editVacancy = function(jobId) {
  window.location.href = `edit-vacancy.html?id=${jobId}`;
};

// Функция для удаления вакансии
window.deleteVacancy = async function(jobId) {
  if (!confirm('Вы уверены, что хотите удалить эту вакансию? Все отклики на нее также будут удалены.')) {
    return;
  }

  try {
    // Удаляем вакансию
    await deleteDoc(doc(db, 'vacancies', jobId));
    
    // Удаляем все связанные отклики
    const appsQ = query(collection(db, 'applications'), where('jobId', '==', jobId));
    const apps = await getDocs(appsQ);
    
    const deletePromises = apps.docs.map(app => deleteDoc(app.ref));
    await Promise.all(deletePromises);
    
    alert('Вакансия и все отклики на нее успешно удалены!');
    window.location.reload();
  } catch (error) {
    alert('Ошибка при удалении вакансии: ' + error.message);
  }
};

// Вспомогательные функции для модального окна
function showModal(content) {
  let modal = document.getElementById('custom-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'custom-modal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-button">&times;</span>
        <div class="modal-body"></div>
      </div>
    `;
    document.body.appendChild(modal);
    
    modal.querySelector('.close-button').onclick = closeModal;
    modal.onclick = function(event) {
      if (event.target === modal) {
        closeModal();
      }
    };
  }
  
  modal.querySelector('.modal-body').innerHTML = '';
  modal.querySelector('.modal-body').appendChild(content);
  modal.style.display = 'block';
}

function closeModal() {
  const modal = document.getElementById('custom-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

// Основная инициализация - ИСПРАВЛЕННАЯ СТРОКА
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const role = userDoc.data().role;
      applicationsList.innerHTML = '';
      
      if (role === 'seeker') {
        await loadSeekerApplications(user.uid);
      } else if (role === 'employer') {
        await loadEmployerVacancies(user.uid);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных пользователя:', error);
      applicationsList.innerHTML = '<p>Ошибка загрузки данных</p>';
    }
  } else {
    window.location.href = 'register.html';
  }
});