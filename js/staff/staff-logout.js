import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();
const auth = getAuth();

function handleProfileClick() {
    if (auth.currentUser) {
      window.location.href = "/html/staff/staff-profile.html";
    } else {
      alert('Please Login to view your profile details.');
      window.location.href = "/html/staff/staff-login.html";
    }
  }
  
  const profile = document.getElementById('profile');
  if (profile) {
    profile.addEventListener('click', handleProfileClick);
  }

document.getElementById('signOut').addEventListener('click', () => {
    // Sign out the current user
    signOut(auth)
        .then(() => {
            // Sign-out successful.
            sessionStorage.clear();
            console.log('User signed out');
            window.location.href = "/html/staff/staff-login.html";
            window.alert("You have been successfully signed out.");
            history.replaceState(null, null, '/html/staff/staff-login.html');
        })
        .catch((error) => {
            console.error('Sign-out error:', error);
        });
});