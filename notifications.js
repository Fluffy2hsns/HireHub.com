// import { 
//   auth, 
//   db, 
//   onAuthStateChanged, 
//   getDocs, 
//   collection, 
//   query, 
//   where, 
//   getDoc, 
//   doc, 
//   updateDoc,
//   addDoc,
//   serverTimestamp 
// } from "./firebase.js";

// const notificationsList = document.getElementById('notifications-list');

// console.log('🔔 notifications.js загружен');

// // Основная инициализация
// onAuthStateChanged(auth, async (user) => {
//   console.log('🔑 Статус авторизации:', user ? 'Пользователь авторизован' : 'Нет пользователя');
  
//   if (user) {
//     console.log('👤 UID работодателя:', user.uid);
//     await loadNotifications(user.uid);
//   } else {
//     notificationsList.innerHTML = '<p>Пожалуйста, войдите в систему</p>';
//   }
// });

// // Загрузка уведомлений работодателя
// async function loadNotifications(employerId) {
//   console.log('📥 Загружаем уведомления для employerId:', employerId);
  
//   notificationsList.innerHTML = '<p>Загрузка уведомлений...</p>';
  
//   try {
//     const q = query(
//       collection(db, 'notifications'), 
//       where('employerId', '==', employerId)
//     );
    
//     const snapshot = await getDocs(q);
//     console.log('✅ Найдено уведомлений:', snapshot.size);
    
//     notificationsList.innerHTML = '';
    
//     if (snapshot.empty) {
//       notificationsList.innerHTML = '<p>У вас пока нет уведомлений</p>';
//       return;
//     }
    
//     // Сортируем по дате (новые первыми)
//     const sortedNotifications = snapshot.docs.sort((a, b) => 
//       b.data().createdAt?.toDate() - a.data().createdAt?.toDate()
//     );
    
//     for (const notifDoc of sortedNotifications) {
//       const notif = notifDoc.data();
//       console.log('📋 Обрабатываем уведомление:', notif.jobTitle);
      
//       const applicant = await getDoc(doc(db, 'users', notif.applicantId));
//       const resume = applicant.data().resume || {};
      
//       const notificationElement = document.createElement('div');
//       notificationElement.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
      
//       // Условие для кнопки обратной связи
//       const showFeedbackButton = !notif.feedback;
      
//       const feedbackButton = showFeedbackButton ? `
//         <button class="feedback-btn" onclick="showFeedbackForm('${notifDoc.id}', '${notif.applicantId}', '${notif.jobId}', '${notif.jobTitle}')">
//           📝 Дать обратную связь
//         </button>
//       ` : '';
      
//       // Существующий фидбек
//       const existingFeedback = notif.feedback ? `
//         <div class="existing-feedback">
//           <p><strong>Ваш ответ:</strong> ${notif.feedback}</p>
//           <p><strong>Статус:</strong> ${notif.feedbackStatus === 'accepted' ? '✅ Приглашение' : '❌ Отказ'}</p>
//           <p><strong>Отправлено:</strong> ${notif.feedbackSentAt?.toDate().toLocaleString() || 'Неизвестно'}</p>
//         </div>
//       ` : '';
      
//       notificationElement.innerHTML = `
//         <h4>Новый отклик на вакансию "${notif.jobTitle}"</h4>
//         <p><strong>Соискатель:</strong> ${notif.applicantName}</p>
//         <p><strong>Специальность:</strong> ${notif.applicantProfession}</p>
//         <p><strong>Email:</strong> ${resume.email || 'Не указан'}</p>
//         <p><strong>Телефон:</strong> ${resume.phone || 'Не указан'}</p>
//         <p><strong>Дата отклика:</strong> ${notif.createdAt?.toDate().toLocaleString() || 'Неизвестно'}</p>
        
//         ${existingFeedback}
        
