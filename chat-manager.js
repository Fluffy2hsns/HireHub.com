// // chat-manager.js
// import { 
//   db, collection, addDoc, doc, getDoc, getDocs, query, where, 
//   onSnapshot, updateDoc, arrayUnion, serverTimestamp, onAuthStateChanged 
// } from "./firebase.js";

// class ChatManager {
//   constructor() {
//     this.currentUser = null;
//     this.currentRole = null;
//     this.isInitialized = false;
//   }

//   init(user, role) {
//     this.currentUser = user;
//     this.currentRole = role;
//     this.isInitialized = true;
//     console.log('💬 ChatManager инициализирован для:', { uid: user.uid, role });
//   }

//   // Создать или получить существующий чат
//   async getOrCreateChat(jobId, applicantId, employerId, jobTitle) {
//     try {
//       // Проверяем, есть ли уже чат для этой вакансии и соискателя
//       const chatsQuery = query(
//         collection(db, 'chats'),
//         where('jobId', '==', jobId),
//         where('applicantId', '==', applicantId)
//       );
      
//       const existingChats = await getDocs(chatsQuery);
      
//       if (!existingChats.empty) {
//         // Возвращаем существующий чат
//         const chatDoc = existingChats.docs[0];
//         console.log('✅ Найден существующий чат:', chatDoc.id);
//         return { id: chatDoc.id, ...chatDoc.data() };
//       }
      
//       // Создаем новый чат
//       const jobDoc = await getDoc(doc(db, 'vacancies', jobId));
//       const jobData = jobDoc.data();
      
//       const applicantDoc = await getDoc(doc(db, 'users', applicantId));
//       const applicantData = applicantDoc.data();
      
//       const employerDoc = await getDoc(doc(db, 'users', employerId));
//       const employerData = employerDoc.data();
      
//       const chatData = {
//         jobId: jobId,
//         jobTitle: jobTitle,
//         companyName: jobData.companyName,
//         applicantId: applicantId,
//         applicantName: `${applicantData.resume?.name || ''} ${applicantData.resume?.surname || ''}`.trim(),
//         employerId: employerId,
//         employerName: employerData.companyName || 'Работодатель',
//         lastMessage: '',
//         lastMessageTime: serverTimestamp(),
//         createdAt: serverTimestamp(),
//         participants: [applicantId, employerId]
//       };
      
//       const chatRef = await addDoc(collection(db, 'chats'), chatData);
//       console.log('✅ Создан новый чат:', chatRef.id);
      
//       return { id: chatRef.id, ...chatData };
      
//     } catch (error) {
//       console.error('❌ Ошибка создания чата:', error);
//       throw error;
//     }
//   }

//   // Отправить сообщение
//   async sendMessage(chatId, messageText, senderId) {
//     try {
//       const messageData = {
//         chatId: chatId,
//         senderId: senderId,
//         text: messageText,
//         timestamp: serverTimestamp(),
//         read: false
//       };
      
//       // Добавляем сообщение в подколлекцию
//       await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      
//       // Обновляем последнее сообщение в чате
//       await updateDoc(doc(db, 'chats', chatId), {
//         lastMessage: messageText,
//         lastMessageTime: serverTimestamp()
//       });
      
//       console.log('✅ Сообщение отправлено в чат:', chatId);
      
//     } catch (error) {
//       console.error('❌ Ошибка отправки сообщения:', error);
//       throw error;
//     }
//   }

//   // Получить чаты пользователя
//   async getUserChats(userId) {
//     try {
//       const chatsQuery = query(
//         collection(db, 'chats'),
//         where('participants', 'array-contains', userId)
//       );
      
//       const chatsSnapshot = await getDocs(chatsQuery);
//       const chats = [];
      
//       for (const chatDoc of chatsSnapshot.docs) {
//         const chatData = chatDoc.data();
        
