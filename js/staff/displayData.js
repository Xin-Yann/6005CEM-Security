import { getFirestore, collection, getDocs, query, where, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const db = getFirestore();
    const auth = getAuth();

    // Function to fetch and display multiple staff details
    async function fetchAndDisplayMultipleStaffDetails() {
        try {
            console.log('Fetching details for all staff');

            // Query to get all documents from 'staffs' collection
            const q = query(collection(db, 'staffs'));
            const querySnapshot = await getDocs(q);

            const noStaffDataRow = document.getElementById('no-staff-data-row');

            if (!querySnapshot.empty) {
                // Hide the "no staff data" row
                noStaffDataRow.style.display = 'none';

                // Iterate over the fetched data and create table rows
                querySnapshot.forEach((docSnapshot) => {
                    const staffData = docSnapshot.data();
                    const staffId = docSnapshot.id; // Get document ID for deletion
                    console.log('Staff data fetched:', staffData);

                    // Create a table row for each staff member
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
                // Show the "no data" row if there are no staff records
                noStaffDataRow.style.display = 'table-row';
            }
        } catch (error) {
            console.error('Error fetching staff details:', error);
        }
    }

    // Function to fetch and display multiple user details
    async function fetchAndDisplayMultipleUserDetails() {
        try {
            console.log('Fetching details for all users');

            // Query to get all documents from 'users' collection
            const q = query(collection(db, 'users'));
            const querySnapshot = await getDocs(q);

            const noUserDataRow = document.getElementById('no-user-data-row');

            if (!querySnapshot.empty) {
                // Hide the "no user data" row
                noUserDataRow.style.display = 'none';

                // Iterate over the fetched data and create table rows
                querySnapshot.forEach((docSnapshot) => {
                    const userData = docSnapshot.data();
                    console.log('User data fetched:', userData);

                    // Create a table row for each user
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
                    `;
                    document.getElementById('user-table').querySelector('tbody').appendChild(userRow);
                });
            } else {
                // Show the "no data" row if there are no user records
                noUserDataRow.style.display = 'table-row';
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    }

    // Check if the user is authenticated and is an admin
    onAuthStateChanged(auth, (staff) => {
        if (staff) {
            // Get the current user's UID
            const userUid = staff.uid;
            
            // Query Firestore to check the user's role (assuming 'role' is stored in the 'staffs' collection)
            const staffRef = doc(db, 'staffs', userUid);
            getDoc(staffRef).then((docSnapshot) => {
                if (docSnapshot.exists()) {
                    const staffData = docSnapshot.data();

                    // Check if the user's role is 'admin'
                    if (staffData.role === 'admin') {
                        // Fetch and display staff and user details if the user is an admin
                        fetchAndDisplayMultipleStaffDetails();
                        fetchAndDisplayMultipleUserDetails();
                    } else {
                        // Redirect non-admin users with access denied message
                        alert('Access Denied. You do not have permission to view this page.');
                        window.location.href = "/html/staff/staff-home.html"; // Redirect to home or login page
                    }
                } else {
                    console.log('No staff data found for the authenticated user');
                    window.location.href = "/html/staff/staff-login.html"; // Redirect to login page if no data
                }
            }).catch((error) => {
                console.error('Error checking staff role:', error);
            });
        } else {
            console.log('No staff is authenticated. Redirecting to login page.');
            window.location.href = "/html/staff/staff-login.html"; // Redirect to login if not authenticated
        }
    });
});