//         <div class="notification-actions">
//           <button class="view-resume-btn" onclick="viewFullResume('${notif.applicantId}')">👁️ Посмотреть резюме</button>
//           <button class="download-resume-btn" onclick="downloadResume('${notif.applicantId}')">📄 Скачать PDF</button>
//           ${feedbackButton}
//           ${!notif.read ? `<button class="mark-read-btn" onclick="markAsRead('${notifDoc.id}')">Отметить как прочитанное</button>` : ''}
//         </div>
//         <hr>
//       `;
      
//       notificationsList.appendChild(notificationElement);
//     }
    
//     console.log('✅ Все уведомления загружены');
    
//   } catch (error) {
//     console.error('💥 Ошибка загрузки уведомлений:', error);
//     notificationsList.innerHTML = '<p>Ошибка загрузки уведомлений</p>';
//   }
// }

// // Функция для показа формы обратной связи
// window.showFeedbackForm = function(notificationId, applicantId, jobId, jobTitle) {
//   console.log('📝 Открываем форму обратной связи для:', jobTitle);
  
//   const feedbackSection = document.createElement('div');
//   feedbackSection.className = 'feedback-form';
//   feedbackSection.innerHTML = `
//     <h4>Обратная связь для соискателя</h4>
//     <p><strong>Вакансия:</strong> ${jobTitle}</p>
    
//     <div class="feedback-options">
//       <label>
//         <input type="radio" name="feedbackStatus" value="accepted" checked>
//         ✅ Пригласить на собеседование
//       </label>
//       <label>
//         <input type="radio" name="feedbackStatus" value="rejected">
//         ❌ Отказать
//       </label>
//     </div>
    
//     <textarea id="feedback-message" placeholder="Напишите сообщение для соискателя..." rows="4"></textarea>
    
//     <div class="feedback-templates">
//       <p><strong>Шаблоны сообщений:</strong></p>
//       <button type="button" onclick="fillTemplate('accepted')">🎯 Приглашение на собеседование</button>
//       <button type="button" onclick="fillTemplate('rejected')">😔 Вежливый отказ</button>
//     </div>
    
//     <div class="feedback-actions">
//       <button class="send-feedback-btn" onclick="sendFeedback('${notificationId}', '${applicantId}', '${jobId}')">
//         📤 Отправить обратную связь
//       </button>
//       <button class="cancel-btn" onclick="closeModal()">Отмена</button>
//     </div>
//   `;
  
//   showModal(feedbackSection);
// };

// // Функция для заполнения шаблонов сообщений
// window.fillTemplate = function(type) {
//   const textarea = document.getElementById('feedback-message');
//   const statusRadio = document.querySelector(`input[value="${type}"]`);
  
//   if (statusRadio) {
//     statusRadio.checked = true;
//   }
  
//   if (type === 'accepted') {
//     textarea.value = 'Здравствуйте! Мы рассмотрели ваше резюме и хотели бы пригласить вас на собеседование. Пожалуйста, сообщите удобное для вас время.';
//   } else if (type === 'rejected') {
//     textarea.value = 'Благодарим вас за отклик на нашу вакансию. К сожалению, на данный момент ваша кандидатура нам не подходит. Желаем успехов в поиске работы!';
//   }
// };

// // Функция для отправки обратной связи
// window.sendFeedback = async function(notificationId, applicantId, jobId) {
//   const feedbackMessage = document.getElementById('feedback-message').value;
//   const feedbackStatus = document.querySelector('input[name="feedbackStatus"]:checked').value;
  
//   if (!feedbackMessage.trim()) {
//     alert('Пожалуйста, напишите сообщение для соискателя');
//     return;
//   }
  
//   try {
//     console.log('📤 Отправляем обратную связь...');
    
//     // Обновляем уведомление у работодателя
//     await updateDoc(doc(db, 'notifications', notificationId), {
//       feedback: feedbackMessage,
//       feedbackStatus: feedbackStatus,
//       feedbackSentAt: serverTimestamp(),
//       read: true
//     });
    
//     // Создаем уведомление для соискателя
//     const jobDoc = await getDoc(doc(db, 'vacancies', jobId));
//     const jobData = jobDoc.data();
    
