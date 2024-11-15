import { getFirestore, collection, getDocs, query, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const db = getFirestore();
    const auth = getAuth();

    // Function to fetch and display product actions (add, edit, delete)
    async function fetchAndDisplayProductActions() {
        try {
            console.log('Fetching details for all product actions (add, edit, delete)');

            const addQuery = query(collection(db, 'staff_action', 'product', 'add'));
            const addSnapshot = await getDocs(addQuery);

            const editQuery = query(collection(db, 'staff_action', 'product', 'edit'));
            const editSnapshot = await getDocs(editQuery);

            const deleteQuery = query(collection(db, 'staff_action', 'product', 'delete'));
            const deleteSnapshot = await getDocs(deleteQuery);

            const productTable = document.getElementById('product-table');
            const noActionRowProduct = document.getElementById('no-action-row-product');

            if (!productTable || !noActionRowProduct) {
                console.error('Table or no-action-row element is missing in the HTML');
                return;
            }

            productTable.querySelector('tbody').innerHTML = '';

            const allActions = [
                ...addSnapshot.docs.map(doc => ({ ...doc.data(), actionType: 'add' })),
                ...editSnapshot.docs.map(doc => ({ ...doc.data(), actionType: 'edit' })),
                ...deleteSnapshot.docs.map(doc => ({ ...doc.data(), actionType: 'delete' }))
            ];

            if (allActions.length > 0) {
                noActionRowProduct.style.display = 'none';

                allActions.forEach((productAction) => {
                    const timeFormatted = productAction.time
                        ? new Date(productAction.time.toDate()).toLocaleString('en-US', {
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

                    const actionRow = document.createElement('tr');
                    actionRow.innerHTML = `
                        <td>${productAction.email || ''}</td>
                        <td>${productAction.actionType || ''}</td>
                        <td>${productAction.action || ''}</td>
                        <td>${timeFormatted}</td>
                    `;
                    productTable.querySelector('tbody').appendChild(actionRow);
                });
            } else {
                noActionRowProduct.style.display = 'table-row';
            }
        } catch (error) {
            console.error('Error fetching product actions:', error);
        }
    }

    // Function to fetch and display promo actions (add, edit, delete)
    async function fetchAndDisplayPromoActions() {
        try {
            console.log('Fetching details for all promo actions (add, edit, delete)');

            const addQuery = query(collection(db, 'staff_action', 'promo', 'add'));
            const addSnapshot = await getDocs(addQuery);

            const editQuery = query(collection(db, 'staff_action', 'promo', 'edit'));
            const editSnapshot = await getDocs(editQuery);

            const deleteQuery = query(collection(db, 'staff_action', 'promo', 'delete'));
            const deleteSnapshot = await getDocs(deleteQuery);

            const promoTable = document.getElementById('promo-table');
            const noActionRowPromo = document.getElementById('no-action-row-promo');

            if (!promoTable || !noActionRowPromo) {
                console.error('Table or no-action-row element is missing in the HTML');
                return;
            }

            promoTable.querySelector('tbody').innerHTML = '';

            const allActions = [
                ...addSnapshot.docs.map(doc => ({ ...doc.data(), actionType: 'add' })),
                ...editSnapshot.docs.map(doc => ({ ...doc.data(), actionType: 'edit' })),
                ...deleteSnapshot.docs.map(doc => ({ ...doc.data(), actionType: 'delete' }))
            ];

            if (allActions.length > 0) {
                noActionRowPromo.style.display = 'none';

                allActions.forEach((promoAction) => {
                    const timeFormatted = promoAction.time
                        ? new Date(promoAction.time.toDate()).toLocaleString('en-US', {
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

                    const actionRow = document.createElement('tr');
                    actionRow.innerHTML = `
                        <td>${promoAction.email || ''}</td>
                        <td>${promoAction.actionType || ''}</td>
                        <td>${promoAction.action || ''}</td>
                        <td>${timeFormatted}</td>
                    `;
                    promoTable.querySelector('tbody').appendChild(actionRow);
                });
            } else {
                noActionRowPromo.style.display = 'table-row';
            }
        } catch (error) {
            console.error('Error fetching promo actions:', error);
        }
    }

    // Function to fetch and display delivery status actions
    async function fetchAndDisplayMultipleDeliveryStatusAction() {
        try {
            console.log('Fetching details for all delivery status actions');

            const q = query(collection(db, 'staff_action', 'delivery_status', 'update'));
            const querySnapshot = await getDocs(q);

            const deliveryStatusTable = document.getElementById('delivery-status-table');
            const noActionRowDeliveryStatus = document.getElementById('no-action-row-delivery-status');

            if (!deliveryStatusTable || !noActionRowDeliveryStatus) {
                console.error('Table or no-action-row element is missing in the HTML');
                return;
            }

            deliveryStatusTable.querySelector('tbody').innerHTML = '';

            const deliveryStatusActions = querySnapshot.docs.map(doc => doc.data());

            if (deliveryStatusActions.length > 0) {
                noActionRowDeliveryStatus.style.display = 'none';

                deliveryStatusActions.forEach((deliveryStatusAction) => {
                    const timeFormatted = deliveryStatusAction.time
                        ? new Date(deliveryStatusAction.time.toDate()).toLocaleString('en-US', {
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

                    const actionRow = document.createElement('tr');
                    actionRow.innerHTML = `
                        <td>${deliveryStatusAction.email || ''}</td>
                        <td>${deliveryStatusAction.action || ''}</td>
                        <td>${timeFormatted}</td>
                    `;
                    deliveryStatusTable.querySelector('tbody').appendChild(actionRow);
                });
            } else {
                noActionRowDeliveryStatus.style.display = 'table-row';
            }
        } catch (error) {
            console.error('Error fetching delivery status actions:', error);
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
                        fetchAndDisplayProductActions();
                        fetchAndDisplayPromoActions();
                        fetchAndDisplayMultipleDeliveryStatusAction();
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
