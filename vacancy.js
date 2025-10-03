// // vacancy.js
// import { 
//   db, getDoc, doc, updateDoc, deleteDoc,
//   addDoc, collection, serverTimestamp, getDocs, query, where 
// } from "./firebase.js";

// const vacancyContent = document.getElementById('vacancy-content');
// const vacancyActions = document.getElementById('vacancy-actions');

// let currentVacancyId = null;
// let currentVacancy = null;

// const urlParams = new URLSearchParams(window.location.search);
// currentVacancyId = urlParams.get('id');

// console.log('Vacancy ID:', currentVacancyId);

// const checkAuthAndLoad = setInterval(() => {
//   if (window.authManager) {
//     clearInterval(checkAuthAndLoad);
//     loadVacancy();
//   }
// }, 100);

// async function loadVacancy() {
//   console.log('Loading vacancy with ID:', currentVacancyId);
  
//   if (!currentVacancyId) {
//     vacancyContent.innerHTML = '<p>Вакансия не найдена. Не указан ID.</p>';
//     return;
//   }

//   try {
//     const vacancyDoc = await getDoc(doc(db, 'vacancies', currentVacancyId));
//     console.log('Vacancy document:', vacancyDoc);
    
//     if (!vacancyDoc.exists()) {
//       vacancyContent.innerHTML = '<p>Вакансия не найдена в базе данных.</p>';
//       return;
//     }

//     currentVacancy = { 
//       id: vacancyDoc.id, 
//       ...vacancyDoc.data(),
//       createdAt: vacancyDoc.data().createdAt || new Date()
//     };
    
//     console.log('Vacancy data loaded:', currentVacancy);
//     displayVacancy(currentVacancy);
//     await displayActions(currentVacancy);
    
//   } catch (error) {
//     console.error('Ошибка загрузки вакансии:', error);
//     vacancyContent.innerHTML = `
//       <div class="error-message">
//         <p>Ошибка загрузки вакансии</p>
//         <p>${error.message}</p>
//       </div>
//     `;
//   }
// }

// function displayVacancy(vacancy) {
//   const employmentTypeLabels = {
//     'full': 'Полная занятость',
//     'part': 'Частичная занятость',
//     'project': 'Проектная работа',
//     'internship': 'Стажировка',
//     'remote': 'Удаленная работа'
//   };

//   const experienceLabels = {
//     'no': 'Без опыта',
//     '1-3': '1-3 года',
//     '3-6': '3-6 лет',
//     '6+': 'Более 6 лет'
//   };

//   vacancyContent.innerHTML = `
//     <div class="vacancy-header">
//       <h1>${vacancy.title || 'Без названия'}</h1>
//       <p class="company-name">${vacancy.companyName || 'Компания не указана'}</p>
//       <p class="vacancy-meta">
//         <span class="salary">💵 ${vacancy.salary || 'Зарплата не указана'}</span> • 
//         <span class="city">📍 ${vacancy.city || 'Город не указан'}</span> • 
//         <span class="employment-type">${employmentTypeLabels[vacancy.employmentType] || 'Тип не указан'}</span>
//       </p>
//     </div>

//     <div class="vacancy-details">
//       <div class="detail-section">
//         <h3>📋 Описание вакансии</h3>
//         <p>${vacancy.description || 'Описание отсутствует'}</p>
//       </div>

//       ${vacancy.requirements ? `
//       <div class="detail-section">
//         <h3>🎯 Требования</h3>
//         <p>${vacancy.requirements}</p>
//       </div>
//       ` : ''}

//       ${vacancy.benefits ? `
//       <div class="detail-section">
//         <h3>⭐ Условия</h3>
//         <p>${vacancy.benefits}</p>
//       </div>
//       ` : ''}

