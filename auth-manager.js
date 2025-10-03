// // auth-manager.js - централизованное управление авторизацией
// import { 
//   auth, 
//   db, 
//   onAuthStateChanged, 
//   getDoc, 
//   doc, 
//   signOut 
// } from "./firebase.js";

// class AuthManager {
//   constructor() {
//     this.currentUser = null;
//     this.currentRole = null;
//     this.hasResume = false;
//     this.init();
//   }

//   init() {
//     console.log('🔄 AuthManager инициализируется...');
//     onAuthStateChanged(auth, async (user) => {
//       console.log('🔐 Статус авторизации изменен:', user ? `Пользователь ${user.uid}` : 'Нет пользователя');
//       this.currentUser = user;
      
//       if (user) {
//         try {
//           const userDoc = await getDoc(doc(db, 'users', user.uid));
//           if (userDoc.exists()) {
//             const userData = userDoc.data();
//             this.currentRole = userData.role;
            
//             // Проверяем наличие резюме
//             this.hasResume = userData.resume && 
//                             userData.resume.name && 
//                             userData.resume.profession;
            
//             console.log('User data:', {
//               role: this.currentRole,
//               hasResume: this.hasResume
//             });
//           }
//         } catch (error) {
//           console.error('Error loading user data:', error);
//         }
//       } else {
//         this.currentRole = null;
//         this.hasResume = false;
//       }
      
//       this.updateNavigation();
//     });
//   }

//   updateNavigation() {
//     const loginBtn = document.getElementById('login-btn');
//     const logoutBtn = document.getElementById('logout-btn');
//     const resumeBtn = document.getElementById('resume-btn');
//     const addJobBtn = document.getElementById('add-job-btn');
//     const applicationsBtn = document.getElementById('applications-btn');
//     const notificationsBtn = document.getElementById('notifications-btn');
//     const chatsBtn = document.getElementById('chats-btn');

//     console.log('Updating navigation, user:', this.currentUser);

//     if (this.currentUser) {
//       // Показываем/скрываем основные кнопки
//       if (loginBtn) loginBtn.style.display = 'none';
//       if (logoutBtn) logoutBtn.style.display = 'block';
//       if (applicationsBtn) applicationsBtn.style.display = 'block';
//       if (notificationsBtn) notificationsBtn.style.display = 'block';
//       if (chatsBtn) chatsBtn.style.display = 'block';
      
//       // Настраиваем кнопку резюме для соискателей
//       if (resumeBtn) {
//         if (this.currentRole === 'seeker') {
//           resumeBtn.style.display = 'block';
//           if (this.hasResume) {
//             resumeBtn.innerHTML = '✏️ Изменить резюме';
//             resumeBtn.href = 'resume.html';
//           } else {
//             resumeBtn.innerHTML = '📄 Создать резюме';
//             resumeBtn.href = 'resume.html';
//           }
//         } else {
//           resumeBtn.style.display = 'none';
//         }
//       }
      
//       // Настраиваем кнопку добавления вакансии для работодателей
//       if (addJobBtn) {
//         addJobBtn.style.display = this.currentRole === 'employer' ? 'block' : 'none';
//       }
      
//       // Настраиваем ссылку уведомлений в зависимости от роли
//       if (notificationsBtn) {
//         if (this.currentRole === 'employer') {
//           notificationsBtn.href = 'notifications.html';
//         } else if (this.currentRole === 'seeker') {
//           notificationsBtn.href = 'applicant-notifications.html';
//         }
//       }
      
//     } else {
//       // Пользователь не авторизован
//       if (loginBtn) loginBtn.style.display = 'block';
//       if (logoutBtn) logoutBtn.style.display = 'none';
//       if (resumeBtn) resumeBtn.style.display = 'none';
//       if (addJobBtn) addJobBtn.style.display = 'none';
//       if (applicationsBtn) applicationsBtn.style.display = 'none';
//       if (notificationsBtn) notificationsBtn.style.display = 'none';
//       if (chatsBtn) chatsBtn.style.display = 'none';
//     }
//   }

//   async handleLogout() {
//     try {
//       await signOut(auth);
//       window.location.href = 'index.html';
//     } catch (error) {
//       alert('Ошибка выхода: ' + error.message);
//     }
//   }

//   getUser() {
//     return this.currentUser;
//   }

//   getRole() {
//     return this.currentRole;
//   }

//   getHasResume() {
//     return this.hasResume;
//   }
// }

// // Создаем глобальный экземпляр
// window.authManager = new AuthManager();

// // Добавляем обработчик выхода
// document.addEventListener('DOMContentLoaded', function() {
//   const logoutBtn = document.getElementById('logout-btn');
//   if (logoutBtn) {
//     logoutBtn.addEventListener('click', async (e) => {
//       e.preventDefault();
//       await window.authManager.handleLogout();
//     });
//   }
// });


// auth-manager.js - централизованное управление авторизацией
import { 
  auth, 
  db, 
  onAuthStateChanged, 
  getDoc, 
  doc, 
  signOut 
} from "./firebase.js";

