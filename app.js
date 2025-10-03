import { 
  db, collection, getDocs, addDoc, getDoc, doc, query, where, serverTimestamp 
} from "./firebase.js";

const jobsList = document.getElementById('jobs-list');
const searchInput = document.getElementById('search-input');
const filterBtn = document.getElementById('filter-btn');
const filtersModal = document.getElementById('filters-modal');
const applyFiltersBtn = document.getElementById('apply-filters');
const resetFiltersBtn = document.getElementById('reset-filters');
const filtersSummary = document.getElementById('filters-summary');

let allJobs = [];
let currentFilters = {
  profession: '',
  salaryMin: '',
  salaryMax: '',
  city: '',
  employmentType: [],
  experience: []
};

// Ждем инициализации authManager с таймаутом
const initApp = setInterval(() => {
  if (window.authManager) {
    clearInterval(initApp);
    console.log('✅ AuthManager загружен, роль:', window.authManager.getRole());
    loadJobs();
    initFilters();
  }
}, 100);

// Если authManager не загрузился за 3 секунды, все равно грузим вакансии
setTimeout(() => {
  if (!window.authManager) {
    console.log('⚠️ AuthManager не загружен, но грузим вакансии');
    clearInterval(initApp);
    loadJobs();
    initFilters();
  }
}, 3000);

async function loadJobs() {
  jobsList.innerHTML = '<p>Загрузка вакансий...</p>';
  
  try {
    const snapshot = await getDocs(collection(db, 'vacancies'));
    allJobs = snapshot.docs.map(d => ({ 
      id: d.id, 
      ...d.data(),
      createdAt: d.data().createdAt || new Date()
    }));
    
    console.log(`✅ Загружено ${allJobs.length} вакансий`);
    applyFilters();
    
  } catch (error) {
    console.error('Ошибка загрузки вакансий:', error);
    jobsList.innerHTML = '<p>Ошибка загрузки вакансий</p>';
  }
}

function initFilters() {
  filterBtn.addEventListener('click', () => {
    filtersModal.style.display = 'block';
  });

  filtersModal.querySelector('.close-button').addEventListener('click', () => {
    filtersModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === filtersModal) {
      filtersModal.style.display = 'none';
    }
  });

  applyFiltersBtn.addEventListener('click', () => {
    updateCurrentFilters();
    applyFilters();
    filtersModal.style.display = 'none';
  });

  resetFiltersBtn.addEventListener('click', () => {
    resetFilters();
    applyFilters();
    filtersModal.style.display = 'none';
  });

  searchInput.addEventListener('input', () => {
    applyFilters();
  });
}

function updateCurrentFilters() {
  currentFilters = {
    profession: document.getElementById('filter-profession').value.toLowerCase(),
    salaryMin: document.getElementById('filter-salary-min').value,
    salaryMax: document.getElementById('filter-salary-max').value,
    city: document.getElementById('filter-city').value.toLowerCase(),
    employmentType: Array.from(document.querySelectorAll('input[name="employmentType"]:checked'))
      .map(input => input.value),
    experience: Array.from(document.querySelectorAll('input[name="experience"]:checked'))
      .map(input => input.value)
  };
}

function resetFilters() {
  document.getElementById('filter-profession').value = '';
  document.getElementById('filter-salary-min').value = '';
  document.getElementById('filter-salary-max').value = '';
  document.getElementById('filter-city').value = '';
  
  document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false;
  });
  
  currentFilters = {
    profession: '',
    salaryMin: '',
    salaryMax: '',
    city: '',
    employmentType: [],
    experience: []
  };
  
  searchInput.value = '';
  
  updateFiltersSummary();
}