//       <div class="detail-section">
//         <h3>ℹ️ Дополнительная информация</h3>
//         <div class="info-grid">
//           <div class="info-item">
//             <strong>Опыт работы:</strong>
//             <span>${experienceLabels[vacancy.experience] || 'Не указан'}</span>
//           </div>
//           <div class="info-item">
//             <strong>Тип занятости:</strong>
//             <span>${employmentTypeLabels[vacancy.employmentType] || 'Не указан'}</span>
//           </div>
//           <div class="info-item">
//             <strong>Город:</strong>
//             <span>${vacancy.city || 'Не указан'}</span>
//           </div>
//           ${vacancy.contactEmail ? `
//           <div class="info-item">
//             <strong>Контакты:</strong>
//             <span>${vacancy.contactEmail}</span>
//           </div>
//           ` : ''}
//           <div class="info-item">
//             <strong>Статус:</strong>
//             <span>${getStatusLabel(vacancy.status)}</span>
//           </div>
//         </div>
//       </div>

//       <div class="vacancy-footer">
//         <small>Опубликовано: ${vacancy.createdAt?.toDate?.()?.toLocaleDateString() || 'Неизвестно'}</small>
//       </div>
//     </div>
//   `;
// }

// function getStatusLabel(status) {
//   const statusLabels = {
//     'active': 'Активна',
//     'paused': 'На паузе', 
//     'closed': 'Закрыта'
//   };
//   return statusLabels[status] || 'Активна';
// }

// // async function displayActions(vacancy) {
// //   const currentUser = window.authManager.getUser();
// //   const currentRole = window.authManager.getRole();
  
// //   console.log('Displaying actions for:', { 
// //     user: currentUser?.uid, 
// //     role: currentRole,
// //     vacancyOwner: vacancy.createdBy 
// //   });

// //   vacancyActions.innerHTML = '';

// //   if (!currentUser) {
// //     vacancyActions.innerHTML = `
// //       <div class="auth-required">
// //         <p>Чтобы откликнуться на вакансию, <a href="register.html">войдите в аккаунт</a></p>
// //       </div>
// //     `;
// //     return;
// //   }

// //   try {
// //     if (currentRole === 'seeker') {
// //       const applicationsQuery = query(
// //         collection(db, 'applications'),
// //         where('jobId', '==', vacancy.id),
// //         where('userId', '==', currentUser.uid)
// //       );
// //       const applications = await getDocs(applicationsQuery);

// //       if (!applications.empty) {
// //         const appData = applications.docs[0].data();
// //         vacancyActions.innerHTML = `
// //           <button class="applied-btn" disabled>✅ Вы уже откликнулись на эту вакансию</button>
// //           ${appData.status === 'accepted' ? `<button class="chat-btn" onclick="startChatWithEmployer('${vacancy.id}', '${vacancy.createdBy}', '${vacancy.title}')">💬 Написать работодателю</button>` : ''}
// //         `;
// //       } else {
// //         vacancyActions.innerHTML = `
// //           <button class="apply-btn" onclick="applyToVacancy()">📨 Откликнуться на вакансию</button>
// //         `;
// //       }
// //     } else if (currentRole === 'employer' && vacancy.createdBy === currentUser.uid) {
// //       vacancyActions.innerHTML = `
// //         <div class="employer-actions">
// //           <h4>Управление вакансией</h4>
// //           <button class="edit-btn" onclick="editVacancy()">✏️ Редактировать вакансию</button>
// //           <button class="delete-btn" onclick="deleteVacancy()">🗑️ Удалить вакансию</button>
// //           <a href="applications.html" class="view-applications-btn">📋 Посмотреть отклики</a>
// //           <div class="status-info">
// //             <p><strong>Статус:</strong> ${getStatusLabel(vacancy.status)}</p>
// //           </div>
// //         </div>
// //       `;
// //     } else if (currentRole === 'employer') {
// //       vacancyActions.innerHTML = `
// //         <div class="employer-info">
// //           <p>Это вакансия другой компании</p>
// //           <a href="add-job.html" class="add-job-btn">➕ Добавить свою вакансию</a>
// //         </div>
// //       `;
// //     }
// //   } catch (error) {
// //     console.error('Ошибка в displayActions:', error);
// //     vacancyActions.innerHTML = '<p>Ошибка загрузки действий</p>';
// //   }
// // }