//         // Получаем информацию о собеседнике
//         const otherParticipantId = chatData.participants.find(id => id !== userId);
//         const otherUserDoc = await getDoc(doc(db, 'users', otherParticipantId));
//         const otherUserData = otherUserDoc.data();
        
//         chats.push({
//           id: chatDoc.id,
//           ...chatData,
//           otherParticipant: {
//             id: otherParticipantId,
//             name: this.currentRole === 'seeker' ? 
//                   chatData.employerName : 
//                   chatData.applicantName,
//             role: this.currentRole === 'seeker' ? 'employer' : 'seeker'
//           }
//         });
//       }
      
//       // Сортируем по времени последнего сообщения
//       chats.sort((a, b) => {
//         const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
//         const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
//         return timeB - timeA;
//       });
      
//       return chats;
      
//     } catch (error) {
//       console.error('❌ Ошибка получения чатов:', error);
//       throw error;
//     }
//   }

//   // Подписаться на сообщения чата
//   subscribeToChatMessages(chatId, callback) {
//     const messagesQuery = query(
//       collection(db, 'chats', chatId, 'messages'),
//       where('chatId', '==', chatId)
//     );
    
//     return onSnapshot(messagesQuery, (snapshot) => {
//       const messages = [];
//       snapshot.forEach(doc => {
//         messages.push({ id: doc.id, ...doc.data() });
//       });
      
//       // Сортируем по времени
//       messages.sort((a, b) => {
//         const timeA = a.timestamp?.toDate?.() || new Date(0);
//         const timeB = b.timestamp?.toDate?.() || new Date(0);
//         return timeA - timeB;
//       });
      
//       callback(messages);
//     });
//   }

//   // Отметить сообщения как прочитанные
//   async markMessagesAsRead(chatId, userId) {
//     try {
//       const messagesQuery = query(
//         collection(db, 'chats', chatId, 'messages'),
//         where('chatId', '==', chatId),
//         where('senderId', '!=', userId),
//         where('read', '==', false)
//       );
      
//       const messagesSnapshot = await getDocs(messagesQuery);
//       const updatePromises = [];
      
//       messagesSnapshot.forEach(doc => {
//         updatePromises.push(updateDoc(doc.ref, { read: true }));
//       });
      
//       await Promise.all(updatePromises);
//       console.log('✅ Сообщения отмечены как прочитанные');
      
//     } catch (error) {
//       console.error('❌ Ошибка отметки сообщений:', error);
//     }
//   }
// }

// // Создаем глобальный экземпляр
// window.chatManager = new ChatManager();

// // Инициализируем при загрузке страницы
// document.addEventListener('DOMContentLoaded', function() {
//   onAuthStateChanged(auth, (user) => {
//     if (user && window.authManager) {
//       const role = window.authManager.getRole();
//       window.chatManager.init(user, role);
//     }
//   });
// });


// chat-manager.js
// chat-manager.js
import { 
  db, collection, addDoc, doc, getDoc, getDocs, query, where, 
  onSnapshot, updateDoc, arrayUnion, serverTimestamp, onAuthStateChanged 
} from "./firebase.js";

class ChatManager {
  constructor() {
    this.currentUser = null;
    this.currentRole = null;
    this.isInitialized = false;
  }

  init(user, role) {
    this.currentUser = user;
    this.currentRole = role;
    this.isInitialized = true;
    console.log('💬 ChatManager инициализирован для:', { uid: user.uid, role });
  }

