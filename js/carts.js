import { getFirestore, collection, getDoc, getDocs, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth(); 

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
            await displayLimitedStockMessage(userId);
            console.log("User authenticated. User ID:", userId);
        } else {
        }
    } catch (error) {
        console.error("Error in authentication state change:", error);
    }
});

// Function to fetch cart data for a user
async function getCartData(user) {
    try {
        if (user) {
            const userId = getCurrentUserId();
            if (!userId) {
                console.error("Invalid userId:", userId);
                return [];
            }

            const cartRef = doc(collection(db, 'carts'), userId); 
            const cartDoc = await getDoc(cartRef);
            if (cartDoc.exists()) {
                return cartDoc.data().cart || []; 
            } else {
                console.log("Cart document does not exist for the current user.");

            } return [];
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
            <th>Type</th>
            <th>Total Price</th>
            <th>Action</th>
        </tr>
    </thead>
    <tbody></tbody>
`;
const cartTableBody = cartTable.querySelector('tbody');
const cartContainer = document.getElementById('cartItems');

async function displayCartItems() {
    const userId = getCurrentUserId();
    let cartItems = await getCartData(userId); 
    if (!cartItems) {
        cartItems = [];
    }

    cartTableBody.innerHTML = '';

    // Check if the cart is empty
    if (cartItems == 0) {
        const noSection = document.getElementById('none');
        noSection.style.display = 'block';

        const headSection = document.getElementById('cartItems');
        headSection.style.display = 'none';

        const totalSection = document.getElementById('total');
        totalSection.style.display = 'none';
    } else {
        const noSection = document.getElementById('none');
        noSection.style.display = 'none';

        const totalSection = document.getElementById('total');
        totalSection.style.display = 'block';

        const headSection = document.getElementById('cartItems');
        headSection.style.display = 'block';
    }


    let totalPrice = 0;

    cartItems.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
        <td>${index + 1}</td>
        <td><img src="${item.image}" alt="Product Image" style="width: 100px;"></td>
        <td>${item.name}</td>
        <td>
            <button class="btn btn-sm btn-secondary decrease" data-product-name="${item.name}">-</button>
            <input type="text" min="1" value="${item.quantity}" class="quantity">
            <button class="btn btn-sm btn-secondary increase" data-product-name="${item.name}">+</button>
        </td>
        <td>${item.price}</td> 
        <td>${item.type}</td>
        <td class="total-price-cell"></td>
        <td><button class="btn btn-danger delete" data-product-name="${item.name}">Delete</button></td>
    `;
        cartTableBody.appendChild(row);

        calculateTotalPrice(item).then(itemTotalPrice => {
            const totalPriceCell = row.querySelector('.total-price-cell');
            totalPriceCell.textContent = `RM ${itemTotalPrice.toFixed(2)}`;

            totalPrice += itemTotalPrice;

            updateSubtotal(totalPrice);
        });
    });


    cartContainer.innerHTML = '';
    cartContainer.appendChild(cartTable);

    const quantityInputs = document.querySelectorAll('.quantity');
    quantityInputs.forEach(input => {
        input.addEventListener('change', updateCartItemQuantity);
    });

    const increaseButtons = document.querySelectorAll('.increase');
    increaseButtons.forEach(button => {
        button.addEventListener('click', incrementQuantity);
    });

    const decreaseButtons = document.querySelectorAll('.decrease');
    decreaseButtons.forEach(button => {
        button.addEventListener('click', decrementQuantity);
    });

    const deleteButtons = document.querySelectorAll('.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', deleteCartItem);
    });

}

async function displayLimitedStockMessage(userId) {
    try {
        const cartItems = await getCartData(userId);

        // Check if cartItems is defined and not empty
        if (!cartItems || cartItems.length === 0) {
            console.log("Cart is empty or undefined.");
            return; 
        }

        const productStocks = await getProductStock();

        for (const cartItem of cartItems) {
            const productStock = productStocks.find(stock => stock.productName === cartItem.name);

            const availableStock = productStock.productStock - productStock.userAddedQuantity;

            // Check if the available stock is less than the quantity in the cart
            if (availableStock < cartItem.quantity) {
                if (availableStock === 0) {
                    await deleteItemFromFirestore(userId, cartItem.name);
                    window.alert(`${cartItem.name} removed from cart due to ${availableStock} stock are left.`);
                    location.reload();
                } else {
                    await updateQuantityAndPrice(userId, cartItem.name, availableStock, availableStock);
                    const message = `Stock for ${cartItem.name} for now only ${availableStock} are left.`;
                    window.alert(message);
                    location.reload();
                }
            }
        }
    } catch (error) {
        console.error("Error displaying limited stock message:", error);
    }
}