// // В vacancy.js, в функцию displayActions добавьте:

// async function displayActions(vacancy) {
//   const currentUser = window.authManager.getUser();
//   const currentRole = window.authManager.getRole();
  
//   console.log('Displaying actions for:', { 
//     user: currentUser?.uid, 
//     role: currentRole,
//     vacancyOwner: vacancy.createdBy 
//   });

//   vacancyActions.innerHTML = '';

//   if (!currentUser) {
//     vacancyActions.innerHTML = `
//       <div class="auth-required">
//         <p>Чтобы откликнуться на вакансию, <a href="register.html">войдите в аккаунт</a></p>
//       </div>
//     `;
//     return;
//   }

//   try {
//     if (currentRole === 'seeker') {
//       const applicationsQuery = query(
//         collection(db, 'applications'),
//         where('jobId', '==', vacancy.id),
//         where('userId', '==', currentUser.uid)
//       );
//       const applications = await getDocs(applicationsQuery);

//       if (!applications.empty) {
//         const appData = applications.docs[0].data();
//         vacancyActions.innerHTML = `
//           <button class="applied-btn" disabled>✅ Вы уже откликнулись на эту вакансию</button>
//           <button class="chat-btn" onclick="startChatWithEmployer('${vacancy.id}', '${vacancy.createdBy}', '${vacancy.title}')">💬 Написать работодателю</button>
//         `;
//       } else {
//         vacancyActions.innerHTML = `
//           <button class="apply-btn" onclick="applyToVacancy()">📨 Откликнуться на вакансию</button>
//           <button class="chat-btn" onclick="startChatWithEmployer('${vacancy.id}', '${vacancy.createdBy}', '${vacancy.title}')">💬 Задать вопрос работодателю</button>
//         `;
//       }
//     } else if (currentRole === 'employer' && vacancy.createdBy === currentUser.uid) {
//       vacancyActions.innerHTML = `
//         <div class="employer-actions">
//           <h4>Управление вакансией</h4>
//           <button class="edit-btn" onclick="editVacancy()">✏️ Редактировать вакансию</button>
//           <button class="delete-btn" onclick="deleteVacancy()">🗑️ Удалить вакансию</button>
//           <a href="applications.html" class="view-applications-btn">📋 Посмотреть отклики</a>
//           <button class="chat-btn" onclick="viewChatsForVacancy('${vacancy.id}')">💬 Чаты с соискателями</button>
//           <div class="status-info">
//             <p><strong>Статус:</strong> ${getStatusLabel(vacancy.status)}</p>
//           </div>
//         </div>
//       `;
//     } else if (currentRole === 'employer') {
//       vacancyActions.innerHTML = `
//         <div class="employer-info">
//           <p>Это вакансия другой компании</p>
//           <a href="add-job.html" class="add-job-btn">➕ Добавить свою вакансию</a>
//         </div>
//       `;
//     }
//   } catch (error) {
//     console.error('Ошибка в displayActions:', error);
//     vacancyActions.innerHTML = '<p>Ошибка загрузки действий</p>';
//   }
// }

// // Добавьте новые функции в window:
// window.startChatWithEmployer = async function(jobId, employerId, jobTitle) {
//   try {
//     console.log('🔄 Начало чата с работодателем...');
    
//     const currentUser = window.authManager.getUser();
//     const currentRole = window.authManager.getRole();
    
//     if (!currentUser || currentRole !== 'seeker') {
//       alert('Только соискатели могут начинать чаты с работодателями');
//       return;
//     }
    