function applyFilters() {
  const searchQuery = searchInput.value.toLowerCase();
  
  const filteredJobs = allJobs.filter(job => {
    const matchesSearch = searchQuery === '' || 
      (job.title && job.title.toLowerCase().includes(searchQuery)) || 
      (job.description && job.description.toLowerCase().includes(searchQuery)) ||
      (job.companyName && job.companyName.toLowerCase().includes(searchQuery));
    
    if (!matchesSearch) return false;

    if (currentFilters.profession && job.title) {
      if (!job.title.toLowerCase().includes(currentFilters.profession)) {
        return false;
      }
    }

    if (currentFilters.city && job.city) {
      if (!job.city.toLowerCase().includes(currentFilters.city)) {
        return false;
      }
    }

    if (currentFilters.salaryMin || currentFilters.salaryMax) {
      const jobSalary = extractSalaryNumber(job.salary);
      if (jobSalary !== null) {
        if (currentFilters.salaryMin && jobSalary < parseInt(currentFilters.salaryMin)) {
          return false;
        }
        if (currentFilters.salaryMax && jobSalary > parseInt(currentFilters.salaryMax)) {
          return false;
        }
      }
    }

    if (currentFilters.employmentType.length > 0 && job.employmentType) {
      if (!currentFilters.employmentType.includes(job.employmentType)) {
        return false;
      }
    }

    if (currentFilters.experience.length > 0 && job.experience) {
      if (!currentFilters.experience.includes(job.experience)) {
        return false;
      }
    }

    return true;
  });

  displayJobs(filteredJobs);
  updateFiltersSummary();
}

function extractSalaryNumber(salaryText) {
  if (!salaryText) return null;
  
  const matches = salaryText.match(/\d+/g);
  if (matches && matches.length > 0) {
    return parseInt(matches[0]);
  }
  
  return null;
}

function displayJobs(jobs) {
  jobsList.innerHTML = '';
  
  if (jobs.length === 0) {
    jobsList.innerHTML = `
      <div class="no-jobs">
        <p>😔 Вакансии по вашему запросу не найдены</p>
        <p>Попробуйте изменить параметры поиска или фильтры</p>
      </div>
    `;
    return;
  }
  
  jobs.forEach(job => displayJob(job));
}

function displayJob(job) {
  const div = document.createElement('div');
  div.classList.add('job-item');
  div.style.cursor = 'pointer';
  div.onclick = () => {
    window.location.href = `vacancy.html?id=${job.id}`;
  };
  
  div.innerHTML = `
    <h3>${job.title || 'Без названия'}</h3>
    <p><strong>Компания:</strong> ${job.companyName || 'Не указана'}</p>
    <p><strong>Зарплата:</strong> ${job.salary || 'Не указана'}</p>
    <p><strong>Город:</strong> ${job.city || 'Не указан'}</p>
    <p><strong>Тип занятости:</strong> ${getEmploymentTypeLabel(job.employmentType)}</p>
    <p><strong>Опыт:</strong> ${getExperienceLabel(job.experience)}</p>
    <p class="job-description">${(job.description || '').substring(0, 150)}${job.description && job.description.length > 150 ? '...' : ''}</p>
    <small>Опубликовано: ${job.createdAt?.toDate?.()?.toLocaleDateString() || 'Неизвестно'}</small>
  `;
  
  // Показываем кнопку отклика ТОЛЬКО для соискателей
  const currentRole = window.authManager?.getRole();
  const currentUser = window.authManager?.getUser();
  
  console.log('Displaying job for:', { 
    role: currentRole, 
    user: currentUser?.uid,
    jobId: job.id 
  });
  
  // Кнопка "Откликнуться" показывается ТОЛЬКО соискателям
  if (currentRole === 'seeker') {
    const applyBtn = document.createElement('button');
    applyBtn.textContent = 'Откликнуться';
    applyBtn.classList.add('apply-job-btn');
    applyBtn.onclick = async (e) => {
      e.stopPropagation();
      await applyToJob(job.id);
    };
    div.appendChild(applyBtn);
  }
  
  // Для работодателей показываем информацию о своей вакансии
  if (currentRole === 'employer' && job.createdBy === currentUser?.uid) {
    const ownerBadge = document.createElement('div');
    ownerBadge.innerHTML = '<span style="color: #28a745; font-weight: bold;">👑 Ваша вакансия</span>';
    ownerBadge.style.marginTop = '10px';
    div.appendChild(ownerBadge);
  }
  
  jobsList.appendChild(div);
}