async function incrementQuantity(event) {
    event.preventDefault();

    const productName = this.getAttribute('data-product-name');
    const input = this.parentElement.querySelector('.quantity');
    let currentQuantity = parseInt(input.value);
    let newQuantity = currentQuantity + 1;

    const productStocks = await getProductStock();
    const productStock = productStocks.find(product => product.productName === productName);

    if (!productStock) {
        console.error(`Product stock not found for ${productName}.`);
        return;
    }

    const availableStock = productStock.productStock - productStock.userAddedQuantity;

    if (newQuantity > availableStock) {
        const message = `Only ${availableStock} items in stock for ${productName}.`;
        window.alert(message);
        newQuantity = availableStock;
    }

    input.value = newQuantity;

    await updateQuantityAndPrice(getCurrentUserId(), productName, newQuantity);

    updateCartItemCount(getCurrentUserId());
}

async function getProductStock() {
    try {
        //cat
        const catDryFoodRef = collection(db, 'products', 'cat', 'dry food');
        const catWetFoodRef = collection(db, 'products', 'cat', 'wet food');
        const catToyFoodRef = collection(db, 'products', 'cat', 'toys');
        const catEssFoodRef = collection(db, 'products', 'cat', 'essentials');
        const catTreatFoodRef = collection(db, 'products', 'cat', 'treats');

        //dog
        const dogDryFoodRef = collection(db, 'products', 'dog', 'dry food');
        const dogWetFoodRef = collection(db, 'products', 'dog', 'wet food');
        const dogToyFoodRef = collection(db, 'products', 'dog', 'toys');
        const dogEssFoodRef = collection(db, 'products', 'dog', 'essentials');
        const dogTreatFoodRef = collection(db, 'products', 'dog', 'treats');

        //bird
        const birdDryFoodRef = collection(db, 'products', 'birds', 'dry food');
        const birdToyFoodRef = collection(db, 'products', 'birds', 'toys');
        const birdEssFoodRef = collection(db, 'products', 'birds', 'essentials');
        const birdTreatFoodRef = collection(db, 'products', 'birds', 'treats');

        // fish & aquatics
        const fishDryFoodRef = collection(db, 'products', 'fish&aquatics', 'dry food');
        const fishEssFoodRef = collection(db, 'products', 'fish&aquatics', 'essentials');

        //hamster & rabbits
        const hamsterDryFoodRef = collection(db, 'products', 'hamster&rabbits', 'dry food');
        const hamsterToyFoodRef = collection(db, 'products', 'hamster&rabbits', 'toys');
        const hamsterEssFoodRef = collection(db, 'products', 'hamster&rabbits', 'essentials');
        const hamsterTreatFoodRef = collection(db, 'products', 'hamster&rabbits', 'treats');

        //cat
        const [catDryFoodSnap, catWetFoodSnap, catToyFoodSnap, catEssFoodSnap, catTreatFoodSnap] = await Promise.all([
            getDocs(catDryFoodRef),
            getDocs(catWetFoodRef),
            getDocs(catToyFoodRef),
            getDocs(catEssFoodRef),
            getDocs(catTreatFoodRef)
        ]);

        //dog
        const [dogDryFoodSnap, dogWetFoodSnap, dogToyFoodSnap, dogEssFoodSnap, dogTreatFoodSnap] = await Promise.all([
            getDocs(dogDryFoodRef),
            getDocs(dogWetFoodRef),
            getDocs(dogToyFoodRef),
            getDocs(dogEssFoodRef),
            getDocs(dogTreatFoodRef)
        ]);

        //bird
        const [birdDryFoodSnap, birdToyFoodSnap, birdEssFoodSnap, birdTreatFoodSnap] = await Promise.all([
            getDocs(birdDryFoodRef),
            getDocs(birdToyFoodRef),
            getDocs(birdEssFoodRef),
            getDocs(birdTreatFoodRef)
        ]);

        //fish & Aquatics
        const [fishDryFoodSnap, fishEssFoodSnap] = await Promise.all([
            getDocs(fishDryFoodRef),
            getDocs(fishEssFoodRef)
        ]);

        //hamster & rabbits
        const [hamsterDryFoodSnap, hamsterToyFoodSnap, hamsterEssFoodSnap, hamsterTreatFoodSnap] = await Promise.all([
            getDocs(hamsterDryFoodRef),
            getDocs(hamsterToyFoodRef),
            getDocs(hamsterEssFoodRef),
            getDocs(hamsterTreatFoodRef)
        ]);

        const productStocks = [];

        //cat
        catDryFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        catWetFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        catToyFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        catEssFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        catTreatFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        //dog
        dogDryFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        dogWetFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        dogToyFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        dogEssFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        dogTreatFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        //bird
        birdDryFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        birdToyFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        birdEssFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        birdTreatFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        //fish & Aquatics
        fishDryFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        fishEssFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        //hamster & rabbits
        hamsterDryFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        hamsterToyFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        hamsterEssFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        hamsterTreatFoodSnap.forEach(doc => {
            const productData = doc.data();
            const productName = productData.product_name;
            const productStock = productData.product_stock || 0;
            const userAddedQuantity = productData.user_added_quantity || 0;
            productStocks.push({ productName, productStock, userAddedQuantity, category: 'cat' });
        });

        return productStocks;
    } catch (error) {
        console.error("Error fetching product stocks from Firestore:", error);
        return [];
    }
}