//     // Инициализируем chatManager если нужно
//     if (!window.chatManager.isInitialized) {
//       window.chatManager.init(currentUser, currentRole);
//     }
    
//     console.log('📨 Создание чата:', { jobId, employerId, jobTitle });
    
//     const chat = await window.chatManager.getOrCreateChat(
//       jobId, 
//       currentUser.uid, 
//       employerId, 
//       jobTitle
//     );
    
//     console.log('✅ Чат создан, переход...');
    
//     window.location.href = `chats.html?chat=${chat.id}`;
    
//   } catch (error) {
//     console.error('❌ Ошибка начала чата:', error);
//     alert('Ошибка начала чата: ' + error.message);
//   }
// };

// window.viewChatsForVacancy = function(jobId) {
//   window.location.href = `chats.html?job=${jobId}`;
// };





// window.startChatWithEmployer = async function(jobId, employerId, jobTitle) {
//   try {
//     console.log('🔄 Начало чата с работодателем...');
    
//     if (!window.chatManager || !window.chatManager.isInitialized) {
//       console.log('🔄 Инициализируем ChatManager...');
//       const currentUser = window.authManager.getUser();
//       const currentRole = window.authManager.getRole();
      
//       if (!currentUser || !currentRole) {
//         alert('Ошибка: пользователь не авторизован');
//         return;
//       }
      
//       window.chatManager.init(currentUser, currentRole);
//     }

//     const currentUser = window.authManager.getUser();
    
//     console.log('📨 Создание чата:', { jobId, employerId, jobTitle });
    
//     const chat = await window.chatManager.getOrCreateChat(
//       jobId, 
//       currentUser.uid, 
//       employerId, 
//       jobTitle
//     );
    
//     console.log('✅ Чат создан, переход...');
    
//     window.location.href = `chats.html?chat=${chat.id}`;
    
//   } catch (error) {
//     console.error('❌ Ошибка начала чата:', error);
    
//     if (error.message.includes('не инициализирован')) {
//       if (confirm('Необходимо перезагрузить страницу для работы чата. Перезагрузить?')) {
//         window.location.reload();
//       }
//     } else {
//       alert('Ошибка начала чата: ' + error.message);
//     }
//   }
// };

// window.applyToVacancy = async function() {
//   const currentUser = window.authManager.getUser();
  
//   if (!currentUser || !currentVacancy) {
//     alert('Ошибка: пользователь не авторизован или вакансия не загружена');
//     return;
//   }

//   try {
//     const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
//     if (!userDoc.data().resume) {
//       alert('Пожалуйста, создайте резюме перед откликом на вакансии!');
//       window.location.href = 'resume.html';
//       return;
//     }

//     await addDoc(collection(db, 'applications'), {
//       jobId: currentVacancy.id,
//       userId: currentUser.uid,
//       appliedAt: new Date(),
//       status: 'pending'
//     });

//     const applicantData = userDoc.data().resume;
    
//     await addDoc(collection(db, 'notifications'), {
//       type: 'new_application',
//       employerId: currentVacancy.createdBy,
//       applicantId: currentUser.uid,
//       jobId: currentVacancy.id,
//       jobTitle: currentVacancy.title,
//       applicantName: `${applicantData.name} ${applicantData.surname}`,
//       applicantProfession: applicantData.profession,
//       createdAt: serverTimestamp(),
//       read: false
//     });

//     alert('✅ Ваш отклик успешно отправлен!');
//     await displayActions(currentVacancy);
//   } catch (error) {
//     alert('Ошибка при отправке отклика: ' + error.message);
//   }
// };

// window.editVacancy = function() {
//   window.location.href = `edit-vacancy.html?id=${currentVacancyId}`;
// };

// window.deleteVacancy = async function() {
//   if (!confirm('Вы уверены, что хотите удалить эту вакансию? Это действие нельзя отменить.')) {
//     return;
//   }