//     await addDoc(collection(db, 'applicant_notifications'), {
//       type: 'employer_feedback',
//       applicantId: applicantId,
//       employerId: auth.currentUser.uid,
//       jobId: jobId,
//       jobTitle: jobData.title,
//       companyName: jobData.companyName,
//       feedback: feedbackMessage,
//       feedbackStatus: feedbackStatus,
//       createdAt: serverTimestamp(),
//       read: false
//     });
    
//     // Обновляем статус отклика
//     const applicationsQuery = query(
//       collection(db, 'applications'),
//       where('jobId', '==', jobId),
//       where('userId', '==', applicantId)
//     );
    
//     const applications = await getDocs(applicationsQuery);
//     if (!applications.empty) {
//       await updateDoc(doc(db, 'applications', applications.docs[0].id), {
//         status: feedbackStatus === 'accepted' ? 'invited' : 'rejected'
//       });
//     }
    
//     alert('✅ Обратная связь успешно отправлена!');
//     closeModal();
//     await loadNotifications(auth.currentUser.uid);
    
//   } catch (error) {
//     console.error('💥 Ошибка отправки обратной связи:', error);
//     alert('Ошибка при отправке обратной связи: ' + error.message);
//   }
// };

// // Функция для просмотра полного резюме
// window.viewFullResume = async function(userId) {
//   try {
//     const applicant = await getDoc(doc(db, 'users', userId));
//     const resume = applicant.data().resume || {};
    
//     const resumeSection = document.createElement('div');
//     resumeSection.className = 'full-resume';
//     resumeSection.innerHTML = `
//       <h4>Резюме соискателя</h4>
//       <div class="resume-content">
//         <div class="resume-section">
//           <h5>Личная информация</h5>
//           <p><strong>Имя:</strong> ${resume.name || 'Не указано'} ${resume.surname || ''}</p>
//           <p><strong>Email:</strong> ${resume.email || 'Не указан'}</p>
//           <p><strong>Телефон:</strong> ${resume.phone || 'Не указан'}</p>
//         </div>
//         <div class="resume-section">
//           <h5>Профессиональная информация</h5>
//           <p><strong>Специальность:</strong> ${resume.profession || 'Не указана'}</p>
//         </div>
//         ${resume.about ? `
//         <div class="resume-section">
//           <h5>О себе</h5>
//           <p>${resume.about}</p>
//         </div>
//         ` : ''}
//       </div>
//       <div class="resume-actions">
//         <button class="download-resume-btn" onclick="downloadResume('${userId}')">📄 Скачать PDF</button>
//         <button class="close-btn" onclick="closeModal()">Закрыть</button>
//       </div>
//     `;
    
//     showModal(resumeSection);
//   } catch (error) {
//     alert('Ошибка загрузки резюме: ' + error.message);
//   }
// };

// // Функция для скачивания резюме в PDF
// window.downloadResume = async function(userId) {
//   try {
//     const applicant = await getDoc(doc(db, 'users', userId));
//     const resume = applicant.data().resume || {};
    
//     if (!resume.name) {
//       alert('Резюме соискателя не найдено');
//       return;
//     }

//     const docDefinition = {
//       content: [
//         // Заголовок
//         { text: 'РЕЗЮМЕ', style: 'header' },
        
//         // Личная информация
//         { text: 'Личная информация:', style: 'sectionHeader' },
//         `ФИО: ${resume.name} ${resume.surname || ''} ${resume.patronymic || ''}`.trim(),
//         `Email: ${resume.email || 'Не указан'}`,
//         `Телефон: ${resume.phone || 'Не указан'}`,
//         { text: '', margin: [0, 5] }, // отступ
        
//         // Специальность
//         { text: 'Специальность:', style: 'sectionHeader' },
//         resume.profession || 'Не указана',
//         { text: '', margin: [0, 5] },
        
//         // О себе (если есть)
//         ...(resume.about ? [
//           { text: 'О себе:', style: 'sectionHeader' },
//           { text: resume.about, margin: [0, 0, 0, 10] }
//         ] : []),
        
