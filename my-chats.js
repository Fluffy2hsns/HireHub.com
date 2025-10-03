// my-chats.js
import { auth, onAuthStateChanged } from "./firebase.js";

const chatsList = document.getElementById('chats-list');
const chatDetail = document.getElementById('chat-detail');
const chatsLoading = document.getElementById('chats-loading');
const noChats = document.getElementById('no-chats');
const noChatsMessage = document.getElementById('no-chats-message');
const noChatsActions = document.getElementById('no-chats-actions');
const chatsRoleInfo = document.getElementById('chats-role-info');
const backToListBtn = document.getElementById('back-to-list');
const chatWithName = document.getElementById('chat-with-name');
const chatJobTitle = document.getElementById('chat-job-title');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');
const viewVacancyBtn = document.getElementById('view-vacancy-btn');
const chatsSearch = document.getElementById('chats-search');
const filterAll = document.getElementById('filter-all');
const filterUnread = document.getElementById('filter-unread');
const filterRecent = document.getElementById('filter-recent');

let currentChatId = null;
let currentChatData = null;
let unsubscribeMessages = null;
let allChats = [];
let currentFilter = 'all';

// Проверяем параметры URL
const urlParams = new URLSearchParams(window.location.search);
const chatIdFromUrl = urlParams.get('chat');
const jobIdFromUrl = urlParams.get('job');

onAuthStateChanged(auth, async (user) => {
  if (user && window.authManager && window.chatManager) {
    const role = window.authManager.getRole();
    window.chatManager.init(user, role);
    
    // Показываем информацию о роли
    showRoleInfo(role);
    
    await loadChats();
    
    // Если перешли по ссылке с чатом, открываем его
    if (chatIdFromUrl) {
      await openChat(chatIdFromUrl);
    }
  } else if (!user) {
    showNotAuthenticated();
  }
});

function showRoleInfo(role) {
  if (role === 'seeker') {
    chatsRoleInfo.innerHTML = `
      <span class="role-badge seeker-badge">👤 Вы - соискатель</span>
      <p>Здесь вы можете общаться с работодателями по вакансиям</p>
    `;
  } else if (role === 'employer') {
    chatsRoleInfo.innerHTML = `
      <span class="role-badge employer-badge">🏢 Вы - работодатель</span>
      <p>Здесь вы можете общаться с соискателями по вашим вакансиям</p>
    `;
  }
}

function showNotAuthenticated() {
  chatsLoading.style.display = 'none';
  noChats.style.display = 'block';
  noChatsMessage.innerHTML = 'Для просмотра чатов необходимо войти в систему';
  noChatsActions.innerHTML = `
    <a href="register.html" class="auth-btn">Войти / Зарегистрироваться</a>
  `;
}

async function loadChats() {
  try {
    showLoading();
    
    const currentUser = window.authManager.getUser();
    const currentRole = window.authManager.getRole();
    
    allChats = await window.chatManager.getUserChats(currentUser.uid);
    
    if (allChats.length === 0) {
      showNoChats(currentRole);
      return;
    }
    
    showChatsList();
    displayChats(allChats);
    
    // Настраиваем фильтры
    setupFilters();
    
  } catch (error) {
    console.error('Ошибка загрузки чатов:', error);
    showError('Ошибка загрузки чатов: ' + error.message);
  }
}

function showNoChats(role) {
  chatsLoading.style.display = 'none';
  noChats.style.display = 'block';
  
  if (role === 'seeker') {
    noChatsMessage.innerHTML = `
      У вас пока нет активных чатов с работодателями.<br>
      Начните общение, откликнувшись на вакансию или задав вопрос работодателю.
    `;
    noChatsActions.innerHTML = `
      <a href="index.html" class="action-btn">🔍 Найти вакансии</a>
    `;
  } else {
    noChatsMessage.innerHTML = `
      У вас пока нет чатов с соискателями.<br>
      Чаты появятся когда соискатели начнут общение по вашим вакансиям.
    `;
    noChatsActions.innerHTML = `
      <a href="add-job.html" class="action-btn">➕ Добавить вакансию</a>
      <a href="applications.html" class="action-btn">📋 Посмотреть отклики</a>
    `;
  }
}

