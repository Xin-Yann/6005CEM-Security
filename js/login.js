import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

// Initialize Firebase services
const db = getFirestore();
const auth = getAuth();

document.getElementById('signIn').addEventListener('click', (event) => {
  event.preventDefault();

  // Get form inputs
  const email = document.getElementById('Email').value.trim();
  const password = document.getElementById('Password').value;
  const checkbox = document.getElementById('checkbox');

  // Basic validations
  if (!email || !password) {
    window.alert('Email and password must be filled out.');
    return; 
  }
  if (!checkbox.checked) {
    window.alert('You must agree to the Privacy Policy & T&C.');
    return;
  }
  if (email.endsWith('@staff.com')) {
    window.alert('Invalid Email');
    return;
  }

  // Sign in with Firebase Authentication
  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log('Signed in user:', user);

      // Store user email in session storage and redirect to home
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