//         // Навыки (если есть)
//         ...(resume.skills ? [
//           { text: 'Навыки:', style: 'sectionHeader' },
//           { text: resume.skills, margin: [0, 0, 0, 10] }
//         ] : []),
        
//         // Опыт работы (если есть)
//         ...(resume.experience ? [
//           { text: 'Опыт работы:', style: 'sectionHeader' },
//           { text: resume.experience, margin: [0, 0, 0, 10] }
//         ] : [])
//       ],
      
//       styles: {
//         header: {
//           fontSize: 18,
//           bold: true,
//           alignment: 'center',
//           margin: [0, 0, 0, 15]
//         },
//         sectionHeader: {
//           fontSize: 14,
//           bold: true,
//           margin: [0, 10, 0, 5]
//         }
//       },
      
//       // Настройки страницы
//       pageSize: 'A4',
//       pageMargins: [40, 40, 40, 40],
//       defaultStyle: {
//         fontSize: 12,
//         lineHeight: 1.3
//       }
//     };

//     // Скачиваем PDF
//     const fileName = `resume_${resume.name}_${resume.surname || ''}.pdf`.replace(/\s+/g, '_');
//     pdfMake.createPdf(docDefinition).download(fileName);
    
//   } catch (error) {
//     console.error('Ошибка при создании PDF:', error);
//     alert('Ошибка при создании резюме: ' + error.message);
//   }
// };

// // Функция для отметки как прочитанного
// window.markAsRead = async function(notificationId) {
//   try {
//     await updateDoc(doc(db, 'notifications', notificationId), {
//       read: true
//     });
    
//     const button = document.querySelector(`[onclick="markAsRead('${notificationId}')"]`);
//     if (button) {
//       button.style.display = 'none';
//       button.parentElement.parentElement.classList.add('read');
//     }
//   } catch (error) {
//     alert('Ошибка при обновлении уведомления: ' + error.message);
//   }
// };

// // Функции для модального окна
// function showModal(content) {
//   let modal = document.getElementById('custom-modal');
//   if (!modal) {
//     modal = document.createElement('div');
//     modal.id = 'custom-modal';
//     modal.className = 'modal';
//     modal.innerHTML = `
//       <div class="modal-content">
//         <span class="close-button">&times;</span>
//         <div class="modal-body"></div>
//       </div>
//     `;
//     document.body.appendChild(modal);
    
//     modal.querySelector('.close-button').onclick = closeModal;
//     modal.onclick = function(event) {
//       if (event.target === modal) {
//         closeModal();
//       }
//     };
//   }
  
//   modal.querySelector('.modal-body').innerHTML = '';
//   modal.querySelector('.modal-body').appendChild(content);
//   modal.style.display = 'block';
// }

// function closeModal() {
//   const modal = document.getElementById('custom-modal');
//   if (modal) {
//     modal.style.display = 'none';
//   }
// }

// // Отладочная функция
// window.debugNotifications = async function() {
//   const user = auth.currentUser;
//   if (!user) {
//     console.log('❌ Пользователь не авторизован');
//     return;
//   }
  
//   console.log('=== 🔍 ОТЛАДКА УВЕДОМЛЕНИЙ ===');
//   console.log('UID работодателя:', user.uid);
  
//   const q = query(collection(db, 'notifications'), where('employerId', '==', user.uid));
//   const snapshot = await getDocs(q);
  
//   console.log('📊 Всего уведомлений:', snapshot.size);
  
//   snapshot.docs.forEach((doc, index) => {
//     const data = doc.data();
//     console.log(`📋 Уведомление ${index + 1}:`, {
//       id: doc.id,
//       read: data.read,
//       hasFeedback: !!data.feedback,
//       feedbackStatus: data.feedbackStatus,
//       jobTitle: data.jobTitle,
//       applicantName: data.applicantName
//     });
//   });
// };




// notifications.js
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
  updateDoc,
  addDoc,
  serverTimestamp,
  deleteDoc
} from "./firebase.js";