//   try {
//     await deleteDoc(doc(db, 'vacancies', currentVacancyId));
//     alert('Вакансия успешно удалена!');
//     window.location.href = 'index.html';
//   } catch (error) {
//     alert('Ошибка при удалении вакансии: ' + error.message);
//   }
// };




// vacancy.js
import { 
  db, getDoc, doc, updateDoc, deleteDoc,
  addDoc, collection, serverTimestamp, getDocs, query, where 
} from "./firebase.js";

const vacancyContent = document.getElementById('vacancy-content');
const vacancyActions = document.getElementById('vacancy-actions');

let currentVacancyId = null;
let currentVacancy = null;

const urlParams = new URLSearchParams(window.location.search);
currentVacancyId = urlParams.get('id');

console.log('Vacancy ID:', currentVacancyId);

// Ждем инициализации authManager
const checkAuthAndLoad = setInterval(() => {
  if (window.authManager && window.authManager.isInitialized) {
    clearInterval(checkAuthAndLoad);
    loadVacancy();
  }
}, 100);

// Таймаут на случай проблем
setTimeout(() => {
  if (!window.authManager) {
    console.log('⚠️ AuthManager не загрузился, грузим вакансию без него');
    loadVacancy();
  }
}, 3000);

async function loadVacancy() {
  console.log('Loading vacancy with ID:', currentVacancyId);
  
  if (!currentVacancyId) {
    vacancyContent.innerHTML = '<p>Вакансия не найдена. Не указан ID.</p>';
    return;
  }

  try {
    const vacancyDoc = await getDoc(doc(db, 'vacancies', currentVacancyId));
    console.log('Vacancy document:', vacancyDoc);
    
    if (!vacancyDoc.exists()) {
      vacancyContent.innerHTML = '<p>Вакансия не найдена в базе данных.</p>';
      return;
    }

    currentVacancy = { 
      id: vacancyDoc.id, 
      ...vacancyDoc.data(),
      createdAt: vacancyDoc.data().createdAt || new Date()
    };
    
    console.log('Vacancy data loaded:', currentVacancy);
    displayVacancy(currentVacancy);
    await displayActions(currentVacancy);
    
  } catch (error) {
    console.error('Ошибка загрузки вакансии:', error);
    vacancyContent.innerHTML = `
      <div class="error-message">
        <p>Ошибка загрузки вакансии</p>
        <p>${error.message}</p>
      </div>
    `;
  }
}

function displayVacancy(vacancy) {
  const employmentTypeLabels = {
    'full': 'Полная занятость',
    'part': 'Частичная занятость',
    'project': 'Проектная работа',
    'internship': 'Стажировка',
    'remote': 'Удаленная работа'
  };

  const experienceLabels = {
    'no': 'Без опыта',
    '1-3': '1-3 года',
    '3-6': '3-6 лет',
    '6+': 'Более 6 лет'
  };

  vacancyContent.innerHTML = `
    <div class="vacancy-header">
      <h1>${vacancy.title || 'Без названия'}</h1>
      <p class="company-name">${vacancy.companyName || 'Компания не указана'}</p>
      <p class="vacancy-meta">
        <span class="salary">💵 ${vacancy.salary || 'Зарплата не указана'}</span> • 
        <span class="city">📍 ${vacancy.city || 'Город не указан'}</span> • 
        <span class="employment-type">${employmentTypeLabels[vacancy.employmentType] || 'Тип не указан'}</span>
      </p>
    </div>

    <div class="vacancy-details">
      <div class="detail-section">
        <h3>📋 Описание вакансии</h3>
        <p>${vacancy.description || 'Описание отсутствует'}</p>
      </div>

      ${vacancy.requirements ? `
      <div class="detail-section">
        <h3>🎯 Требования</h3>
        <p>${vacancy.requirements}</p>
      </div>
      ` : ''}

      ${vacancy.benefits ? `
      <div class="detail-section">
        <h3>⭐ Условия</h3>
        <p>${vacancy.benefits}</p>
      </div>
      ` : ''}

      <div class="detail-section">
        <h3>ℹ️ Дополнительная информация</h3>
        <div class="info-grid">
          <div class="info-item">
            <strong>Опыт работы:</strong>
            <span>${experienceLabels[vacancy.experience] || 'Не указан'}</span>
          </div>
          <div class="info-item">
            <strong>Тип занятости:</strong>
            <span>${employmentTypeLabels[vacancy.employmentType] || 'Не указан'}</span>
          </div>
          <div class="info-item">
            <strong>Город:</strong>
            <span>${vacancy.city || 'Не указан'}</span>
          </div>
          ${vacancy.contactEmail ? `
          <div class="info-item">
            <strong>Контакты:</strong>
            <span>${vacancy.contactEmail}</span>
          </div>
          ` : ''}
          <div class="info-item">
            <strong>Статус:</strong>
            <span>${getStatusLabel(vacancy.status)}</span>
          </div>
        </div>
      </div>

      <div class="vacancy-footer">
        <small>Опубликовано: ${vacancy.createdAt?.toDate?.()?.toLocaleDateString() || 'Неизвестно'}</small>
      </div>
    </div>
  `;
}