function displayChats(chats) {
  chatsList.innerHTML = '';
  
  chats.forEach(chat => {
    const chatElement = createChatElement(chat);
    chatsList.appendChild(chatElement);
  });
}

function createChatElement(chat) {
  const chatElement = document.createElement('div');
  chatElement.className = `chat-item ${hasUnreadMessages(chat) ? 'unread' : ''}`;
  chatElement.onclick = () => openChat(chat.id);
  
  const lastMessageTime = chat.lastMessageTime?.toDate?.();
  const timeText = lastMessageTime ? 
    formatTime(lastMessageTime) : 
    'Нет сообщений';
  
  const currentRole = window.authManager.getRole();
  const partnerName = currentRole === 'seeker' ? chat.employerName : chat.applicantName;
  const partnerRole = currentRole === 'seeker' ? 'employer' : 'seeker';
  
  chatElement.innerHTML = `
    <div class="chat-avatar">
      ${partnerRole === 'employer' ? '🏢' : '👤'}
    </div>
    <div class="chat-content">
      <div class="chat-header">
        <h4 class="chat-partner-name">${partnerName}</h4>
        <span class="chat-time">${timeText}</span>
      </div>
      <p class="chat-job">${chat.jobTitle}</p>
      <p class="chat-last-message">${chat.lastMessage || 'Чат начат'}</p>
      ${hasUnreadMessages(chat) ? '<span class="unread-indicator">●</span>' : ''}
    </div>
  `;
  
  return chatElement;
}

function hasUnreadMessages(chat) {
  // Здесь можно добавить логику проверки непрочитанных сообщений
  // Пока просто возвращаем false, можно доработать позже
  return false;
}

function formatTime(date) {
  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  } else if (days === 1) {
    return 'Вчера';
  } else if (days < 7) {
    return date.toLocaleDateString('ru-RU', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  }
}

function setupFilters() {
  filterAll.addEventListener('click', () => applyFilter('all'));
  filterUnread.addEventListener('click', () => applyFilter('unread'));
  filterRecent.addEventListener('click', () => applyFilter('recent'));
  
  chatsSearch.addEventListener('input', () => {
    applyFilter(currentFilter);
  });
}

function applyFilter(filter) {
  currentFilter = filter;
  
  // Обновляем активную кнопку фильтра
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`filter-${filter}`).classList.add('active');
  
  let filteredChats = [...allChats];
  
  // Применяем текстовый поиск
  const searchTerm = chatsSearch.value.toLowerCase();
  if (searchTerm) {
    filteredChats = filteredChats.filter(chat => 
      chat.jobTitle.toLowerCase().includes(searchTerm) ||
      chat.employerName.toLowerCase().includes(searchTerm) ||
      chat.applicantName.toLowerCase().includes(searchTerm)
    );
  }
  
  // Применяем выбранный фильтр
  switch (filter) {
    case 'unread':
      filteredChats = filteredChats.filter(chat => hasUnreadMessages(chat));
      break;
    case 'recent':
      // Показываем чаты за последние 7 дней
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filteredChats = filteredChats.filter(chat => {
        const lastMessageTime = chat.lastMessageTime?.toDate?.();
        return lastMessageTime && lastMessageTime > weekAgo;
      });
      break;
  }
  
  displayChats(filteredChats);
  
  // Показываем сообщение если нет чатов после фильтрации
  if (filteredChats.length === 0) {
    chatsList.innerHTML = `
      <div class="no-chats-filtered">
        <p>😔 Чатов не найдено</p>
        <p>Попробуйте изменить параметры поиска или фильтры</p>
      </div>
    `;
  }
}