const notificationsList = document.getElementById('notifications-list');

console.log('🔔 notifications.js загружен');

// Основная инициализация
onAuthStateChanged(auth, async (user) => {
  console.log('🔑 Статус авторизации:', user ? 'Пользователь авторизован' : 'Нет пользователя');
  
  if (user) {
    console.log('👤 UID работодателя:', user.uid);
    await loadNotifications(user.uid);
  } else {
    notificationsList.innerHTML = '<p>Пожалуйста, войдите в систему</p>';
  }
});

// Загрузка уведомлений работодателя
async function loadNotifications(employerId) {
  console.log('📥 Загружаем уведомления для employerId:', employerId);
  
  notificationsList.innerHTML = '<p>Загрузка уведомлений...</p>';
  
  try {
    const q = query(
      collection(db, 'notifications'), 
      where('employerId', '==', employerId)
    );
    
    const snapshot = await getDocs(q);
    console.log('✅ Найдено уведомлений:', snapshot.size);
    
    notificationsList.innerHTML = '';
    
    if (snapshot.empty) {
      notificationsList.innerHTML = `
        <div class="no-notifications">
          <p>📭 У вас пока нет уведомлений</p>
          <p>Здесь будут появляться отклики на вакансии и сообщения от соискателей</p>
        </div>
      `;
      return;
    }
    
    // Сортируем по дате (новые первыми)
    const sortedNotifications = snapshot.docs.sort((a, b) => 
      b.data().createdAt?.toDate() - a.data().createdAt?.toDate()
    );
    
    for (const notifDoc of sortedNotifications) {
      const notif = notifDoc.data();
      console.log('📋 Обрабатываем уведомление:', notif.type, notif.jobTitle);
      
      await displayNotification(notifDoc.id, notif);
    }
    
    console.log('✅ Все уведомления загружены');
    
  } catch (error) {
    console.error('💥 Ошибка загрузки уведомлений:', error);
    notificationsList.innerHTML = `
      <div class="error-message">
        <p>Ошибка загрузки уведомлений</p>
        <p>${error.message}</p>
      </div>
    `;
  }
}

// Отображение уведомления в зависимости от типа
async function displayNotification(notificationId, notif) {
  const notificationElement = document.createElement('div');
  notificationElement.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
  
  let notificationHTML = '';
  
  // Разные шаблоны для разных типов уведомлений
  if (notif.type === 'new_chat') {
    notificationHTML = await getNewChatNotificationHTML(notificationId, notif);
  } else if (notif.type === 'new_message') {
    notificationHTML = getNewMessageNotificationHTML(notificationId, notif);
  } else if (notif.type === 'new_application') {
    notificationHTML = await getNewApplicationNotificationHTML(notificationId, notif);
  } else {
    // Универсальный шаблон для неизвестных типов
    notificationHTML = getDefaultNotificationHTML(notificationId, notif);
  }
  
  notificationElement.innerHTML = notificationHTML;
  notificationsList.appendChild(notificationElement);
}

// Шаблон для нового чата
async function getNewChatNotificationHTML(notificationId, notif) {
  try {
    const applicant = await getDoc(doc(db, 'users', notif.applicantId));
    const resume = applicant.data().resume || {};
    
    return `
      <div class="notification-header">
        <h4>💬 Новое сообщение от соискателя</h4>
        <span class="notification-date">
          ${notif.createdAt?.toDate().toLocaleString() || 'Неизвестно'}
        </span>
      </div>
      
      <div class="notification-content">
        <p><strong>Соискатель:</strong> ${notif.applicantName}</p>
        <p><strong>Вакансия:</strong> ${notif.jobTitle}</p>
        <p><strong>Сообщение:</strong> ${notif.message || 'Начал чат с вами'}</p>
        <p><strong>Контакты:</strong> ${resume.phone || 'Не указан'} | ${resume.email || 'Не указан'}</p>
      </div>
      
      <div class="notification-actions">
        <button class="chat-btn" onclick="openChat('${notif.chatId}')">
          💬 Ответить в чате
        </button>
        <button class="view-resume-btn" onclick="viewFullResume('${notif.applicantId}')">
          👁️ Посмотреть резюме
        </button>
        ${!notif.read ? `
          <button class="mark-read-btn" onclick="markAsRead('${notificationId}')">
            Отметить как прочитанное
          </button>
        ` : ''}
        <button class="delete-btn" onclick="deleteNotification('${notificationId}')">
          🗑️ Удалить
        </button>
      </div>
      <hr>
    `;
  } catch (error) {
    console.error('Ошибка загрузки данных соискателя:', error);
    return getErrorNotificationHTML(notificationId, notif, 'Ошибка загрузки данных соискателя');
  }
}

