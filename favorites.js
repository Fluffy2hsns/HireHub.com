// favorites.js
import { 
  auth, db, onAuthStateChanged, getDocs, collection, query, where, getDoc, doc 
} from "./firebase.js";

const favoritesList = document.getElementById('favorites-list');

onAuthStateChanged(auth, async (user) => {
  if (user && window.authManager.getRole() === 'seeker') {
    await loadFavorites(user.uid);
  } else {
    favoritesList.innerHTML = '<p>Пожалуйста, войдите как соискатель, чтобы увидеть избранное.</p>';
  }
});

async function loadFavorites(userId) {
  favoritesList.innerHTML = '<p>Загрузка избранных вакансий...</p>';
  
  try {
    const favoritesQuery = query(
      collection(db, 'favorites'),
      where('userId', '==', userId)
    );
    
    const favoritesSnapshot = await getDocs(favoritesQuery);
    
    if (favoritesSnapshot.empty) {
      favoritesList.innerHTML = '<p>У вас пока нет избранных вакансий.</p>';
      return;
    }
    
    favoritesList.innerHTML = '';
    
    // Сортируем по дате добавления (новые сверху)
    const sortedFavorites = favoritesSnapshot.docs.sort((a, b) => 
      b.data().addedAt.toDate() - a.data().addedAt.toDate()
    );
    
    for (const favDoc of sortedFavorites) {
      const fav = favDoc.data();
      const vacancyDoc = await getDoc(doc(db, 'vacancies', fav.jobId));
      
      if (vacancyDoc.exists()) {
        const vacancy = vacancyDoc.data();
        const vacancyElement = document.createElement('div');
        vacancyElement.className = 'job-item';
        
        vacancyElement.innerHTML = `
          <h3>${vacancy.title}</h3>
          <p><strong>Компания:</strong> ${vacancy.companyName}</p>
          <p><strong>Зарплата:</strong> ${vacancy.salary || 'Не указана'}</p>
          <p><strong>Город:</strong> ${vacancy.city}</p>
          <p>${vacancy.description.substring(0, 150)}...</p>
          <a href="vacancy.html?id=${fav.jobId}" class="btn">Подробнее</a>
          <button class="btn secondary" onclick="removeFromFavorites('${favDoc.id}')">Удалить из избранного</button>
        `;
        
        favoritesList.appendChild(vacancyElement);
      }
    }
    
  } catch (error) {
    console.error('Ошибка загрузки избранного:', error);
    favoritesList.innerHTML = '<p>Ошибка загрузки. Попробуйте позже.</p>';
  }
}

window.removeFromFavorites = async function(favId) {
  if (confirm('Удалить из избранного?')) {
    try {
      await deleteDoc(doc(db, 'favorites', favId));
      await loadFavorites(auth.currentUser.uid); // Перезагружаем список
      alert('Удалено из избранного!');
    } catch (error) {
      alert('Ошибка: ' + error.message);
    }
  }
};