function updateFiltersSummary() {
  const activeFilters = [];
  
  if (searchInput.value) {
    activeFilters.push(`Поиск: "${searchInput.value}"`);
  }
  if (currentFilters.profession) {
    activeFilters.push(`Специальность: ${currentFilters.profession}`);
  }
  if (currentFilters.city) {
    activeFilters.push(`Город: ${currentFilters.city}`);
  }
  if (currentFilters.salaryMin || currentFilters.salaryMax) {
    const salaryText = [];
    if (currentFilters.salaryMin) salaryText.push(`от ${currentFilters.salaryMin}`);
    if (currentFilters.salaryMax) salaryText.push(`до ${currentFilters.salaryMax}`);
    activeFilters.push(`Зарплата: ${salaryText.join(' ')}`);
  }
  if (currentFilters.employmentType.length > 0) {
    activeFilters.push(`Тип занятости: ${currentFilters.employmentType.length}`);
  }
  if (currentFilters.experience.length > 0) {
    activeFilters.push(`Опыт: ${currentFilters.experience.length}`);
  }
  
  if (activeFilters.length > 0) {
    filtersSummary.style.display = 'block';
    filtersSummary.innerHTML = `
      <div class="active-filters">
        <strong>Активные фильтры:</strong>
        ${activeFilters.map(filter => `<span class="filter-tag">${filter}</span>`).join('')}
        <button onclick="resetFilters()" class="clear-filters-btn">❌ Очистить все</button>
      </div>
    `;
  } else {
    filtersSummary.style.display = 'none';
  }
}

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

function getExperienceLabel(experience) {
  const labels = {
    'no': 'Без опыта',
    '1-3': '1-3 года',
    '3-6': '3-6 лет',
    '6+': 'Более 6 лет'
  };
  return labels[experience] || experience || 'Не указан';
}

// УЛУЧШЕННАЯ ФУНКЦИЯ ОТКЛИКА
window.applyToJob = async function(jobId) {
  console.log('Applying to job:', jobId);
  
  const currentUser = window.authManager?.getUser();
  const currentRole = window.authManager?.getRole();
  
  if (!currentUser) {
    alert('Пожалуйста, войдите в систему чтобы откликнуться');
    window.location.href = 'register.html';
    return;
  }
  
  if (currentRole !== 'seeker') {
    alert('Только соискатели могут откликаться на вакансии');
    return;
  }
  
  try {
    // Проверяем есть ли резюме
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    const userData = userDoc.data();
    
    if (!userData.resume || !userData.resume.name) {
      alert('Пожалуйста, создайте резюме перед откликом на вакансии!');
      window.location.href = 'resume.html';
      return;
    }

    // Проверяем, не откликался ли уже
    const applicationsQuery = query(
      collection(db, 'applications'),
      where('jobId', '==', jobId),
      where('userId', '==', currentUser.uid)
    );
    const existingApplications = await getDocs(applicationsQuery);
    
    if (!existingApplications.empty) {
      alert('Вы уже откликались на эту вакансию');
      return;
    }

    // Создаем отклик
    await addDoc(collection(db, 'applications'), {
      jobId: jobId,
      userId: currentUser.uid,
      appliedAt: new Date(),
      status: 'pending'
    });

    // Создаем уведомление для работодателя
    const jobDoc = await getDoc(doc(db, 'vacancies', jobId));
    const jobData = jobDoc.data();
    
    const applicantData = userData.resume;
    
    await addDoc(collection(db, 'notifications'), {
      type: 'new_application',
      employerId: jobData.createdBy,
      applicantId: currentUser.uid,
      jobId: jobId,
      jobTitle: jobData.title,
      applicantName: `${applicantData.name} ${applicantData.surname || ''}`,
      applicantProfession: applicantData.profession,
      createdAt: serverTimestamp(),
      read: false
    });

    alert('✅ Ваш отклик успешно отправлен! Работодатель получил уведомление.');
    
    // Обновляем кнопку
    const applyBtn = document.querySelector(`[onclick="applyToJob('${jobId}')"]`);
    if (applyBtn) {
      applyBtn.textContent = '✅ Отклик отправлен';
      applyBtn.disabled = true;
    }
    
  } catch (error) {
    console.error('Ошибка при отправке отклика:', error);
    alert('Ошибка при отправке отклика: ' + error.message);
  }
};

window.resetFilters = resetFilters;

// Дополнительная проверка при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 Страница загружена, проверяем авторизацию...');
});