  // Создать или получить существующий чат
  async getOrCreateChat(jobId, applicantId, employerId, jobTitle) {
    try {
      console.log('🔍 Поиск существующего чата...', { jobId, applicantId, employerId });
      
      // Проверяем, есть ли уже чат для этой вакансии и соискателя
      const chatsQuery = query(
        collection(db, 'chats'),
        where('jobId', '==', jobId),
        where('applicantId', '==', applicantId)
      );
      
      const existingChats = await getDocs(chatsQuery);
      console.log('📊 Найдено существующих чатов:', existingChats.size);
      
      if (!existingChats.empty) {
        // Возвращаем существующий чат
        const chatDoc = existingChats.docs[0];
        console.log('✅ Найден существующий чат:', chatDoc.id);
        return { id: chatDoc.id, ...chatDoc.data() };
      }
      
      console.log('🆕 Создаем новый чат...');
      
      // Создаем новый чат
      const jobDoc = await getDoc(doc(db, 'vacancies', jobId));
      const jobData = jobDoc.data();
      
      const applicantDoc = await getDoc(doc(db, 'users', applicantId));
      const applicantData = applicantDoc.data();
      
      const employerDoc = await getDoc(doc(db, 'users', employerId));
      const employerData = employerDoc.data();
      
      const chatData = {
        jobId: jobId,
        jobTitle: jobTitle,
        companyName: jobData.companyName,
        applicantId: applicantId,
        applicantName: `${applicantData.resume?.name || ''} ${applicantData.resume?.surname || ''}`.trim(),
        employerId: employerId,
        employerName: employerData.companyName || 'Работодатель',
        lastMessage: '',
        lastMessageTime: serverTimestamp(),
        createdAt: serverTimestamp(),
        participants: [applicantId, employerId]
      };
      
      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      console.log('✅ Создан новый чат:', chatRef.id);
      
      // СОЗДАЕМ УВЕДОМЛЕНИЕ ДЛЯ РАБОТОДАТЕЛЯ
      await this.createNewChatNotification(chatRef.id, applicantId, employerId, jobId, jobTitle, applicantData);
      
      return { id: chatRef.id, ...chatData };
      
    } catch (error) {
      console.error('❌ Ошибка создания чата:', error);
      throw error;
    }
  }

  // Создать уведомление о новом чате для работодателя
  async createNewChatNotification(chatId, applicantId, employerId, jobId, jobTitle, applicantData) {
    try {
      console.log('📢 Создаем уведомление о новом чате...', { employerId, chatId });
      
      const notificationData = {
        type: 'new_chat',
        employerId: employerId,
        applicantId: applicantId,
        chatId: chatId,
        jobId: jobId,
        jobTitle: jobTitle,
        applicantName: `${applicantData.resume?.name || ''} ${applicantData.resume?.surname || ''}`.trim(),
        applicantProfession: applicantData.resume?.profession || 'Не указана',
        message: 'Написал вам сообщение',
        createdAt: serverTimestamp(),
        read: false
      };
      
      const notificationRef = await addDoc(collection(db, 'notifications'), notificationData);
      console.log('✅ Уведомление создано:', notificationRef.id);
      console.log('📋 Данные уведомления:', notificationData);
      
    } catch (error) {
      console.error('❌ Ошибка создания уведомления:', error);
    }
  }

  // Создать уведомление о новом сообщении
  async createNewMessageNotification(chatId, senderId, receiverId, messageText) {
    try {
      console.log('📢 Создаем уведомление о новом сообщении...', { chatId, receiverId });
      
      // Получаем информацию о чате
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (!chatDoc.exists()) {
        console.log('❌ Чат не найден:', chatId);
        return;
      }
      
      const chatData = chatDoc.data();
      console.log('📋 Данные чата:', chatData);
      
      const notificationData = {
        type: 'new_message',
        receiverId: receiverId,
        senderId: senderId,
        chatId: chatId,
        jobId: chatData.jobId,
        jobTitle: chatData.jobTitle,
        applicantName: chatData.applicantName,
        employerName: chatData.employerName,
        message: messageText.substring(0, 100) + (messageText.length > 100 ? '...' : ''),
        createdAt: serverTimestamp(),
        read: false
      };
      
      const notificationRef = await addDoc(collection(db, 'notifications'), notificationData);
      console.log('✅ Уведомление о сообщении создано:', notificationRef.id);
      console.log('📋 Данные уведомления:', notificationData);
      
    } catch (error) {
      console.error('❌ Ошибка создания уведомления о сообщении:', error);
    }
  }

