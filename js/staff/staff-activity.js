import { getFirestore, collection, getDocs, query, where, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const db = getFirestore();
    const auth = getAuth();

    // Function to fetch and display staff activity
    async function fetchAndDisplayMultipleStaffActivity() {
        try {
            console.log('Fetching details for all staff activity');

            const q = query(collection(db, 'staff_activity'));
            const querySnapshot = await getDocs(q);

            const noStaffActivityRow = document.getElementById('no-staff-activity-row');

            if (!querySnapshot.empty) {
                noStaffActivityRow.style.display = 'none';

                querySnapshot.forEach((docSnapshot) => {
                    const staffData = docSnapshot.data();

                    // Convert Firestore timestamps to desired format
                    const loginTimeFormatted = staffData.loginTime
                        ? new Date(staffData.loginTime.toDate()).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            second: 'numeric',
                            hour12: true,
                            timeZoneName: 'short'
                        })
                        : '';

                    const logoutTimeFormatted = staffData.logoutTime
                        ? new Date(staffData.logoutTime.toDate()).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            second: 'numeric',
                            hour12: true,
                            timeZoneName: 'short'
                        })
                        : '';

                    const staffRow = document.createElement('tr');
                    staffRow.innerHTML = `
                        <td>${staffData.email || ''}</td>
                        <td>${loginTimeFormatted}</td>
                        <td>${logoutTimeFormatted}</td>
                    `;
                    document.getElementById('staff-table').querySelector('tbody').appendChild(staffRow);
                });
            } else {
                noStaffActivityRow.style.display = 'table-row';
            }
        } catch (error) {
            console.error('Error fetching staff details:', error);
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
                        fetchAndDisplayMultipleStaffActivity();
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
