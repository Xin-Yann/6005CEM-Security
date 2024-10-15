import { initializeApp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyA9TiRWsrzJUqh7l7tS_8fcWf6aVpFRlHo",
  authDomain: "enterprise-project-1fa0a.firebaseapp.com",
  projectId: "enterprise-project-1fa0a",
  storageBucket: "enterprise-project-1fa0a.appspot.com",
  messagingSenderId: "303653703033",
  appId: "1:303653703033:web:a65a211a5c5ed9e3c7f3a8",
  measurementId: "G-F37QT7Q3RJ"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
const auth = getAuth(app);
console.log(app);