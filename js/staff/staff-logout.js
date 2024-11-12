import { getAuth, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, updateDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();
const auth = getAuth();

onAuthStateChanged(auth, (user) => {
  if (user) {
    document.getElementById('signOut').style.display = 'block'; 
  } else {
    document.getElementById('signOut').style.display = 'none'; 
  }
});

function handleProfileClick() {
  if (auth.currentUser) {
    window.location.href = "/html/staff/staff-profile.html";
  } else {
    window.location.href = "/html/staff/staff-login.html";
  }
}

const profile = document.getElementById('profile');
if (profile) {
  profile.addEventListener('click', handleProfileClick);
}

document.getElementById('signOut').addEventListener('click', async () => {
  const user = auth.currentUser;

  if (user) {
    const userEmail = user.email;

    try {
      const activityQuery = query(
        collection(db, 'staff_activity'),
        where('email', '==', userEmail),
        where('logoutTime', '==', null)
      );
      const querySnapshot = await getDocs(activityQuery);

      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref;

        await updateDoc(docRef, {
          logoutTime: Timestamp.now()
        });
        console.log('Logout time updated in Firestore');
      } else {
        console.log('No active login session found to update logout time.');
      }

      await signOut(auth);
      sessionStorage.clear();
      console.log('User signed out');
      window.location.href = "/html/staff/staff-login.html";
      window.alert("You have been successfully signed out.");
    } catch (error) {
      console.error('Error updating logout time or signing out:', error);
      window.alert("An error occurred while signing out. Please try again.");
    }
  }
});
