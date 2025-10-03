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


// В notifications.js замените функцию downloadResume
window.downloadResume = async function(userId) {
  try {
    console.log('📥 Загрузка данных резюме для пользователя:', userId);
    
    const applicant = await getDoc(doc(db, 'users', userId));
    const resume = applicant.data().resume || {};
    
    console.log('📋 Данные резюме:', resume);
    
    if (!resume.name) {
      alert('Резюме соискателя не найдено или не заполнено');
      return;
    }

    // Создаем более подробное PDF
    const docDefinition = {
      content: [
        // Заголовок
        { text: 'РЕЗЮМЕ', style: 'header' },
        { text: `${resume.profession || 'Специальность не указана'}`, style: 'subheader' },
        
        // Личная информация
        { text: 'Личная информация', style: 'sectionHeader' },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['ФИО:', `${resume.name || ''} ${resume.surname || ''} ${resume.patronymic || ''}`.trim()],
              ['Дата рождения:', resume.birthDate || 'Не указана'],
              ['Город:', resume.city || 'Не указан'],
              ['Гражданство:', resume.citizenship || 'Не указано'],
              ['Email:', resume.email || 'Не указан'],
              ['Телефон:', resume.phone || 'Не указан']
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 10]
        },
        
        // Профессиональная информация
        { text: 'Профессиональная информация', style: 'sectionHeader' },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              ['Желаемая должность:', resume.profession || 'Не указана'],
              ['Желаемая зарплата:', resume.salary || 'Не указана'],
              ['Тип занятости:', getEmploymentTypeLabel(resume.employmentType)],
              ['График работы:', getWorkScheduleLabel(resume.workSchedule)]
            ]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 10]
        },
        
        // Опыт работы (если есть)
        ...(resume.experience ? [
          { text: 'Опыт работы', style: 'sectionHeader' },
          { 
            text: resume.experience, 
            margin: [0, 0, 0, 10],
            style: 'normalText'
          }
        ] : []),
        
        // Навыки (если есть)
        ...(resume.skills ? [
          { text: 'Ключевые навыки', style: 'sectionHeader' },
          { 
            text: resume.skills, 
            margin: [0, 0, 0, 10],
            style: 'normalText'
          }
        ] : []),
        
        // Образование (если есть)
        ...(resume.education ? [
          { text: 'Образование', style: 'sectionHeader' },
          { 
            text: resume.education, 
            margin: [0, 0, 0, 10],
            style: 'normalText'
          }
        ] : []),
        
        // Знание языков (если есть)
        ...(resume.language ? [
          { text: 'Знание языков', style: 'sectionHeader' },
          { 
            text: resume.language, 
            margin: [0, 0, 0, 10],
            style: 'normalText'
          }
        ] : []),
        
        // О себе (если есть)
        ...(resume.about ? [
          { text: 'О себе', style: 'sectionHeader' },
          { 
            text: resume.about, 
            margin: [0, 0, 0, 10],
            style: 'normalText'
          }
        ] : []),
        
        // Дата создания резюме
        { 
          text: `Резюме создано: ${new Date().toLocaleDateString('ru-RU')}`, 
          style: 'footer',
          margin: [0, 20, 0, 0]
        }
      ],
      
      styles: {
        header: {
          fontSize: 20,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 16,
          bold: true,
          alignment: 'center',
          margin: [0, 0, 0, 20],
          color: '#666666'
        },
        sectionHeader: {
          fontSize: 14,
          bold: true,
          margin: [0, 15, 0, 8],
          color: '#2c5aa0'
        },
        normalText: {
          fontSize: 12,
          lineHeight: 1.4
        },
        footer: {
          fontSize: 10,
          italics: true,
          color: '#666666',
          alignment: 'center'
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
    const fileName = `resume_${resume.name}_${resume.surname || 'unknown'}.pdf`.replace(/\s+/g, '_');
    console.log('📄 Создание PDF:', fileName);
    
    pdfMake.createPdf(docDefinition).download(fileName);
    
  } catch (error) {
    console.error('❌ Ошибка при создании PDF:', error);
    alert('Ошибка при создании резюме: ' + error.message);
  }
};

// Добавьте вспомогательные функции для преобразования значений
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

function getWorkScheduleLabel(schedule) {
  const labels = {
    'full': 'Полный день',
    'shift': 'Сменный график',
    'flexible': 'Гибкий график',
    'remote': 'Удаленная работа'
  };
  return labels[schedule] || schedule || 'Не указан';
}



