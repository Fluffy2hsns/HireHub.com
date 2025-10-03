// applicant-notifications.js
import { 
  auth, db, onAuthStateChanged, getDocs, collection, query, where, 
  getDoc, doc, updateDoc, addDoc, serverTimestamp 
} from "./firebase.js";

const notificationsList = document.getElementById('notifications-list');

onAuthStateChanged(auth, async (user) => {
  if (user) {
    await loadApplicantNotifications(user.uid);
  } else {
    notificationsList.innerHTML = '<p>Пожалуйста, войдите в систему</p>';
  }
});

async function loadApplicantNotifications(applicantId) {
  notificationsList.innerHTML = '';
  
  const q = query(
    collection(db, 'applicant_notifications'), 
    where('applicantId', '==', applicantId)
  );
  
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) {
    notificationsList.innerHTML = '<p>У вас пока нет уведомлений</p>';
    return;
  }
  
  const sortedNotifications = snapshot.docs.sort((a, b) => 
    b.data().createdAt?.toDate() - a.data().createdAt?.toDate()
  );
  
  for (const notifDoc of sortedNotifications) {
    const notif = notifDoc.data();
    
    const notificationElement = document.createElement('div');
    notificationElement.className = `notification-item ${notif.read ? 'read' : 'unread'}`;
    
    const statusInfo = notif.feedbackStatus === 'accepted' ? 
      '🎉 Приглашение на собеседование!' : 
      '📝 Ответ от работодателя';
    
    notificationElement.innerHTML = `
      <div class="notification-header">
        <h4>${statusInfo}</h4>
        <span class="notification-date">
          ${notif.createdAt?.toDate().toLocaleString() || 'Неизвестно'}
        </span>
      </div>
      
      <div class="notification-preview">
        <p><strong>Вакансия:</strong> ${notif.jobTitle}</p>
        <p><strong>Компания:</strong> ${notif.companyName}</p>
        <p class="feedback-preview">
          ${notif.feedback.substring(0, 100)}...
          ${notif.feedback.length > 100 ? '<button class="read-more-btn" onclick="showFullFeedback(\'' + notifDoc.id + '\')">Читать полностью</button>' : ''}
        </p>
      </div>
      
      <div class="notification-actions">
        ${!notif.read ? `<button class="mark-read-btn" onclick="markAsRead('${notifDoc.id}')">Отметить как прочитанное</button>` : ''}
        <button class="view-job-btn" onclick="viewJob('${notif.jobId}')">👀 Посмотреть вакансию</button>
      </div>
      <hr>
    `;
    
    notificationsList.appendChild(notificationElement);
  }
}

window.showFullFeedback = async function(notificationId) {
  try {
    const notifDoc = await getDoc(doc(db, 'applicant_notifications', notificationId));
    const notif = notifDoc.data();
    
    const feedbackSection = document.createElement('div');
    feedbackSection.className = 'full-feedback';
    feedbackSection.innerHTML = `
      <h4>${notif.feedbackStatus === 'accepted' ? '🎉 Приглашение!' : '📝 Ответ от работодателя'}</h4>
      
      <div class="feedback-details">
        <p><strong>Вакансия:</strong> ${notif.jobTitle}</p>
        <p><strong>Компания:</strong> ${notif.companyName}</p>
        <p><strong>Дата:</strong> ${notif.createdAt?.toDate().toLocaleString()}</p>
      </div>
      
      <div class="feedback-message">
        <h5>Сообщение от работодателя:</h5>
        <div class="message-content">
          ${notif.feedback}
        </div>
      </div>
      
      <div class="feedback-actions">
        <button class="close-btn" onclick="closeModal()">Закрыть</button>
      </div>
    `;
    
    if (!notif.read) {
      await updateDoc(doc(db, 'applicant_notifications', notificationId), {
        read: true
      });
    }
    
    showModal(feedbackSection);
    
  } catch (error) {
    alert('Ошибка загрузки сообщения: ' + error.message);
  }
};

window.viewJob = function(jobId) {
  window.location.href = `vacancy.html?id=${jobId}`;
};

window.markAsRead = async function(notificationId) {
  try {
    await updateDoc(doc(db, 'applicant_notifications', notificationId), {
      read: true
    });
    
    await loadApplicantNotifications(auth.currentUser.uid);
  } catch (error) {
    alert('Ошибка при обновлении уведомления: ' + error.message);
  }
};

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