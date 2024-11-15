// staff-manageUsers.js

import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (userDoc.exists() && userDoc.data().role === "admin") {
            loadUsers();
        } else {
            alert("Access Denied: Admins only.");
            window.location.href = "/html/staff/staff-home.html";
        }
    } else {
        window.location.href = "/login.html";
    }
});

async function loadUsers() {
    const userTableBody = document.getElementById("userTableBody");
    const userDocs = await getDocs(collection(db, "users"));
    
    userDocs.forEach((doc) => {
        const userData = doc.data();
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${userData.userId}</td>
            <td>${userData.email}</td>
            <td>${userData.role}</td>
        `;
        userTableBody.appendChild(row);
    });
}
