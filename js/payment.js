import { getFirestore, collection, getDoc, getDocs, setDoc, doc, query, where, addDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth(); 

(function () {
    emailjs.init("86kjxi3kBUTZUUwYJ");
})();

function getCurrentUserId() {
    const user = auth.currentUser;
    return user ? user.uid : null;
}

auth.onAuthStateChanged(async (user) => {
    try {
        if (user) {
            const userId = getCurrentUserId(); 
            if (!userId) {
                console.error("Invalid userId:", userId);
                return;
            }

            updateCartItemCount(userId);
            await displayCartItems(userId); 
            await getCartData(userId);
            console.log("User authenticated. User ID:", userId);

            const userEmail = sessionStorage.getItem('userEmail');
            if (userEmail) {
                fetchAndDisplayPersonalDetails(userEmail);
            } else {
                console.log('No user email found in session storage.');
            }
        } else {
            console.log('No user is authenticated. Redirecting to login page.');
            window.location.href = "/html/login.html";
        }
    } catch (error) {
        console.error("Error in authentication state change:", error);
    }
});

const cart = document.getElementById('cart');
if (cart) {
    cart.addEventListener('click', handleCartClick);
}

function handleCartClick() {
    if (auth.currentUser) {
        window.location.href = "../html/cart.html";
    } else {
        window.alert('Please Login to view your cart.');
        window.location.href = "../html/login.html";
    }
}


// Function to fetch and display personal details
async function fetchAndDisplayPersonalDetails(email) {
    try {
        console.log(`Fetching details for email: ${email}`);

        const q = query(collection(db, 'users'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                console.log('User data fetched:', userData);

                // Populate form fields
                document.getElementById('Name').value = userData.name || '';
                document.getElementById('Email').value = userData.email || '';
                document.getElementById('Contact').value = userData.contact || '';
                document.getElementById('Address').value = userData.address || '';
                document.getElementById('State').value = userData.state || '';
                document.getElementById('City').value = userData.city || '';
                document.getElementById('Postcode').value = userData.post || '';

                // Display points
                const pointsDisplay = document.getElementById('point');
                const points = userData.points || 0;
                pointsDisplay.textContent = `Point: ${points}`;
                console.log(`User points: ${points}`);
            });
        } else {
            console.log('User details document does not exist.');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
    }
}

// Function to fetch cart data for a user
async function getCartData(userId) {
    try {
        const cartRef = doc(collection(db, 'carts'), userId); 
        const cartDoc = await getDoc(cartRef);
        if (cartDoc.exists()) {
            return cartDoc.data().cart || []; 
        } else {
            console.log("Cart document does not exist for the current user.");
            return [];
        }
    } catch (error) {
        console.error("Error fetching cart data from Firestore:", error);
        return [];
    }
}

const cartTable = document.createElement('table');
cartTable.classList.add('table');
cartTable.innerHTML = `
    <thead>
        <tr>
            <th>No</th>
            <th>Image</th>
            <th>Product</th>
            <th>Quantity</th>
            <th>Price (RM)</th>
            <th>Weight (g)</th>
            <th>Type</th>
            <th>Total Price</th>
            <th>Total Weight</th>
        </tr>
    </thead>
    <tbody></tbody>
`;
const cartTableBody = cartTable.querySelector('tbody');
const cartContainer = document.getElementById('cartItems');

async function displayCartItems(userId) {
    let cartItems = await getCartData(userId);
    if (!cartItems) {
        cartItems = []; 
    }

    cartTableBody.innerHTML = '';

    // Check if the cart is empty
    if (cartItems.length === 0) {
        document.getElementById('none').style.display = 'block';
        document.getElementById('cartItems').style.display = 'none';
        document.getElementById('total').style.display = 'none';
    } else {
        document.getElementById('none').style.display = 'none';
        document.getElementById('total').style.display = 'block';
        document.getElementById('cartItems').style.display = 'block';
    }

    let totalPrice = 0; 
    let totalWeight = 0;

    for (const [index, item] of cartItems.entries()) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td><img src="${item.image}" alt="Product Image" style="width: 100px;"></td>
            <td>${item.name}</td>
            <td><input type="text" min="1" value="${item.quantity}" class="quantity" disabled></td>
            <td>${item.price}</td>
            <td>${item.weight}</td>
            <td>${item.type}</td>
            <td class="total-price-cell"></td>
            <td class="total-weight-cell"></td>
        `;
        cartTableBody.appendChild(row);

        const itemTotalPrice = await calculateTotalPrice(item);
        const totalPriceCell = row.querySelector('.total-price-cell');
        totalPriceCell.textContent = `RM ${itemTotalPrice.toFixed(2)}`;
        totalPrice += itemTotalPrice;

        const itemTotalWeight = await calculateTotalWeight(item);
        const totalWeightCell = row.querySelector('.total-weight-cell');
        totalWeightCell.textContent = `${itemTotalWeight} g`;
        totalWeight += itemTotalWeight;
    }

    updateSubtotal(totalPrice);
    updateSubweight(totalWeight);
    calculateShippingFees(totalWeight);

    cartContainer.innerHTML = '';
    cartContainer.appendChild(cartTable);
}

// Function to update the cart item count in the UI
async function updateCartItemCount(userId) {
    try {
        const userCartDocRef = doc(collection(db, 'carts'), userId); 
        const userCartDocSnap = await getDoc(userCartDocRef); 

        if (userCartDocSnap.exists()) {
            const cartItems = userCartDocSnap.data().cart || []; 
            const cartItemCount = document.getElementById('cartItemCount');
            let totalCount = 0;
            cartItems.forEach(item => {
                totalCount += item.quantity;
            });
            cartItemCount.textContent = totalCount;
        }
    } catch (error) {
        console.error("Error updating cart item count:", error);
    }
}

updateCartItemCount(getCurrentUserId());

async function calculateTotalPrice(item) {
    const price = item.price ? parseFloat(item.price) : 0;
    const quantity = parseInt(item.quantity);
    if (!isNaN(price) && !isNaN(quantity)) {
        return price * quantity; 
    } else {
        console.error(`Invalid price or quantity for product: ${item.name}`);
        return 0;
    }
}

async function updateSubtotal(totalPrice) {
    const formattedTotalPrice = totalPrice.toFixed(2);
    const TotalPriceDisplay = document.getElementById('Subtotal');
    TotalPriceDisplay.textContent = `Subtotal: RM ${formattedTotalPrice}`;
}

async function calculateTotalWeight(item) {
    const weight = item.weight ? parseFloat(item.weight) : 0;
    const quantity = parseInt(item.quantity);
    if (!isNaN(weight) && !isNaN(quantity)) {
        return weight * quantity; 
    } else {
        console.error(`Invalid weight or quantity for product: ${item.name}`);
        return 0;
    }
}

async function updateSubweight(totalWeight) {
    const formattedTotalWeight = totalWeight;
    const TotalWeightDisplay = document.getElementById('Subweight');
    TotalWeightDisplay.textContent = `Weight: ${formattedTotalWeight} g`;
}

displayCartItems(getCurrentUserId());

document.getElementById("apply").onclick = function () {
    const totalPriceText = document.getElementById('Subtotal').textContent;
    const totalPrice = parseFloat(totalPriceText.replace(/[^0-9.]/g, "").trim());

    if (!isNaN(totalPrice)) {
        applyDiscount(totalPrice);
    } else {
        printAmount("discount_amount", "Total price is invalid.");
    }
};

function applyDiscount(totalPrice) {
    let discount = 0;
    const voucher = document.getElementById('Promocode').value;
    const voucher1 = "PETM15";

    if (voucher === voucher1) {
        discount = totalPrice * 0.15;
        printAmount("discount_amount", `-RM${discount.toFixed(2)}`);
    } else if (voucher === "") {
        printAmount("discount_amount", "Please enter promo code");
    } else {
        printAmount("discount_amount", "Promo code is invalid.");
    }
    const shippingFeesText = document.getElementById('ShippingFees').textContent.replace(/[^0-9.]/g, "").trim();
    const shippingFees = parseFloat(shippingFeesText);
    ordertotal(totalPrice, discount, shippingFees);
}

function printAmount(elementId, message) {
    document.getElementById(elementId).textContent = message;
}

window.onload = function () {
    const totalPriceText = document.getElementById('Subtotal').textContent;
    const totalPrice = parseFloat(totalPriceText.replace(/[^0-9.]/g, "").trim());

    if (!isNaN(totalPrice)) {
        calculateShippingFees(); 
    } else {
        printAmount("discount_amount", "Total price is invalid.");
    }
}

function calculateShippingFees(totalWeight) {
    let fees = 0;

    if (isNaN(totalWeight)) {
        return;
    }

    if (totalWeight <= 1000) {
        fees = 7.60;
    } else if (totalWeight <= 2000) {
        fees = 7.10;
    } else if (totalWeight <= 3000) {
        fees = 6.30;
    } else if (totalWeight <= 4000) {
        fees = 5.30;
    } else {
        fees = Math.ceil(totalWeight / 1000) * 3.80;
    }

    const formattedShippingFees = fees.toFixed(2);
    const TotalFeesDisplay = document.getElementById('ShippingFees');
    TotalFeesDisplay.textContent = `Shipping Fees: RM ${formattedShippingFees}`;

    const totalPriceText = document.getElementById('Subtotal').textContent;
    const totalPrice = parseFloat(totalPriceText.replace(/[^0-9.]/g, "").trim());

    ordertotal(totalPrice, 0, fees); 
}

function ordertotal(totalPrice, discount, fees) {
    const orderTotal = totalPrice - discount + fees;
    const OrderTotalDisplay = document.getElementById('OrderTotal');
    OrderTotalDisplay.textContent = `Order Total: RM ${orderTotal.toFixed(2)}`;
}

async function redeemPoints() {
    try {
        const pointsText = document.getElementById('point').textContent;
        let points = parseFloat(pointsText.replace(/[^0-9.]/g, "").trim());

        if (points <= 0) {
            console.error('No points available for redemption.');
            return;
        }

        // Calculate the redeemed discount
        const redeemedDiscount = points / 1000;
        printAmount("point_amount", `-RM${redeemedDiscount.toFixed(2)}`);

        const totalPriceText = document.getElementById('Subtotal').textContent;
        const totalPrice = parseFloat(totalPriceText.replace(/[^0-9.]/g, "").trim());

        const shippingFeesText = document.getElementById('ShippingFees').textContent.replace(/[^0-9.]/g, "").trim();
        const shippingFees = parseFloat(shippingFeesText);

        ordertotal(totalPrice, redeemedDiscount, shippingFees);

        const user = auth.currentUser;
        const email = user ? user.email : null;
        if (email) {
            const pointsToDeduct = redeemedDiscount * 1000; 
            await updateUserPointsByEmail(email, pointsToDeduct); 
        }

        await fetchAndDisplayPersonalDetails(email);
    } catch (error) {
        console.error('Error redeeming points:', error);
    }
}

async function updateUserPointsByEmail(email, pointsToDeduct) {
    const q = query(collection(db, 'users'), where('email', '==', email));
    try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0]; 
            const userRef = userDoc.ref;
            const userData = userDoc.data();
            const currentPoints = userData.points || 0;
            const updatedPoints = Math.max(0, currentPoints - pointsToDeduct); 
            await updateDoc(userRef, { points: updatedPoints });
            console.log(`User points updated successfully. New points: ${updatedPoints}`);
        } else {
            console.error('User document does not exist for the given email.');
        }
    } catch (error) {
        console.error('Error updating user points by email:', error);
    }
}

document.getElementById('redeem').addEventListener('click', redeemPoints);

async function sendOrderConfirmationEmail(orderDetails) {
    const emailParams = {
        user_name: orderDetails.userDetails.name,
        user_email: orderDetails.userDetails.email, 
        order_id: orderDetails.orderID,
        order_date: orderDetails.orderDate,
        tracking_number: orderDetails.trackingNumber,
        order_total: `RM ${orderDetails.orderTotal.toFixed(2)}`, 
        payment_method: orderDetails.paymentMethod,
    };

    try {
        const response = await emailjs.send('service_wio03zw', 'template_qicmnu7', emailParams);
        console.log('Order confirmation email sent successfully:', response);
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
    }
}


document.addEventListener('DOMContentLoaded', function() {
    const startDateInput = document.getElementById('ExpiryDate');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const day = String(tomorrow.getDate()).padStart(2, '0');
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const year = tomorrow.getFullYear();
    startDateInput.min = `${year}-${month}-${day}`;

    const payButton = document.getElementById('payButton');
    const paymentModalElement = document.getElementById('paymentModal');
    const paymentModal = new bootstrap.Modal(paymentModalElement);
    const tngForm = document.getElementById('tngForm');
    const CardForm = document.getElementById('CardForm');

    payButton.addEventListener('click', () => {
        paymentModal.show();
    });

    tngForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const referenceId = document.getElementById('tngReferenceId').value;
        const receipt = document.getElementById('tngReceipt').files[0];

        if (referenceId && receipt) {
            const orderDetails = await collectOrderDetails();
            orderDetails.paymentMethod = 'TnG';
            orderDetails.paymentReferenceId = referenceId;
            orderDetails.receipt = receipt.name;

            try {
                await addDoc(collection(db, 'orders'), orderDetails);
                alert('Order submitted successfully');
                await clearUserCart(getCurrentUserId());
                await updateStock(orderDetails.cartItems); 
                await sendOrderConfirmationEmail(orderDetails);
                paymentModal.hide();
                window.location.href = "/html/orderhistory.html";
            } catch (error) {
                alert('Error submitting order:', error);
            }
        } else if (!referenceId || !receipt) {
            alert('Please fill out all required fields: reference id and receipt.');
        }
    });

    CardForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const cardName = document.getElementById('CardName').value;
        const cardNumber = document.getElementById('CardNumber').value;
        const expiryDate = document.getElementById('ExpiryDate').value;
        const cvv = document.getElementById('CVV').value;
        const referenceId = document.getElementById('CardReferenceId').value;
        const receipt = document.getElementById('CardReceipt').files[0];

        if (validateCardDetails(cardName, cardNumber, expiryDate, cvv, referenceId, receipt)) {
            const orderDetails = await collectOrderDetails();
            orderDetails.paymentMethod = 'Card';
            orderDetails.cardName = cardName;
            orderDetails.cardNumber = cardNumber;
            orderDetails.expiryDate = expiryDate;
            orderDetails.cvv = cvv;
            orderDetails.paymentReferenceId = referenceId;
            orderDetails.receipt = receipt.name;

            try {
                await addDoc(collection(db, 'orders'), orderDetails);
                alert('Order submitted successfully');
                await clearUserCart(getCurrentUserId());
                await updateStock(orderDetails.cartItems); 
                await sendOrderConfirmationEmail(orderDetails);
                paymentModal.hide();
                window.location.href = "/html/orderhistory.html";
            } catch (error) {
                alert('Error submitting order:', error);
            }
        }
    });

    function validateCardDetails(cardName, cardNumber, expiryDate, cvv, referenceId, receipt) {
        const namePattern = /^[A-Za-z\s]+$/;
        const numberPattern = /^\d{4}\s\d{4}\s\d{4}\s\d{4}$/;
        const cvvPattern = /^\d{3}$/;

        if (!cardName || !cardNumber || !expiryDate || !cvv || !referenceId || !receipt) {
            alert('Please fill out all required fields: card name, card number, expiry date, cvv, reference id, and receipt.');
            return false;
        }

        if (!namePattern.test(cardName)) {
            alert('Card name should contain only letters and spaces.');
            return false;
        }

        if (!numberPattern.test(cardNumber)) {
            alert('Card number should be in the format "xxxx xxxx xxxx xxxx".');
            return false;
        }

        if (!cvvPattern.test(cvv)) {
            alert('CVV should be exactly 3 digits.');
            return false;
        }

        if (!referenceId) {
            alert('Please enter the reference ID.');
            return false;
        }

        if (!receipt) {
            alert('Please upload the receipt.');
            return false;
        }

        return true;
    }

    async function calculatePoints(totalPrice) {
        const pointsPerRM = 1; 
        const wholeRM = Math.floor(totalPrice); 
        const points = wholeRM * pointsPerRM;
        return points;
    }

    async function updatePoints(points) {
        try {
            const user = auth.currentUser; 
            if (!user) {
                console.error("No user is currently logged in.");
                return;
            }

            const userEmail = user.email; 
            if (!userEmail) {
                console.error("User email is not available.");
                return;
            }

            const usersCollection = collection(db, 'users');
            const q = query(usersCollection, where("email", "==", userEmail));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDocRef = querySnapshot.docs[0].ref;
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    const existingPoints = Number(userData.points) || 0; 
                    const updatedPoints = existingPoints + Number(points); 

                    await updateDoc(userDocRef, { points: updatedPoints });
                    window.alert(`Points updated successfully. New points: ${updatedPoints}`);
                    console.log(`Points updated successfully. New points: ${updatedPoints}`);
                } else {
                    console.log('User document does not exist.');
                }
            } else {
                console.log('No user document found with the specified email.');
            }
        } catch (error) {
            console.error('Error updating points:', error);
        }
    }

    function generateTrackingNumber() {
        const prefix = "TRK";
        const randomNumber = Math.floor(100000 + Math.random() * 900000); 
        return `${prefix}${randomNumber}`;
    }

    async function collectOrderDetails() {
        const user = auth.currentUser;
        const userDetails = {
            name: document.getElementById('Name').value,
            email: document.getElementById('Email').value,
            contact: document.getElementById('Contact').value,
            address: document.getElementById('Address').value,
            state: document.getElementById('State').value,
            city: document.getElementById('City').value,
            postcode: document.getElementById('Postcode').value,
        };

        const userId = user ? user.uid : null;
        const cartItems = await getCartData(userId);

        const totalPrice = parseFloat(document.getElementById('Subtotal').textContent.replace(/[^0-9.]/g, ""));
        const promoCode = document.getElementById('Promocode').value;
        const discountAmount = parseFloat(document.getElementById('discount_amount').textContent.replace(/[^0-9.]/g, "")) || 0;
        const pointAmount = parseFloat(document.getElementById('point_amount').textContent.replace(/[^0-9.]/g, "")) || 0;
        const totalWeight = parseFloat(document.getElementById('Subweight').textContent.replace(/[^0-9.]/g, ""));
        const shippingFees = parseFloat(document.getElementById('ShippingFees').textContent.replace(/[^0-9.]/g, ""));
        const orderTotal = parseFloat(document.getElementById('OrderTotal').textContent.replace(/[^0-9.]/g, ""));
        const trackingNumber = generateTrackingNumber(); 
        
        const points = await calculatePoints(orderTotal);

        if (userId) {
            await updatePoints(points);
        }

        const orderID = await generateOrderID();

        return {
            orderID,
            userDetails,
            cartItems,
            totalPrice,
            promoCode,
            discountAmount,
            pointAmount,
            totalWeight,
            shippingFees,
            orderTotal,
            orderDate: new Date().toISOString(),
            trackingNumber,
            status: "Order Placed",
        };
    }

    // Function to generate order ID
    async function generateOrderID() {
        const orderCounterDocRef = doc(db, 'metadata', 'orderCounter');
        try {
            const orderCounterDoc = await getDoc(orderCounterDocRef);
            let newOrderID = 1;
            if (orderCounterDoc.exists()) {
                newOrderID = orderCounterDoc.data().lastOrderID + 1;
            }
            await setDoc(orderCounterDocRef, { lastOrderID: newOrderID });
            return newOrderID;
        } catch (e) {
            console.error('Failed to generate order ID: ', e);
            throw new Error('Failed to generate order ID');
        }
    }

    // Function to clear user cart after order submission
    async function clearUserCart(userId) {
        const cartRef = doc(db, 'carts', userId);
        try {
            await deleteDoc(cartRef);
            console.log('User cart cleared successfully.');
        } catch (error) {
            console.error('Error clearing user cart:', error);
        }
    }

    async function updateStock(cartItems) {
        const errors = [];
        for (const item of cartItems) {
            try {
                console.log('Updating stock for item:', item); 
                let category;
                let type;

                const imageUrlParts = item.image.split('/');
                if (imageUrlParts.length > 4) {
                    category = imageUrlParts[3];
                    type = imageUrlParts[4];
                } else {
                    const errorMessage = `Cannot determine category or type from image URL: ${item.image}`;
                    console.error(errorMessage);
                    errors.push(errorMessage);
                    continue; 
                }

                const productId = item.id; 

                if (!productId || !category || !type) {
                    const errorMessage = `Invalid product ID, category, or type for item: ${JSON.stringify(item)}`;
                    console.error(errorMessage);
                    errors.push(errorMessage);
                    continue; 
                }

                console.log(`Extracted category: ${category}`);
                console.log(`Extracted type: ${type}`);
                console.log(`Product ID: ${productId}`);

                const productRef = doc(db, `products/${category}/${type}/${productId}`);
                const productDoc = await getDoc(productRef);
                if (productDoc.exists()) {
                    const productData = productDoc.data();
                    if (typeof productData.product_stock !== 'number') {
                        const errorMessage = `Product stock field is not a number for product ${productId}`;
                        console.error(errorMessage);
                        errors.push(errorMessage);
                        continue;
                    }
                    console.log(`Current stock for product ${productId}: ${productData.product_stock}`);

                    const updatedStock = productData.product_stock - item.quantity;
                    await updateDoc(productRef, { product_stock: updatedStock });

                    const updatedProductDoc = await getDoc(productRef);
                    const updatedProductData = updatedProductDoc.data();
                    console.log(`Updated stock for product ${productId}: ${updatedProductData.product_stock}`);
                } else {
                    const errorMessage = `Product ${productId} not found in category ${category}, type ${type}`;
                    console.error(errorMessage);
                    errors.push(errorMessage);
                }
            } catch (error) {
                const errorMessage = `Error updating stock for product ${item.id}: ${error.message}`;
                console.error(errorMessage);
                errors.push(errorMessage);
            }
        }
        if (errors.length > 0) {
            alert(`Errors occurred while updating stock:\n${errors.join('\n')}`);
        }
    }

    paymentModalElement.addEventListener('hidden.bs.modal', () => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => backdrop.remove());
    });
});