// В notifications.js замените функцию viewFullResume
window.viewFullResume = async function(userId) {
  try {
    console.log('👀 Просмотр полного резюме пользователя:', userId);
    
    const applicant = await getDoc(doc(db, 'users', userId));
    const resume = applicant.data().resume || {};
    
    console.log('📋 Полные данные резюме:', resume);
    
    const resumeSection = document.createElement('div');
    resumeSection.className = 'full-resume';
    resumeSection.innerHTML = `
      <h4>📄 Резюме соискателя</h4>
      
      <div class="resume-content">
        <!-- Личная информация -->
        <div class="resume-section">
          <h5>👤 Личная информация</h5>
          <div class="resume-grid">
            <div class="resume-field">
              <strong>ФИО:</strong> 
              <span>${resume.name || 'Не указано'} ${resume.surname || ''} ${resume.patronymic || ''}</span>
            </div>
            <div class="resume-field">
              <strong>Дата рождения:</strong> 
              <span>${resume.birthDate || 'Не указана'}</span>
            </div>
            <div class="resume-field">
              <strong>Город:</strong> 
              <span>${resume.city || 'Не указан'}</span>
            </div>
            <div class="resume-field">
              <strong>Гражданство:</strong> 
              <span>${resume.citizenship || 'Не указано'}</span>
            </div>
            <div class="resume-field">
              <strong>Email:</strong> 
              <span>${resume.email || 'Не указан'}</span>
            </div>
            <div class="resume-field">
              <strong>Телефон:</strong> 
              <span>${resume.phone || 'Не указан'}</span>
            </div>
          </div>
        </div>
        
        <!-- Профессиональная информация -->
        <div class="resume-section">
          <h5>💼 Профессиональная информация</h5>
          <div class="resume-grid">
            <div class="resume-field">
              <strong>Специальность:</strong> 
              <span>${resume.profession || 'Не указана'}</span>
            </div>
            <div class="resume-field">
              <strong>Желаемая зарплата:</strong> 
              <span>${resume.salary || 'Не указана'}</span>
            </div>
            <div class="resume-field">
              <strong>Тип занятости:</strong> 
              <span>${getEmploymentTypeLabel(resume.employmentType)}</span>
            </div>
            <div class="resume-field">
              <strong>График работы:</strong> 
              <span>${getWorkScheduleLabel(resume.workSchedule)}</span>
            </div>
          </div>
        </div>
        
        <!-- Опыт работы -->
        ${resume.experience ? `
        <div class="resume-section">
          <h5>📈 Опыт работы</h5>
          <div class="resume-text">${resume.experience}</div>
        </div>
        ` : ''}
        
        <!-- Навыки -->
        ${resume.skills ? `
        <div class="resume-section">
          <h5>🛠️ Навыки</h5>
          <div class="resume-text">${resume.skills}</div>
        </div>
        ` : ''}
        
        <!-- Образование -->
        ${resume.education ? `
        <div class="resume-section">
          <h5>🎓 Образование</h5>
          <div class="resume-text">${resume.education}</div>
        </div>
        ` : ''}
        
        <!-- Знание языков -->
        ${resume.language ? `
        <div class="resume-section">
          <h5>🌐 Знание языков</h5>
          <div class="resume-text">${resume.language}</div>
        </div>
        ` : ''}
        
        <!-- О себе -->
        ${resume.about ? `
        <div class="resume-section">
          <h5>👋 О себе</h5>
          <div class="resume-text">${resume.about}</div>
        </div>
        ` : ''}
      </div>
      
      <div class="resume-actions">
        <button class="download-resume-btn" onclick="downloadResume('${userId}')">
          📄 Скачать PDF
        </button>
        <button class="close-btn" onclick="closeModal()">Закрыть</button>
      </div>
    `;
    
    showModal(resumeSection);
    
  } catch (error) {
    console.error('❌ Ошибка загрузки резюме:', error);
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


// Добавьте в конец notifications.js

// Глобальные функции для модального окна
window.closeModal = function() {
  const modal = document.getElementById('custom-modal');
  if (modal) {
    modal.style.display = 'none';
  }
  console.log('✅ Модальное окно закрыто');
};

window.showModal = function(content) {
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
    
    // Обработчик для кнопки закрытия
    modal.querySelector('.close-button').onclick = window.closeModal;
    
    // Обработчик для клика вне модального окна
    modal.onclick = function(event) {
      if (event.target === modal) {
        window.closeModal();
      }
    };
  }
  
  modal.querySelector('.modal-body').innerHTML = '';
  modal.querySelector('.modal-body').appendChild(content);
  modal.style.display = 'block';
  console.log('✅ Модальное окно открыто');
};
