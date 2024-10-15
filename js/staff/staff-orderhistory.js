import { getFirestore, collection, query, orderBy, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

// Function to fetch order data and display it on the webpage
async function fetchOrdersAndDisplay() {
    try {
        const ordersCollection = query(collection(db, 'orders'), orderBy('orderDate', 'desc'));
        
        const ordersSnapshot = await getDocs(ordersCollection);

        const ordersContainer = document.getElementById('orders-container');
        ordersContainer.innerHTML = '';

        const table = document.createElement('table');
        table.classList.add('table', 'table-bordered', 'table-hover', 'table-style');
        table.style.backgroundColor = 'white';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Order ID', 'Order Date', 'Items', 'Order Details', 'Payment Details', 'User Details', 'Status'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        ordersSnapshot.forEach(doc => {
            const orderData = doc.data();
            const tr = document.createElement('tr');

            // Order ID
            const orderIdTd = document.createElement('td');
            orderIdTd.textContent = orderData.orderID || 'N/A';
            tr.appendChild(orderIdTd);

            // Order Date
            const orderDateTd = document.createElement('td');
            orderDateTd.textContent = new Date(orderData.orderDate).toLocaleString() || 'N/A';
            tr.appendChild(orderDateTd);

            // Items
            const itemsTd = document.createElement('td');
            if (orderData.cartItems && Array.isArray(orderData.cartItems)) {
                orderData.cartItems.forEach(item => {
                    const itemDiv = document.createElement('div');
                    itemDiv.classList.add('item-details');

                    const itemId = document.createElement('p');
                    itemId.textContent = `Id: ${item.id || 'N/A'}`;
                    itemDiv.appendChild(itemId);

                    const itemType = document.createElement('p');
                    itemType.textContent = `Type: ${item.type || 'N/A'}`;
                    itemDiv.appendChild(itemType);

                    const itemImage = document.createElement('img');
                    itemImage.src = item.image || '';
                    itemImage.alt = item.name || 'Item Image';
                    itemImage.classList.add('table-image');
                    itemDiv.appendChild(itemImage);

                    const itemName = document.createElement('p');
                    itemName.textContent = `Name: ${item.name || 'N/A'}`;
                    itemDiv.appendChild(itemName);

                    const itemPrice = document.createElement('p');
                    itemPrice.textContent = `Price: ${item.price || 'N/A'}`;
                    itemDiv.appendChild(itemPrice);

                    const itemQuantity = document.createElement('p');
                    itemQuantity.textContent = `Quantity: ${item.quantity || 'N/A'}`;
                    itemDiv.appendChild(itemQuantity);

                    const itemTotalPrice = document.createElement('p');
                    itemTotalPrice.textContent = `Total Price: ${item.totalPrice || 'N/A'}`;
                    itemDiv.appendChild(itemTotalPrice);

                    itemsTd.appendChild(itemDiv);
                });
            } else {
                itemsTd.textContent = 'N/A';
            }
            tr.appendChild(itemsTd);

            // Order Details
            const orderDetailsTd = document.createElement('td');
            if (orderData.shippingFees || orderData.orderTotal) {
                const orderDetailsDiv = document.createElement('div');
                orderDetailsDiv.classList.add('order-details');

                const discountAmount = document.createElement('p');
                discountAmount.textContent = `Discount Amount: RM ${orderData.discountAmount || 'N/A'}`;
                orderDetailsDiv.appendChild(discountAmount);

                const pointAmount = document.createElement('p');
                pointAmount.textContent = `Point Amount: RM ${orderData.pointAmount || 'N/A'}`;
                orderDetailsDiv.appendChild(pointAmount);


                const shippingFees = document.createElement('p');
                shippingFees.textContent = `Shipping Fees: RM ${orderData.shippingFees || 'N/A'}`;
                orderDetailsDiv.appendChild(shippingFees);

                const orderTotal = document.createElement('p');
                orderTotal.textContent = `Order Total: RM ${orderData.orderTotal || 'N/A'}`;
                orderDetailsDiv.appendChild(orderTotal);

                orderDetailsTd.appendChild(orderDetailsDiv);
            } else {
                orderDetailsTd.textContent = 'N/A';
            }
            tr.appendChild(orderDetailsTd);

            // Payment Details
            const paymentDetailsTd = document.createElement('td');
            if (orderData.paymentMethod || orderData.paymentReferenceId || orderData.receipt) {
                const paymentDetailsDiv = document.createElement('div');
                paymentDetailsDiv.classList.add('payment-details');

                const paymentMethod = document.createElement('p');
                paymentMethod.textContent = `Payment Method: ${orderData.paymentMethod || 'N/A'}`;
                paymentDetailsDiv.appendChild(paymentMethod);

                const paymentReferenceId = document.createElement('p');
                paymentReferenceId.textContent = `Reference ID: ${orderData.paymentReferenceId || 'N/A'}`;
                paymentDetailsDiv.appendChild(paymentReferenceId);

                if (orderData.receipt) {
                    const receiptImage = document.createElement('img');
                    receiptImage.src = `/image/${orderData.receipt}`;
                    receiptImage.alt = 'Receipt Image';
                    receiptImage.classList.add('table-receipt-image');
                    paymentDetailsDiv.appendChild(receiptImage);
                }

                paymentDetailsTd.appendChild(paymentDetailsDiv);
            } else {
                paymentDetailsTd.textContent = 'N/A';
            }
            tr.appendChild(paymentDetailsTd);

            // User Details
            const userInfoTd = document.createElement('td');
            if (orderData.userDetails) {
                const userInfoDiv = document.createElement('div');
                userInfoDiv.classList.add('user-info');

                const userName = document.createElement('p');
                userName.textContent = `Name: ${orderData.userDetails.name || 'N/A'}`;
                userInfoDiv.appendChild(userName);

                const userEmail = document.createElement('p');
                userEmail.textContent = `Email: ${orderData.userDetails.email || 'N/A'}`;
                userInfoDiv.appendChild(userEmail);

                const userContact = document.createElement('p');
                userContact.textContent = `Contact: ${orderData.userDetails.contact || 'N/A'}`;
                userInfoDiv.appendChild(userContact);

                const userAddress = document.createElement('p');
                userAddress.textContent = `Address: ${orderData.userDetails.address || 'N/A'}, ${orderData.userDetails.postcode || 'N/A'}, ${orderData.userDetails.city || 'N/A'}, ${orderData.userDetails.state || 'N/A'}`;
                userInfoDiv.appendChild(userAddress);

                userInfoTd.appendChild(userInfoDiv);
            } else {
                userInfoTd.textContent = 'N/A';
            }
            tr.appendChild(userInfoTd);

            // Status
            const statusTd = document.createElement('td');
            statusTd.textContent = orderData.status;
            tr.appendChild(statusTd);

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        ordersContainer.appendChild(table);
    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    fetchOrdersAndDisplay();
});