// Шаблон для нового сообщения в чате
function getNewMessageNotificationHTML(notificationId, notif) {
  return `
    <div class="notification-header">
      <h4>💬 Новое сообщение в чате</h4>
      <span class="notification-date">
        ${notif.createdAt?.toDate().toLocaleString() || 'Неизвестно'}
      </span>
    </div>
    
    <div class="notification-content">
      <p><strong>От:</strong> ${notif.applicantName}</p>
      <p><strong>Вакансия:</strong> ${notif.jobTitle}</p>
      <p><strong>Сообщение:</strong> "${notif.message}"</p>
    </div>
    
    <div class="notification-actions">
      <button class="chat-btn" onclick="openChat('${notif.chatId}')">
        💬 Перейти к чату
      </button>
      ${!notif.read ? `
        <button class="mark-read-btn" onclick="markAsRead('${notificationId}')">
          Отметить как прочитанное
        </button>
      ` : ''}
      <button class="delete-btn" onclick="deleteNotification('${notificationId}')">
        🗑️ Удалить
      </button>
    </div>
    <hr>
  `;
}

// Шаблон для нового отклика
async function getNewApplicationNotificationHTML(notificationId, notif) {
  try {
    const applicant = await getDoc(doc(db, 'users', notif.applicantId));
    const resume = applicant.data().resume || {};
    
    const showFeedbackButton = !notif.feedback;
    
    const feedbackButton = showFeedbackButton ? `
      <button class="feedback-btn" onclick="showFeedbackForm('${notificationId}', '${notif.applicantId}', '${notif.jobId}', '${notif.jobTitle}')">
        📝 Дать обратную связь
      </button>
    ` : '';
    
    const existingFeedback = notif.feedback ? `
      <div class="existing-feedback">
        <p><strong>Ваш ответ:</strong> ${notif.feedback}</p>
        <p><strong>Статус:</strong> ${notif.feedbackStatus === 'accepted' ? '✅ Приглашение' : '❌ Отказ'}</p>
        <p><strong>Отправлено:</strong> ${notif.feedbackSentAt?.toDate().toLocaleString() || 'Неизвестно'}</p>
      </div>
    ` : '';
    
    return `
      <h4>📨 Новый отклик на вакансию "${notif.jobTitle}"</h4>
      <p><strong>Соискатель:</strong> ${notif.applicantName}</p>
      <p><strong>Специальность:</strong> ${notif.applicantProfession}</p>
      <p><strong>Email:</strong> ${resume.email || 'Не указан'}</p>
      <p><strong>Телефон:</strong> ${resume.phone || 'Не указан'}</p>
      <p><strong>Дата отклика:</strong> ${notif.createdAt?.toDate().toLocaleString() || 'Неизвестно'}</p>
      
      ${existingFeedback}
      
      <div class="notification-actions">
        <button class="view-resume-btn" onclick="viewFullResume('${notif.applicantId}')">
          👁️ Посмотреть резюме
        </button>
        <button class="chat-btn" onclick="startChatFromNotification('${notif.jobId}', '${notif.applicantId}', '${notif.jobTitle}')">
          💬 Начать чат
        </button>
        ${feedbackButton}
        ${!notif.read ? `
          <button class="mark-read-btn" onclick="markAsRead('${notificationId}')">
            Отметить как прочитанное
          </button>
        ` : ''}
      </div>
      <hr>
    `;
  } catch (error) {
    console.error('Ошибка загрузки данных соискателя:', error);
    return getErrorNotificationHTML(notificationId, notif, 'Ошибка загрузки данных соискателя');
  }
}

