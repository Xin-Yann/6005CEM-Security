import { getFirestore, collection, getDocs, query, where, getDoc, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const db = getFirestore();
    const auth = getAuth();

    // Function to fetch and display multiple staff details
    async function fetchAndDisplayMultipleStaffDetails() {
        try {
            console.log('Fetching details for all staff');

            const q = query(collection(db, 'staffs'));
            const querySnapshot = await getDocs(q);

            const noStaffDataRow = document.getElementById('no-staff-data-row');

            if (!querySnapshot.empty) {
                noStaffDataRow.style.display = 'none';

                querySnapshot.forEach((docSnapshot) => {
                    const staffData = docSnapshot.data();
                    const staffId = docSnapshot.id;

                    const staffRow = document.createElement('tr');
                    staffRow.innerHTML = `
                        <td>${staffData.name || ''}</td>
                        <td>${staffData.email || ''}</td>
                        <td>${staffData.contact || ''}</td>
                        <td><button class="delete-btn" data-id="${staffId}">Delete</button></td>
                    `;
                    document.getElementById('staff-table').querySelector('tbody').appendChild(staffRow);
                });
            } else {
                noStaffDataRow.style.display = 'table-row';
            }
        } catch (error) {
            console.error('Error fetching staff details:', error);
        }
    }

    // Function to delete a user document
    async function deleteUser(userId) {
        try {
            await deleteDoc(doc(db, 'users', userId));
            console.log(`User with ID ${userId} deleted successfully`);
            document.querySelector(`[data-id="${userId}"]`).closest('tr').remove();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    }

    // Function to fetch and display multiple user details
    async function fetchAndDisplayMultipleUserDetails() {
        try {
            console.log('Fetching details for all users');

            const q = query(collection(db, 'users'));
            const querySnapshot = await getDocs(q);

            const noUserDataRow = document.getElementById('no-user-data-row');

            if (!querySnapshot.empty) {
                noUserDataRow.style.display = 'none';

                querySnapshot.forEach((docSnapshot) => {
                    const userData = docSnapshot.data();
                    const userId = docSnapshot.id;

                    const userRow = document.createElement('tr');
                    userRow.innerHTML = `
                        <td>${userData.name || ''}</td>
                        <td>${userData.email || ''}</td>
                        <td>${userData.contact || ''}</td>
                        <td>${userData.address || ''}</td>
                        <td>${userData.city || ''}</td>
                        <td>${userData.post || ''}</td>
                        <td>${userData.state || ''}</td>
                        <td>${userData.userId || ''}</td>
                        <td><button class="delete-btn" data-id="${userId}">Delete</button></td>
                    `;
                    document.getElementById('user-table').querySelector('tbody').appendChild(userRow);

                    userRow.querySelector('.delete-btn').addEventListener('click', () => deleteUser(userId));
                });
            } else {
                noUserDataRow.style.display = 'table-row';
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    }

    // Check if the user is authenticated and is an admin
    onAuthStateChanged(auth, (staff) => {
        if (staff) {
            const userUid = staff.uid;
            
            const staffRef = doc(db, 'staffs', userUid);
            getDoc(staffRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const staffData = docSnapshot.data();

                    if (staffData.role === 'admin') {
                        fetchAndDisplayMultipleStaffDetails();
                        fetchAndDisplayMultipleUserDetails();
                    } else {
                        alert('Access Denied. You do not have permission to view this page.');
                        window.location.href = "/html/staff/staff-home.html";
                    }
                } else {
                    console.log('No staff data found for the authenticated user');
                    window.location.href = "/html/staff/staff-login.html";
                }
            }).catch((error) => {
                console.error('Error checking staff role:', error);
            });
        } else {
            console.log('No staff is authenticated. Redirecting to login page.');
            window.location.href = "/html/staff/staff-login.html";
        }
    });
});