async function openChat(chatId) {
  try {
    currentChatId = chatId;
    
    // Находим данные чата
    currentChatData = allChats.find(chat => chat.id === chatId);
    
    if (!currentChatData) {
      alert('Чат не найден');
      return;
    }
    
    // Обновляем UI
    const currentRole = window.authManager.getRole();
    const partnerName = currentRole === 'seeker' ? currentChatData.employerName : currentChatData.applicantName;
    
    chatWithName.textContent = partnerName;
    chatJobTitle.textContent = `Вакансия: ${currentChatData.jobTitle}`;
    
    // Настраиваем кнопку просмотра вакансии
    viewVacancyBtn.onclick = () => {
      window.location.href = `vacancy.html?id=${currentChatData.jobId}`;
    };
    
    // Показываем детали чата, скрываем список
    showChatDetail();
    
    // Загружаем сообщения
    await loadMessages(chatId);
    
    // Отмечаем сообщения как прочитанные
    await window.chatManager.markMessagesAsRead(chatId, auth.currentUser.uid);
    
  } catch (error) {
    console.error('Ошибка открытия чата:', error);
    alert('Ошибка открытия чата: ' + error.message);
  }
}

async function loadMessages(chatId) {
  try {
    messagesContainer.innerHTML = '<div class="loading">Загрузка сообщений...</div>';
    
    // Отписываемся от предыдущих сообщений
    if (unsubscribeMessages) {
      unsubscribeMessages();
    }
    
    // Подписываемся на сообщения в реальном времени
    unsubscribeMessages = window.chatManager.subscribeToChatMessages(
      chatId, 
      (messages) => {
        displayMessages(messages);
      }
    );
    
  } catch (error) {
    console.error('Ошибка загрузки сообщений:', error);
    messagesContainer.innerHTML = '<p>Ошибка загрузки сообщений</p>';
  }
}

function displayMessages(messages) {
  const currentUser = window.authManager.getUser();
  
  if (messages.length === 0) {
    messagesContainer.innerHTML = `
      <div class="no-messages">
        <p>Пока нет сообщений</p>
        <p>Начните общение первым!</p>
      </div>
    `;
    return;
  }
  
  messagesContainer.innerHTML = '';
  
  messages.forEach(message => {
    const messageElement = document.createElement('div');
    const isOwnMessage = message.senderId === currentUser.uid;
    
    messageElement.className = `message ${isOwnMessage ? 'own-message' : 'other-message'}`;
    
    const time = message.timestamp?.toDate?.();
    const timeText = time ? time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '...';
    
    messageElement.innerHTML = `
      <div class="message-content">
        <p class="message-text">${message.text}</p>
        <span class="message-time">${timeText}</span>
        ${!isOwnMessage && !message.read ? '<span class="unread-badge">новое</span>' : ''}
      </div>
    `;
    
    messagesContainer.appendChild(messageElement);
  });
  
  // Прокручиваем к последнему сообщению
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Обработчики событий
backToListBtn.addEventListener('click', () => {
  showChatsList();
  
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }
  
  currentChatId = null;
  currentChatData = null;
  
  // Обновляем список чатов (может быть новое сообщение)
  loadChats();
});

sendMessageBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

async function sendMessage() {
  const messageText = messageInput.value.trim();
  
  if (!messageText || !currentChatId) {
    return;
  }
  
  try {
    const currentUser = window.authManager.getUser();
    
    // Блокируем кнопку отправки
    sendMessageBtn.disabled = true;
    sendMessageBtn.textContent = 'Отправка...';
    
    await window.chatManager.sendMessage(currentChatId, messageText, currentUser.uid);
    
    // Очищаем поле ввода
    messageInput.value = '';
    
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error);
    alert('Ошибка отправки сообщения: ' + error.message);
  } finally {
    // Разблокируем кнопку отправки
    sendMessageBtn.disabled = false;
    sendMessageBtn.textContent = 'Отправить';
  }
}

// Вспомогательные функции для управления отображением
function showLoading() {
  chatsLoading.style.display = 'block';
  chatsList.style.display = 'none';
  noChats.style.display = 'none';
  chatDetail.style.display = 'none';
}

function showChatsList() {
  chatsLoading.style.display = 'none';
  chatsList.style.display = 'block';
  noChats.style.display = 'none';
  chatDetail.style.display = 'none';
}

function showChatDetail() {
  chatsLoading.style.display = 'none';
  chatsList.style.display = 'none';
  noChats.style.display = 'none';
  chatDetail.style.display = 'block';
}

function showError(message) {
  chatsLoading.style.display = 'none';
  chatsList.style.display = 'none';
  noChats.style.display = 'block';
  noChatsMessage.innerHTML = message;
  noChatsActions.innerHTML = '';
}