  // Отправить сообщение
  async sendMessage(chatId, messageText, senderId) {
    try {
      console.log('📨 Отправка сообщения...', { chatId, senderId, messageLength: messageText.length });
      
      const messageData = {
        chatId: chatId,
        senderId: senderId,
        text: messageText,
        timestamp: serverTimestamp(),
        read: false
      };
      
      // Добавляем сообщение в подколлекцию
      const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), messageData);
      console.log('✅ Сообщение отправлено:', messageRef.id);
      
      // Обновляем последнее сообщение в чате
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp()
      });
      
      console.log('✅ Последнее сообщение обновлено в чате');
      
      // СОЗДАЕМ УВЕДОМЛЕНИЕ О НОВОМ СООБЩЕНИИ
      // Находим получателя (другого участника чата)
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        const receiverId = chatData.participants.find(id => id !== senderId);
        
        if (receiverId) {
          console.log('👤 Получатель уведомления:', receiverId);
          await this.createNewMessageNotification(chatId, senderId, receiverId, messageText);
        } else {
          console.log('❌ Получатель не найден');
        }
      }
      
    } catch (error) {
      console.error('❌ Ошибка отправки сообщения:', error);
      throw error;
    }
  }

  // Остальные методы остаются без изменений
  async getUserChats(userId) {
    try {
      const chatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId)
      );
      
      const chatsSnapshot = await getDocs(chatsQuery);
      const chats = [];
      
      for (const chatDoc of chatsSnapshot.docs) {
        const chatData = chatDoc.data();
        
        // Получаем информацию о собеседнике
        const otherParticipantId = chatData.participants.find(id => id !== userId);
        const otherUserDoc = await getDoc(doc(db, 'users', otherParticipantId));
        const otherUserData = otherUserDoc.data();
        
        chats.push({
          id: chatDoc.id,
          ...chatData,
          otherParticipant: {
            id: otherParticipantId,
            name: this.currentRole === 'seeker' ? 
                  chatData.employerName : 
                  chatData.applicantName,
            role: this.currentRole === 'seeker' ? 'employer' : 'seeker'
          }
        });
      }
      
      // Сортируем по времени последнего сообщения
      chats.sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate?.() || new Date(0);
        const timeB = b.lastMessageTime?.toDate?.() || new Date(0);
        return timeB - timeA;
      });
      
      return chats;
      
    } catch (error) {
      console.error('❌ Ошибка получения чатов:', error);
      throw error;
    }
  }

  subscribeToChatMessages(chatId, callback) {
    const messagesQuery = query(
      collection(db, 'chats', chatId, 'messages'),
      where('chatId', '==', chatId)
    );
    
    return onSnapshot(messagesQuery, (snapshot) => {
      const messages = [];
      snapshot.forEach(doc => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      
      // Сортируем по времени
      messages.sort((a, b) => {
        const timeA = a.timestamp?.toDate?.() || new Date(0);
        const timeB = b.timestamp?.toDate?.() || new Date(0);
        return timeA - timeB;
      });
      
      callback(messages);
    });
  }

  async markMessagesAsRead(chatId, userId) {
    try {
      const messagesQuery = query(
        collection(db, 'chats', chatId, 'messages'),
        where('chatId', '==', chatId),
        where('senderId', '!=', userId),
        where('read', '==', false)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const updatePromises = [];
      
      messagesSnapshot.forEach(doc => {
        updatePromises.push(updateDoc(doc.ref, { read: true }));
      });
      
      await Promise.all(updatePromises);
      console.log('✅ Сообщения отмечены как прочитанные');
      
    } catch (error) {
      console.error('❌ Ошибка отметки сообщений:', error);
    }
  }
}

// Создаем глобальный экземпляр
window.chatManager = new ChatManager();

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
  onAuthStateChanged(auth, (user) => {
    if (user && window.authManager) {
      const role = window.authManager.getRole();
      window.chatManager.init(user, role);
      console.log('💬 ChatManager готов к работе');
    }
  });
});