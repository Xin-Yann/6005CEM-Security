import { getFirestore, collection, getDocs, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const db = getFirestore();
    const auth = getAuth();

    async function fetchAndDisplayPersonalDetails(email) {
        try {
            console.log(`Fetching details for email: ${email}`);

            const q = query(collection(db, 'staffs'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const staffData = doc.data();
                    console.log('Staff data fetched:', staffData);

                    document.getElementById('Name').value = staffData.name || '';
                    document.getElementById('Email').value = staffData.email || '';
                    document.getElementById('Contact').value = staffData.contact || '';
                });
            } else {
                console.log('Staff details document does not exist.');
            }
        } catch (error) {
            console.error('Error fetching staff details:', error);
        }
    }

    onAuthStateChanged(auth, (staff) => {
        if (staff) {
            const staffEmail = sessionStorage.getItem('staffEmail');
            if (Email) {
                fetchAndDisplayPersonalDetails(staffEmail);
            } else {
                console.log('No staff email found in session storage.');
            }
        } else {
            console.log('No staff is authenticated. Redirecting to login page.');
            window.location.href = "/html/staff/staff-login.html";
        }
    });

    // Function to validate input fields
    function validateInputs() {
        const name = document.getElementById('Name').value.trim();
        const email = document.getElementById('Email').value.trim();
        const contact = document.getElementById('Contact').value.trim();

        const contactPattern = /^[0-9\s\-]+$/;

        if (!name || !email || !contact) {
            window.alert('Please fill in all the details.');
            return false;
        }

        if (!contactPattern.test(contact)) {
            window.alert('Invalid contact number format.');
            return false;
        }

        return true;
    }

    // Function to save the edited details
    async function saveEditedDetails(email) {
        try {
            if (!validateInputs()) {
                return; 
            }
            const q = query(collection(db, 'staffs'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach(async (docSnapshot) => {
                    const docRef = doc(db, 'staffs', docSnapshot.id);

                    const updatedData = {
                        name: document.getElementById('Name').value,
                        email: document.getElementById('Email').value,
                        contact: document.getElementById('Contact').value,
                    };

                    await updateDoc(docRef, updatedData);
                    alert('Staff details updated successfully.');
                });
            } else {
                alert('Staff details document does not exist.');
            }
        } catch (error) {
            console.error('Error updating staff details:', error);
        }
    }

    const saveBtn = document.getElementById('save');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const staffEmail = sessionStorage.getItem('staffEmail');
            if (staffEmail) {
                saveEditedDetails(staffEmail);
            } else {
                console.log('No staff email found in session storage.');
            }
        });
    }
});
