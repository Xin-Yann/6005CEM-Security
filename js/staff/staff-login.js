import { getAuth, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();
const auth = getAuth();

document.getElementById('signIn').addEventListener('click', async (event) => {
  event.preventDefault();
  const email = document.getElementById('Email').value.trim();
  const password = document.getElementById('Password').value.trim();
  const checkbox = document.getElementById('checkbox');

  if (!email || !password) {
    window.alert('Email and password must be filled out.');
    return;
  }

  // Check if the email ends with "@staff.com"
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

    // Fetch role from Firestore
    const docRef = doc(db, 'staffs', staff.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists() && docSnap.data().role === 'staff') {
      console.log('Role validated: ', docSnap.data().role);
      console.log('Signed in user:', staff);

      // Store user email in session storage
      sessionStorage.setItem('staffEmail', staff.email);

      window.location.href = "staff-home.html"; // Redirect to home page
    } else {
      console.error('Access denied: User does not have the staff role.');
      window.alert('Access denied. Only staff members can access this portal.');
      await signOut(auth); // Sign out if role validation fails
    }
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error('Error logging in: ', errorCode, errorMessage);
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