function getStatusLabel(status) {
  const statusLabels = {
    'active': 'Активна',
    'paused': 'На паузе', 
    'closed': 'Закрыта'
  };
  return statusLabels[status] || 'Активна';
}

async function displayActions(vacancy) {
  const currentUser = window.authManager?.getUser();
  const currentRole = window.authManager?.getRole();
  
  console.log('Displaying actions for:', { 
    user: currentUser?.uid, 
    role: currentRole,
    vacancyOwner: vacancy.createdBy 
  });

  vacancyActions.innerHTML = '';

  if (!currentUser) {
    vacancyActions.innerHTML = `
      <div class="auth-required">
        <p>Чтобы откликнуться на вакансию, <a href="register.html">войдите в аккаунт</a></p>
      </div>
    `;
    return;
  }

  try {
    if (currentRole === 'seeker') {
      await displaySeekerActions(vacancy, currentUser);
    } else if (currentRole === 'employer' && vacancy.createdBy === currentUser.uid) {
      displayEmployerActions(vacancy);
    } else if (currentRole === 'employer') {
      displayOtherEmployerActions();
    }
  } catch (error) {
    console.error('Ошибка в displayActions:', error);
    vacancyActions.innerHTML = '<p>Ошибка загрузки действий</p>';
  }
}

async function displaySeekerActions(vacancy, currentUser) {
  const applicationsQuery = query(
    collection(db, 'applications'),
    where('jobId', '==', vacancy.id),
    where('userId', '==', currentUser.uid)
  );
  const applications = await getDocs(applicationsQuery);

  if (!applications.empty) {
    const appData = applications.docs[0].data();
    vacancyActions.innerHTML = `
      <div class="seeker-actions">
        <button class="applied-btn" disabled>✅ Вы уже откликнулись на эту вакансию</button>
        <button class="chat-btn" onclick="startChatWithEmployer('${vacancy.id}', '${vacancy.createdBy}', '${vacancy.title}')">
          💬 Написать работодателю
        </button>
      </div>
    `;
  } else {
    vacancyActions.innerHTML = `
      <div class="seeker-actions">
        <button class="apply-btn" onclick="applyToVacancy()">📨 Откликнуться на вакансию</button>
        <button class="chat-btn" onclick="startChatWithEmployer('${vacancy.id}', '${vacancy.createdBy}', '${vacancy.title}')">
          💬 Задать вопрос работодателю
        </button>
      </div>
    `;
  }
}