// Универсальный шаблон
function getDefaultNotificationHTML(notificationId, notif) {
  return `
    <div class="notification-header">
      <h4>📢 Уведомление</h4>
      <span class="notification-date">
        ${notif.createdAt?.toDate().toLocaleString() || 'Неизвестно'}
      </span>
    </div>
    
    <div class="notification-content">
      <p><strong>Тип:</strong> ${notif.type}</p>
      <p><strong>Сообщение:</strong> ${notif.message || 'Нет дополнительной информации'}</p>
    </div>
    
    <div class="notification-actions">
      ${!notif.read ? `
        <button class="mark-read-btn" onclick="markAsRead('${notificationId}')">
          Отметить как прочитанное
        </button>
      ` : ''}
      <button class="delete-btn" onclick="deleteNotification('${notificationId}')">
        🗑️ Удалить
      </button>
    </div>
    <hr>
  `;
}

// Шаблон для ошибок
function getErrorNotificationHTML(notificationId, notif, errorMessage) {
  return `
    <div class="notification-header">
      <h4>❌ Ошибка загрузки уведомления</h4>
      <span class="notification-date">
        ${notif.createdAt?.toDate().toLocaleString() || 'Неизвестно'}
      </span>
    </div>
    
    <div class="notification-content">
      <p><strong>Тип:</strong> ${notif.type}</p>
      <p><strong>Ошибка:</strong> ${errorMessage}</p>
    </div>
    
    <div class="notification-actions">
      <button class="delete-btn" onclick="deleteNotification('${notificationId}')">
        🗑️ Удалить
      </button>
    </div>
    <hr>
  `;
}

// Новые функции для работы с чатами
window.openChat = function(chatId) {
  window.location.href = `chats.html?chat=${chatId}`;
};

window.startChatFromNotification = async function(jobId, applicantId, jobTitle) {
  try {
    const currentUser = auth.currentUser;
    
    if (!window.chatManager || !window.chatManager.isInitialized) {
      window.chatManager.init(currentUser, 'employer');
    }
    
    const chat = await window.chatManager.getOrCreateChat(
      jobId, 
      applicantId, 
      currentUser.uid, 
      jobTitle
    );
    
    window.location.href = `chats.html?chat=${chat.id}`;
    
  } catch (error) {
    console.error('Ошибка начала чата:', error);
    alert('Ошибка начала чата: ' + error.message);
  }
};

window.deleteNotification = async function(notificationId) {
  if (!confirm('Удалить это уведомление?')) {
    return;
  }

  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    await loadNotifications(auth.currentUser.uid);
  } catch (error) {
    alert('Ошибка при удалении уведомления: ' + error.message);
  }
};

// Существующие функции (добавьте их если их нет)
window.showFeedbackForm = function(notificationId, applicantId, jobId, jobTitle) {
  const feedbackSection = document.createElement('div');
  feedbackSection.className = 'feedback-form';
  feedbackSection.innerHTML = `
    <h4>Обратная связь для соискателя</h4>
    <p><strong>Вакансия:</strong> ${jobTitle}</p>
    
    <div class="feedback-options">
      <label>
        <input type="radio" name="feedbackStatus" value="accepted" checked>
        ✅ Пригласить на собеседование
      </label>
      <label>
        <input type="radio" name="feedbackStatus" value="rejected">
        ❌ Отказать
      </label>
    </div>
    
    <textarea id="feedback-message" placeholder="Напишите сообщение для соискателя..." rows="4"></textarea>
    
    <div class="feedback-actions">
      <button class="send-feedback-btn" onclick="sendFeedback('${notificationId}', '${applicantId}', '${jobId}')">
        📤 Отправить обратную связь
      </button>
      <button class="cancel-btn" onclick="closeModal()">Отмена</button>
    </div>
  `;
  
  showModal(feedbackSection);
};

