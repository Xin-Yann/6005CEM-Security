import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();
const auth = getAuth();

document.getElementById('signIn').addEventListener('click', (event) => {
  event.preventDefault();
  const email = document.getElementById('Email').value;
  const password = document.getElementById('Password').value;
  const checkbox = document.getElementById('checkbox');

  if (!email || !password) {
    window.alert('Email and password must be filled out.');
    return; 
  }

  if (email.endsWith('@staff.com')) {
    window.alert('Invalid Email');
    return;
  }

  if (!checkbox.checked) {
    window.alert('You must agree to the Privacy Policy & T&C.');
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log('Signed in user:', user);

      sessionStorage.setItem('userEmail', user.email);

      window.location.href = "../html/home.html";
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Sign-in error:', errorCode, errorMessage);
      window.alert("Invalid email or password. Please try again.");
    });
});
