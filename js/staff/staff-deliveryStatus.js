import { getFirestore, collection, query, getDocs, updateDoc, doc, orderBy, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// Function to fetch and display delivery status
async function fetchAndDisplayDeliveryStatus() {
    try {
        const q = query(collection(db, 'orders'), orderBy('orderID', 'asc'));
        const querySnapshot = await getDocs(q);

        const statusContainer = document.getElementById('statusContainer');
        statusContainer.innerHTML = ''; 

        if (!querySnapshot.empty) {
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Tracking Number</th>
                        <th>Status</th>
                        <th>Update Status</th>
                    </tr>
                </thead>
                <tbody></tbody>
            `;

            querySnapshot.forEach((doc) => {
                const orderData = doc.data();
                const orderId = orderData.orderID || 'N/A'; // orderID should be a number
                const trackingNumber = orderData.trackingNumber || 'N/A';
                const deliveryStatus = orderData.status || 'Pending';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${orderId}</td> 
                    <td>${trackingNumber}</td>
                    <td>${deliveryStatus}</td>
                    <td>
                        ${deliveryStatus !== 'Complete' ? `
                            <form onsubmit="event.preventDefault(); updateOrderStatus('${doc.id}', ${orderId}, '${trackingNumber}');">
                                <select id="newStatus-${doc.id}">
                                    <option value="Pending" ${deliveryStatus === 'Pending' ? 'selected' : ''}>Pending</option>
                                    <option value="Shipped" ${deliveryStatus === 'Shipped' ? 'selected' : ''}>Shipped</option>
                                    <option value="Delivered" ${deliveryStatus === 'Delivered' ? 'selected' : ''}>Delivered</option>
                                </select>
                                &nbsp;
                                <button class="btn" type="submit">Update</button>
                            </form>
                        ` : '<p style="margin-top: 1rem;">Complete</p>'}
                    </td>
                `;

                table.querySelector('tbody').appendChild(row);
            });

            statusContainer.appendChild(table);
        } else {
            statusContainer.innerHTML = '<p>No orders found.</p>';
        }
    } catch (error) {
        console.error('Error fetching delivery status:', error);
    }
}

// Function to update order status and log action
async function updateOrderStatus(docId, orderId, trackingNumber) {
    const newStatus = document.getElementById(`newStatus-${docId}`).value;

    try {
        const orderRef = doc(db, 'orders', docId);
        await updateDoc(orderRef, {
            status: newStatus
        });

        // Log the action into staff_action collection
        const staffEmail = auth.currentUser?.email;
        if (staffEmail) {
            await logStaffAction(staffEmail, `update delivery status of order ${orderId}, ${trackingNumber} to ${newStatus}`);
        } else {
            console.error("No user is logged in");
        }

        window.alert('Order status updated successfully');
        fetchAndDisplayDeliveryStatus();
    } catch (error) {
        console.error('Error updating order status:', error);
        window.alert('Error updating order status');
    }
}

// Function to log staff action
async function logStaffAction(email, action) {
    try {
        const actionRef = collection(db, 'staff_action','delivery_status','update');
        const actionDocRef = doc(actionRef);
        await setDoc(actionDocRef, {
            email: email,
            action: action,
            time: Timestamp.now()
        });
        console.log("Staff action logged successfully.");
    } catch (error) {
        console.error('Error logging staff action:', error);
    }
}

window.updateOrderStatus = updateOrderStatus;

// Authenticate user and display delivery status
onAuthStateChanged(auth, (user) => {
    if (user) {
        fetchAndDisplayDeliveryStatus(); // Display delivery status if user is authenticated
    } else {
        console.log('No user is authenticated. Redirecting to login page.');
        window.location.href = "/html/login.html"; // Redirect to login page if not authenticated
    }
});
