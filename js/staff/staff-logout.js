import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, where, updateDoc, Timestamp, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

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

document.getElementById('signOut').addEventListener('click', async () => {
  try {
    const email = sessionStorage.getItem('staffEmail');
    if (email) {
      // Log logout activity
      await logLogoutActivity(email);
    }

    // Sign out the current user
    await signOut(auth);

    // Clear session storage and redirect to login page
    sessionStorage.clear();
    console.log('User signed out');
    window.location.href = "/html/staff/staff-login.html";
    window.alert("You have been successfully signed out.");
    history.replaceState(null, null, '/html/staff/staff-login.html');
  } catch (error) {
    console.error('Sign-out error:', error);
  }
});

async function logLogoutActivity(email) {
  try {
    const staffActivityRef = collection(db, 'staff_activity');
    const q = query(
      staffActivityRef,
      where("email", "==", email),
      where("logoutTime", "==", null),
      orderBy("loginTime"),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No active login session found for this user.");
      return;
    }

    // Debugging: Log the document ID and data before updating
    const docRef = querySnapshot.docs[0].ref;
    console.log("Document to update:", docRef.id, querySnapshot.docs[0].data());

    // Update the document with the current logout time
    await updateDoc(docRef, { logoutTime: Timestamp.now() });
    console.log("Logout time updated successfully.");
  } catch (error) {
    console.error("Error logging logout activity:", error);
  }
}