class AuthManager {
  constructor() {
    this.currentUser = null;
    this.currentRole = null;
    this.hasResume = false;
    this.userData = null;
    this.isInitialized = false;
    this.authListeners = [];
    this.init();
  }

  init() {
    console.log('🔄 AuthManager инициализируется...');
    
    onAuthStateChanged(auth, async (user) => {
      await this.handleAuthStateChange(user);
    });
  }

  async handleAuthStateChange(user) {
    console.log('🔐 Статус авторизации изменен:', user ? `Пользователь ${user.uid}` : 'Нет пользователя');
    
    this.currentUser = user;
    
    if (user) {
      await this.loadUserData(user.uid);
    } else {
      this.resetUserData();
    }
    
    this.updateNavigation();
    this.notifyAuthListeners();
    this.isInitialized = true;
  }

  async loadUserData(userId) {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        this.userData = userDoc.data();
        this.currentRole = this.userData.role;
        
        // Проверяем наличие резюме
        this.hasResume = this.userData.resume && 
                        this.userData.resume.name && 
                        this.userData.resume.profession;
        
        console.log('✅ Данные пользователя загружены:', {
          role: this.currentRole,
          hasResume: this.hasResume,
          email: this.userData.email
        });
      } else {
        console.warn('⚠️ Документ пользователя не найден');
        this.resetUserData();
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки данных пользователя:', error);
      this.resetUserData();
    }
  }

  resetUserData() {
    this.currentRole = null;
    this.hasResume = false;
    this.userData = null;
  }

  // updateNavigation() {
  //   const navElements = this.getNavElements();
    
  //   if (this.currentUser) {
  //     this.showAuthenticatedNavigation(navElements);
  //   } else {
  //     this.showUnauthenticatedNavigation(navElements);
  //   }
  // }

  // getNavElements() {
  //   return {
  //     loginBtn: document.getElementById('login-btn'),
  //     logoutBtn: document.getElementById('logout-btn'),
  //     resumeBtn: document.getElementById('resume-btn'),
  //     addJobBtn: document.getElementById('add-job-btn'),
  //     applicationsBtn: document.getElementById('applications-btn'),
  //     notificationsBtn: document.getElementById('notifications-btn'),
  //     chatsBtn: document.getElementById('chats-btn'),
  //     favoritesBtn: document.getElementById('favorites-btn')
  //   };
  // }


  updateNavigation() {
  const navElements = this.getNavElements();
  
  if (this.currentUser) {
    this.showAuthenticatedNavigation(navElements);
  } else {
    this.showUnauthenticatedNavigation(navElements);
  }
  }

  getNavElements() {
    return {
      loginBtn: document.getElementById('login-btn'),
      logoutBtn: document.getElementById('logout-btn'),
      resumeBtn: document.getElementById('resume-btn'),
      addJobBtn: document.getElementById('add-job-btn'),
      applicationsBtn: document.getElementById('applications-btn'),
      notificationsBtn: document.getElementById('notifications-btn'),
      chatsBtn: document.getElementById('chats-btn'),        // Добавляем кнопку чатов
      favoritesBtn: document.getElementById('favorites-btn')
    };
  }

  showAuthenticatedNavigation(elements) {
    // Базовые элементы для всех авторизованных пользователей
    this.toggleElement(elements.loginBtn, false);
    this.toggleElement(elements.logoutBtn, true);
    this.toggleElement(elements.applicationsBtn, true);
    this.toggleElement(elements.notificationsBtn, true);
    this.toggleElement(elements.chatsBtn, true);             // Показываем чаты для всех

    // Элементы в зависимости от роли
    if (this.currentRole === 'seeker') {
      this.setupSeekerNavigation(elements);
    } else if (this.currentRole === 'employer') {
      this.setupEmployerNavigation(elements);
    }

    // Настраиваем уведомления в зависимости от роли
    this.setupNotificationsLink(elements.notificationsBtn);
  }


  showAuthenticatedNavigation(elements) {
    // Базовые элементы для всех авторизованных пользователей
    this.toggleElement(elements.loginBtn, false);
    this.toggleElement(elements.logoutBtn, true);
    this.toggleElement(elements.applicationsBtn, true);
    this.toggleElement(elements.notificationsBtn, true);
    this.toggleElement(elements.chatsBtn, true);

    // Элементы в зависимости от роли
    if (this.currentRole === 'seeker') {
      this.setupSeekerNavigation(elements);
    } else if (this.currentRole === 'employer') {
      this.setupEmployerNavigation(elements);
    }

    // Настраиваем уведомления в зависимости от роли
    this.setupNotificationsLink(elements.notificationsBtn);
  }

  showUnauthenticatedNavigation(elements) {
    Object.values(elements).forEach(element => {
      if (element) {
        const isLoginBtn = element.id === 'login-btn';
        element.style.display = isLoginBtn ? 'block' : 'none';
      }
    });
  }

  setupSeekerNavigation(elements) {
    this.toggleElement(elements.resumeBtn, true);
    this.toggleElement(elements.addJobBtn, false);
    this.toggleElement(elements.favoritesBtn, true);

    if (elements.resumeBtn) {
      this.updateResumeButton(elements.resumeBtn);
    }
  }

  setupEmployerNavigation(elements) {
    this.toggleElement(elements.resumeBtn, false);
    this.toggleElement(elements.addJobBtn, true);
    this.toggleElement(elements.favoritesBtn, false);
  }

  setupNotificationsLink(notificationsBtn) {
    if (!notificationsBtn) return;

    if (this.currentRole === 'employer') {
      notificationsBtn.href = 'notifications.html';
      notificationsBtn.innerHTML = '🔔 Уведомления';
    } else if (this.currentRole === 'seeker') {
      notificationsBtn.href = 'applicant-notifications.html';
      notificationsBtn.innerHTML = '🔔 Уведомления';
    }
  }

  updateResumeButton(resumeBtn) {
    if (this.hasResume) {
      resumeBtn.innerHTML = '✏️ Изменить резюме';
      resumeBtn.href = 'resume.html';
    } else {
      resumeBtn.innerHTML = '📄 Создать резюме';
      resumeBtn.href = 'resume.html';
    }
  }

  toggleElement(element, show) {
    if (element) {
      element.style.display = show ? 'block' : 'none';
    }
  }

  // Методы для подписки на изменения авторизации
  onAuthChange(callback) {
    this.authListeners.push(callback);
    
    // Немедленно вызываем callback если менеджер уже инициализирован
    if (this.isInitialized) {
      callback({
        user: this.currentUser,
        role: this.currentRole,
        hasResume: this.hasResume
      });
    }
    
    // Возвращаем функцию для отписки
    return () => {
      this.authListeners = this.authListeners.filter(listener => listener !== callback);
    };
  }

  notifyAuthListeners() {
    const authState = {
      user: this.currentUser,
      role: this.currentRole,
      hasResume: this.hasResume,
      userData: this.userData
    };

    this.authListeners.forEach(callback => {
      try {
        callback(authState);
      } catch (error) {
        console.error('❌ Ошибка в auth listener:', error);
      }
    });
  }

  // Проверка прав доступа
  requireAuth(requiredRole = null) {
    return new Promise((resolve, reject) => {
      const checkAuth = () => {
        if (!this.currentUser) {
          reject(new Error('Требуется авторизация'));
          return;
        }

        if (requiredRole && this.currentRole !== requiredRole) {
          reject(new Error(`Требуется роль: ${requiredRole}`));
          return;
        }

        resolve({
          user: this.currentUser,
          role: this.currentRole,
          userData: this.userData
        });
      };

      if (this.isInitialized) {
        checkAuth();
      } else {
        // Ждем инициализации
        const unsubscribe = this.onAuthChange(() => {
          unsubscribe();
          checkAuth();
        });

        // Таймаут на случай если инициализация затянется
        setTimeout(() => {
          if (!this.isInitialized) {
            reject(new Error('Таймаут инициализации авторизации'));
          }
        }, 5000);
      }
    });
  }

  // Быстрая проверка авторизации (синхронная)
  isAuthenticated() {
    return !!this.currentUser;
  }

  isSeeker() {
    return this.currentRole === 'seeker';
  }

  isEmployer() {
    return this.currentRole === 'employer';
  }

  hasRole(role) {
    return this.currentRole === role;
  }

  async handleLogout() {
    try {
      console.log('🚪 Выход из системы...');
      await signOut(auth);
      console.log('✅ Выход выполнен успешно');
      window.location.href = 'index.html';
    } catch (error) {
      console.error('❌ Ошибка выхода:', error);
      throw new Error('Ошибка выхода: ' + error.message);
    }
  }

  // Обновление данных пользователя (например, после изменения резюме)
  async refreshUserData() {
    if (this.currentUser) {
      await this.loadUserData(this.currentUser.uid);
    }
  }

  // Геттеры
  getUser() {
    return this.currentUser;
  }

  getRole() {
    return this.currentRole;
  }

  getHasResume() {
    return this.hasResume;
  }

  getUserData() {
    return this.userData;
  }

  getUserId() {
    return this.currentUser?.uid;
  }

  // Статус инициализации
  waitForInit() {
    return new Promise((resolve) => {
      if (this.isInitialized) {
        resolve();
      } else {
        const unsubscribe = this.onAuthChange(() => {
          unsubscribe();
          resolve();
        });
      }
    });
  }
}

// Создаем глобальный экземпляр
window.authManager = new AuthManager();

// Добавляем обработчик выхода
document.addEventListener('DOMContentLoaded', function() {
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      
      try {
        await window.authManager.handleLogout();
      } catch (error) {
        alert(error.message);
      }
    });
  }

  // Добавляем обработчики для других страниц
  const loginBtn = document.getElementById('login-btn');
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      // Можно добавить логику редиректа в зависимости от текущей страницы
      console.log('➡️ Переход на страницу авторизации');
    });
  }
});

// Экспорт для использования в других модулях
export { AuthManager };