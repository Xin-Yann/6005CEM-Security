import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
const auth = getAuth();
const db = getFirestore();

document.getElementById('signUp').addEventListener('click', async (event) => {
  event.preventDefault();
  try {
    
    const name = document.getElementById('Name').value.trim();
    const email = document.getElementById('Email').value.trim();
    const password = document.getElementById('Password').value.trim();
    const contact = document.getElementById('Contact').value.trim();
    const checkbox = document.getElementById('checkbox');
    const role = document.getElementById('role').value;

    const uppercase = /[A-Z]/;
    const lowercase = /[a-z]/;

    if (!name || !email || !password || !contact) {
      window.alert('Please fill in all the details.');
      return;
    }

    if (!email.endsWith('@staff.com')) {
      window.alert('Only staff members are allowed to register.');
      return;
    }

    if (password.length < 8 || !uppercase.test(password) || !lowercase.test(password)) {
      window.alert('Password must be at least 8 characters long and contain at least one uppercase and one lowercase character.');
      return;
    }

    if (!checkbox.checked) {
      window.alert('You must agree to the Privacy Policy & T&C.');
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    const userId = userCredential.user.uid;

    try {

      const docRef = await setDoc(doc(db, 'staffs', userId), {
        userId: userId,
        name: name,
        email: email,
        contact: contact,
        role: role,

      });

      if (role === 'admin') {
        window.location.href = 'displayData.html'; // Redirect to admin page
      } else if (role === 'staff') {
        window.location.href = '../staff/staff-home.html'; // Redirect to staff home page
      }
      
      console.log('User created with email: ', userCredential.user.email);
      console.log('Document written with ID (used as user ID): ', docRef.id);

    } catch (firestoreError) {
      console.error("Error adding document to Firestore: ", firestoreError.message);

      if (!userCredential.user) {
        try {
          await userCredential.user.delete();
          console.error("Firestore failed, user deleted from Firebase Authentication");
        } catch (deleteError) {
          console.error("Error deleting user from Firebase Authentication: ", deleteError);
        }
      }

      console.error("Firestore failed, user deleted from Firebase Authentication");
    }

  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;
    console.error('Error adding document: ', errorCode, errorMessage);
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