window.sendFeedback = async function(notificationId, applicantId, jobId) {
  const feedbackMessage = document.getElementById('feedback-message').value;
  const feedbackStatus = document.querySelector('input[name="feedbackStatus"]:checked').value;
  
  if (!feedbackMessage.trim()) {
    alert('Пожалуйста, напишите сообщение для соискателя');
    return;
  }
  
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      feedback: feedbackMessage,
      feedbackStatus: feedbackStatus,
      feedbackSentAt: serverTimestamp(),
      read: true
    });
    
    // Создаем уведомление для соискателя
    const jobDoc = await getDoc(doc(db, 'vacancies', jobId));
    const jobData = jobDoc.data();
    
    await addDoc(collection(db, 'applicant_notifications'), {
      type: 'employer_feedback',
      applicantId: applicantId,
      employerId: auth.currentUser.uid,
      jobId: jobId,
      jobTitle: jobData.title,
      companyName: jobData.companyName,
      feedback: feedbackMessage,
      feedbackStatus: feedbackStatus,
      createdAt: serverTimestamp(),
      read: false
    });
    
    alert('✅ Обратная связь успешно отправлена!');
    closeModal();
    await loadNotifications(auth.currentUser.uid);
    
  } catch (error) {
    console.error('Ошибка отправки обратной связи:', error);
    alert('Ошибка при отправке обратной связи: ' + error.message);
  }
};

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
          <h5>Личная информация</h5>
          <p><strong>Имя:</strong> ${resume.name || 'Не указано'} ${resume.surname || ''}</p>
          <p><strong>Email:</strong> ${resume.email || 'Не указан'}</p>
          <p><strong>Телефон:</strong> ${resume.phone || 'Не указан'}</p>
        </div>
        <div class="resume-section">
          <h5>Профессиональная информация</h5>
          <p><strong>Специальность:</strong> ${resume.profession || 'Не указана'}</p>
        </div>
        ${resume.about ? `
        <div class="resume-section">
          <h5>О себе</h5>
          <p>${resume.about}</p>
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

window.markAsRead = async function(notificationId) {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true
    });
    
    // Обновляем отображение
    const button = document.querySelector(`[onclick="markAsRead('${notificationId}')"]`);
    if (button) {
      button.style.display = 'none';
      button.parentElement.parentElement.classList.add('read');
    }
  } catch (error) {
    alert('Ошибка при обновлении уведомления: ' + error.message);
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

// Добавьте в конец notifications.js
window.debugNotifications = async function() {
  const user = auth.currentUser;
  if (!user) {
    console.log('❌ Пользователь не авторизован');
    return;
  }
  
  console.log('=== 🔍 ОТЛАДКА УВЕДОМЛЕНИЙ ===');
  console.log('UID работодателя:', user.uid);
  
  try {
    const q = query(collection(db, 'notifications'), where('employerId', '==', user.uid));
    const snapshot = await getDocs(q);
    
    console.log('📊 Всего уведомлений в базе:', snapshot.size);
    
    if (snapshot.empty) {
      console.log('📭 Уведомлений нет');
      return;
    }
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📋 Уведомление ${index + 1}:`, {
        id: doc.id,
        type: data.type,
        read: data.read,
        jobTitle: data.jobTitle,
        applicantName: data.applicantName,
        message: data.message,
        createdAt: data.createdAt?.toDate?.() || 'Нет даты'
      });
    });
    
    // Проверим также чаты
    const chatsQuery = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid));
    const chatsSnapshot = await getDocs(chatsQuery);
    console.log('💬 Всего чатов:', chatsSnapshot.size);
    
  } catch (error) {
    console.error('❌ Ошибка отладки:', error);
  }
};

// Автоматически вызываем отладку при загрузке
setTimeout(() => {
  if (auth.currentUser) {
    console.log('🔄 Автоматическая отладка уведомлений...');
    window.debugNotifications();
  }
}, 2000);