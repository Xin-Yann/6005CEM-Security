import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();
const auth = getAuth();

document.getElementById('signIn').addEventListener('click', async (event) => {
  event.preventDefault();
  const email = document.getElementById('Email').value;
  const password = document.getElementById('Password').value;
  const checkbox = document.getElementById('checkbox');

  if (!email || !password) {
    window.alert('Email and password must be filled out.');
    return;
  }

  if (!email.endsWith('@staff.com')) {
    window.alert('Only staff members are allowed to login.');
    return;
  }

  if (!checkbox.checked) {
    window.alert('You must agree to the Privacy Policy & T&C.');
    return;
  }

  try {
    const staffCredential = await signInWithEmailAndPassword(auth, email, password);
    const staff = staffCredential.user;
    console.log('Signed in user:', staff);

    await logLoginActivity(staff.email);

    window.location.href = "staff-home.html";
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error('Error signing in: ', errorCode, errorMessage);
    switch (errorCode) {
      case 'auth/wrong-password':
        window.alert("Invalid password. Please try again.");
        break;
      case 'auth/user-not-found':
        window.alert("No user found with this email. Please sign up.");
        break;
      case 'auth/invalid-email':
        window.alert("Invalid email format. Please check your email.");
        break;
      case 'auth/email-already-in-use':
        window.alert("The email address is already in use by another account.");
        break;
      default:
        window.alert("Error: " + errorMessage);
    }
  }
});

async function logLoginActivity(email) {
  try {
    const staffActivityRef = collection(db, 'staff_activity');
    await addDoc(staffActivityRef, {
      email: email,
      loginTime: Timestamp.now(),
      logoutTime: null
    });
    console.log("Login activity logged successfully with logoutTime set to null.");
  } catch (error) {
    console.error('Error logging login activity:', error);
  }
}