function displayEmployerActions(vacancy) {
  vacancyActions.innerHTML = `
    <div class="employer-actions">
      <h4>Управление вакансией</h4>
      <button class="edit-btn" onclick="editVacancy()">✏️ Редактировать вакансию</button>
      <button class="delete-btn" onclick="deleteVacancy()">🗑️ Удалить вакансию</button>
      <a href="applications.html" class="view-applications-btn">📋 Посмотреть отклики</a>
      <button class="chat-btn" onclick="viewChatsForVacancy('${vacancy.id}')">💬 Чаты с соискателями</button>
      <div class="status-info">
        <p><strong>Статус:</strong> ${getStatusLabel(vacancy.status)}</p>
      </div>
    </div>
  `;
}

function displayOtherEmployerActions() {
  vacancyActions.innerHTML = `
    <div class="employer-info">
      <p>Это вакансия другой компании</p>
      <a href="add-job.html" class="add-job-btn">➕ Добавить свою вакансию</a>
    </div>
  `;
}

// Глобальные функции
window.startChatWithEmployer = async function(jobId, employerId, jobTitle) {
  try {
    console.log('🔄 Начало чата с работодателем...');
    
    const currentUser = window.authManager.getUser();
    const currentRole = window.authManager.getRole();
    
    if (!currentUser || currentRole !== 'seeker') {
      alert('Только соискатели могут начинать чаты с работодателями');
      return;
    }
    
    // Проверяем наличие chatManager
    if (!window.chatManager) {
      alert('Система чатов не загружена. Пожалуйста, обновите страницу.');
      return;
    }
    
    // Инициализируем chatManager если нужно
    if (!window.chatManager.isInitialized) {
      window.chatManager.init(currentUser, currentRole);
    }
    
    console.log('📨 Создание чата:', { jobId, employerId, jobTitle });
    
    const chat = await window.chatManager.getOrCreateChat(
      jobId, 
      currentUser.uid, 
      employerId, 
      jobTitle
    );
    
    console.log('✅ Чат создан, переход...');
    
    window.location.href = `my-chats.html?chat=${chat.id}`;
    
  } catch (error) {
    console.error('❌ Ошибка начала чата:', error);
    alert('Ошибка начала чата: ' + error.message);
  }
};

window.viewChatsForVacancy = function(jobId) {
  window.location.href = `chats.html?job=${jobId}`;
};

window.applyToVacancy = async function() {
  const currentUser = window.authManager.getUser();
  
  if (!currentUser || !currentVacancy) {
    alert('Ошибка: пользователь не авторизован или вакансия не загружена');
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (!userDoc.data().resume) {
      alert('Пожалуйста, создайте резюме перед откликом на вакансии!');
      window.location.href = 'resume.html';
      return;
    }

    await addDoc(collection(db, 'applications'), {
      jobId: currentVacancy.id,
      userId: currentUser.uid,
      appliedAt: new Date(),
      status: 'pending'
    });

    const applicantData = userDoc.data().resume;
    
    await addDoc(collection(db, 'notifications'), {
      type: 'new_application',
      employerId: currentVacancy.createdBy,
      applicantId: currentUser.uid,
      jobId: currentVacancy.id,
      jobTitle: currentVacancy.title,
      applicantName: `${applicantData.name} ${applicantData.surname}`,
      applicantProfession: applicantData.profession,
      createdAt: serverTimestamp(),
      read: false
    });

    alert('✅ Ваш отклик успешно отправлен!');
    await displayActions(currentVacancy);
  } catch (error) {
    alert('Ошибка при отправке отклика: ' + error.message);
  }
};

window.editVacancy = function() {
  window.location.href = `edit-vacancy.html?id=${currentVacancyId}`;
};

window.deleteVacancy = async function() {
  if (!confirm('Вы уверены, что хотите удалить эту вакансию? Это действие нельзя отменить.')) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'vacancies', currentVacancyId));
    alert('Вакансия успешно удалена!');
    window.location.href = 'index.html';
  } catch (error) {
    alert('Ошибка при удалении вакансии: ' + error.message);
  }
};