async function decrementQuantity(event) {
    event.preventDefault(); 

    const productName = this.getAttribute('data-product-name');
    const input = this.parentElement.querySelector('.quantity');
    let newQuantity = parseInt(input.value) - 1;
    if (newQuantity < 1) {
        newQuantity = 1;
    }
    input.value = newQuantity;

    const userId = getCurrentUserId();
    await updateQuantityAndPrice(userId, productName, newQuantity);
    updateCartItemCount(userId);
}

document.querySelectorAll('.increase').forEach(button => {
    button.addEventListener('click', incrementQuantity);
});

document.querySelectorAll('.decrease').forEach(button => {
    button.addEventListener('click', decrementQuantity);
});


async function updateCartItemCount(userId) {
    try {
        const userCartDocRef = doc(collection(db, 'carts'), userId);
        const userCartDocSnap = await getDoc(userCartDocRef);
        if (userCartDocSnap.exists()) {
            const cartItems = userCartDocSnap.data().cart || [];
            const cartItemCount = document.getElementById('cartItemCount');
            const totalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
            cartItemCount.textContent = totalCount;
        }
    } catch (error) {
        console.error("Error updating cart item count:", error);
    }
}

async function updateCartItemQuantity() {
    const productName = this.parentElement.previousElementSibling.previousElementSibling.previousElementSibling.textContent;
    const newQuantity = parseInt(this.value);
    const userId = getCurrentUserId();
    await updateQuantityAndPrice(userId, productName, newQuantity);
    updateCartItemCount(userId);
}

async function updateQuantityAndPrice(userId, productName, newQuantity, availableStock) {
    try {
        const cartRef = collection(db, 'carts');
        const userCartDocRef = doc(cartRef, userId);
        const cartSnapshot = await getDoc(userCartDocRef);
        if (cartSnapshot.exists()) {
            const cartData = cartSnapshot.data();
            const updatedCart = await Promise.all(cartData.cart.map(async item => {
                if (item.name === productName) {
                    item.quantity = newQuantity > availableStock ? availableStock : newQuantity;
                    item.totalPrice = `RM ${(await calculateTotalPrice(item))}`;
                }
                return item;
            }));
            await setDoc(userCartDocRef, { cart: updatedCart });
            console.log(`${productName} quantity and price updated in Firestore successfully!`);
            displayCartItems();
        } else {
            console.log(`User's cart document does not exist.`);
        }
    } catch (error) {
        console.error("Error updating item quantity and price in Firestore:", error);
    }
}

async function deleteCartItem() {
    const productName = this.getAttribute('data-product-name');
    const userId = getCurrentUserId();
    await deleteItemFromFirestore(userId, productName);
    alert(`${productName} has been deleted successfully!`);
    updateCartItemCount(userId);
}

async function deleteItemFromFirestore(userId, productName) {
    try {
        const cartRef = collection(db, 'carts');
        const userCartDocRef = doc(cartRef, userId);
        const cartSnapshot = await getDoc(userCartDocRef);
        if (cartSnapshot.exists()) {
            const cartData = cartSnapshot.data();
            const updatedCart = cartData.cart.filter(item => item.name !== productName);
            await setDoc(userCartDocRef, { cart: updatedCart });
            console.log(`${productName} removed from Firestore successfully!`);
            displayCartItems();
        } else {
            console.log(`User's cart document does not exist.`);
        }
    } catch (error) {
        console.error("Error deleting item from Firestore:", error);
    }
}

async function calculateTotalPrice(item) {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return price * quantity;
}

async function updateSubtotal(totalPrice) {
    const formattedTotalPrice = totalPrice.toFixed(2);
    const TotalPriceDisplay = document.getElementById('Subtotal');
    TotalPriceDisplay.textContent = `Subtotal: RM ${formattedTotalPrice}`;
}

displayCartItems();
