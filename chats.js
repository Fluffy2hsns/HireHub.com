// chats.js
import { auth, onAuthStateChanged } from "./firebase.js";

const chatsList = document.getElementById('chats-list');
const chatDetail = document.getElementById('chat-detail');
const backToListBtn = document.getElementById('back-to-list');
const chatWithName = document.getElementById('chat-with-name');
const chatJobTitle = document.getElementById('chat-job-title');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendMessageBtn = document.getElementById('send-message-btn');

let currentChatId = null;
let unsubscribeMessages = null;

// Проверяем параметры URL
const urlParams = new URLSearchParams(window.location.search);
const chatIdFromUrl = urlParams.get('chat');

onAuthStateChanged(auth, async (user) => {
  if (user && window.authManager && window.chatManager) {
    const role = window.authManager.getRole();
    window.chatManager.init(user, role);
    await loadChats();
    
    // Если перешли по ссылке с чатом, открываем его
    if (chatIdFromUrl) {
      await openChat(chatIdFromUrl);
    }
  } else if (!user) {
    chatsList.innerHTML = '<p>Пожалуйста, войдите в систему</p>';
  }
});

async function loadChats() {
  try {
    const currentUser = window.authManager.getUser();
    const chats = await window.chatManager.getUserChats(currentUser.uid);
    
    if (chats.length === 0) {
      chatsList.innerHTML = `
        <div class="no-chats">
          <p>У вас пока нет чатов</p>
          <p>Начните общение с работодателем или соискателем!</p>
        </div>
      `;
      return;
    }
    
    chatsList.innerHTML = '';
    
    chats.forEach(chat => {
      const chatElement = document.createElement('div');
      chatElement.className = 'chat-item';
      chatElement.onclick = () => openChat(chat.id);
      
      const lastMessageTime = chat.lastMessageTime?.toDate?.();
      const timeText = lastMessageTime ? 
        lastMessageTime.toLocaleString() : 
        'Нет сообщений';
      
      chatElement.innerHTML = `
        <div class="chat-header">
          <h4 class="chat-title">${chat.otherParticipant.name}</h4>
          <span class="chat-time">${timeText}</span>
        </div>
        <p class="chat-job">Вакансия: ${chat.jobTitle}</p>
        <p class="chat-last-message">${chat.lastMessage || 'Чат начат'}</p>
        <div class="chat-meta">
          <span>${chat.companyName}</span>
        </div>
      `;
      
      chatsList.appendChild(chatElement);
    });
    
  } catch (error) {
    console.error('Ошибка загрузки чатов:', error);
    chatsList.innerHTML = '<p>Ошибка загрузки чатов</p>';
  }
}

async function openChat(chatId) {
  try {
    currentChatId = chatId;
    
    // Получаем информацию о чате
    const currentUser = window.authManager.getUser();
    const chats = await window.chatManager.getUserChats(currentUser.uid);
    const currentChat = chats.find(chat => chat.id === chatId);
    
    if (!currentChat) {
      alert('Чат не найден');
      return;
    }
    
    // Обновляем UI
    chatWithName.textContent = currentChat.otherParticipant.name;
    chatJobTitle.textContent = `Вакансия: ${currentChat.jobTitle}`;
    
    // Показываем детали чата, скрываем список
    chatsList.style.display = 'none';
    chatDetail.style.display = 'block';
    
    // Загружаем сообщения
    await loadMessages(chatId);
    
    // Отмечаем сообщения как прочитанные
    await window.chatManager.markMessagesAsRead(chatId, currentUser.uid);
    
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
    const timeText = time ? time.toLocaleString() : '...';
    
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
  chatDetail.style.display = 'none';
  chatsList.style.display = 'block';
  
  if (unsubscribeMessages) {
    unsubscribeMessages();
    unsubscribeMessages = null;
  }
  
  currentChatId = null;
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