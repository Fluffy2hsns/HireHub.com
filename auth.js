import { auth, db, createUserWithEmailAndPassword, setDoc, doc } from "./firebase.js";

const form = document.getElementById('auth-form');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = form.email.value;
  const password = form.password.value;

  try {
    // Создаем пользователя
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userId = userCredential.user.uid;

    // Сохраняем данные в Firestore
    await setDoc(doc(db, 'users', userId), {
      email: email,
      name: form.name.value,
      surname: form.surname.value,
      phone: form.phone.value,
      profession: form.profession.value,
      role: 'seeker',
      createdAt: new Date()
    });

    alert('Регистрация успешна!');
    window.location.href = 'index.html';
  } catch (error) {
    alert('Ошибка: ' + error.message);
  }
});