import { getFirestore, doc, collection, getDocs, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
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
            console.log("User authenticated. User ID:", userId);
        } else {
            console.log("User is not authenticated.");
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

async function updateCartItemCount(userId) {
    try {
        if (userId) {
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
        }
    } catch (error) {
        console.error("Error updating cart item count:", error);
    }
}

async function addToCart(productId, productImage, productName, productPrice, productWeight, quantity, productStock) {
    try {
        const userId = getCurrentUserId();
        if (userId) {
            let productType = getProductType(productId); 
            
            const userCartDocRef = doc(collection(db, 'carts'), userId);
            const userCartDocSnap = await getDoc(userCartDocRef);

            let existingQuantity = 0;
            if (userCartDocSnap.exists()) {
                const cartItems = userCartDocSnap.data().cart || [];
                const existingProduct = cartItems.find(item => item.id === productId);
                if (existingProduct) {
                    existingQuantity = existingProduct.quantity;
                }
            }

            if (productStock === 0 || existingQuantity + quantity > productStock) {
                window.alert(`Insufficient stock for ${productName}.`);
                return;
            }

            let product = {
                id: productId,
                image: productImage, 
                name: productName,
                price: productPrice,
                type: productType, 
                weight: productWeight,
                quantity: existingQuantity + quantity, 
                totalPrice: (productPrice * (existingQuantity + quantity)).toFixed(2),
                totalWeight: productWeight * (existingQuantity + quantity)
            };

            await saveProductToFirestore(product, productName);

            await updateCartItemCount(userId);

            window.alert(`${productName} has been added to your cart!`);
            window.location.href = "/html/cart.html";
        } else {
            window.alert('Please login to add products to your cart.');
            window.location.href = "../html/login.html";
        }
    } catch (error) {
        console.error("Error adding product to cart:", error);
    }
}

// Function to determine the product type based on its ID
function getProductType(productId) {
    if (productId.includes("DF")) {
        return "Dry Food";
    } else if (productId.includes("WF")) {
        return "Wet Food";
    } else if (productId.includes("ES")) {
        return "Essentials";
    } else if (productId.includes("TO")) {
        return "Toys";
    } else if (productId.includes("TR")) {
        return "Treats";
    } else {
        return "Unknown";
    }
}

async function saveProductToFirestore(product, productName) {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            console.log("User ID not found. Cannot save cart data.");
            return;
        }

        const userCartDocRef = doc(collection(db, 'carts'), userId);
        const userCartDoc = await getDoc(userCartDocRef);
        let cart = userCartDoc.exists() ? userCartDoc.data().cart : [];

        const existingProductIndex = cart.findIndex(item => item.id === product.id);

        if (existingProductIndex !== -1) {
            cart[existingProductIndex].quantity++;
            cart[existingProductIndex].totalPrice = (cart[existingProductIndex].quantity * product.price).toFixed(2);
            cart[existingProductIndex].totalWeight = (cart[existingProductIndex].quantity * product.weight);
        } else {
            cart.push(product);
        }

        await setDoc(userCartDocRef, { cart: cart });
        console.log("Cart data saved to Firestore successfully!");

        const addToCartEvent = new CustomEvent('productAddedToCart', {
            detail: {
                productId: product.id,
                productName: productName
            }
        });
        window.dispatchEvent(addToCartEvent);
    } catch (error) {
        console.error("Error saving cart data to Firestore:", error);
        throw error;
    }
}

function createButton(text, onClickHandler) {
    const button = document.createElement('button');
    button.textContent = text;
    button.addEventListener('click', onClickHandler);
    button.classList.add('btn', 'btn-primary');
    return button;
}

// Function to fetch data and display it in the webpage based on food type
async function fetchDataAndDisplay() {
    try {
        const foodType = document.getElementById('food-type').value;
        const fishNaquaticssDocRef = doc(db, 'products', 'fish&aquatics');
        const subcollectionRef = collection(fishNaquaticssDocRef, foodType);
        const querySnapshot = await getDocs(subcollectionRef);

        let documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        documents.sort((a, b) => naturalSort(a.product_id, b.product_id));

        const productContainer = document.getElementById('product-container');
        productContainer.innerHTML = '';

        documents.forEach(foodData => {
            const productDiv = createProductDiv(foodData, foodType);
            productContainer.appendChild(productDiv);
        });
    } catch (error) {
        console.error('Error fetching documents: ', error);
    }
}

function naturalSort(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function createProductDiv(foodData, foodType) {
    const productDiv = document.createElement('div');
    productDiv.classList.add('product');

    // Image
    if (foodData.product_image) {
        const productImage = document.createElement('img');
        productImage.src = `/image/products/fish&aquatics/${foodType}/${foodData.product_image}`;
        productImage.alt = 'Product Image';
        productImage.classList.add('product-image','clickable');
        productImage.addEventListener('click', () => showModal(foodData, foodType));
        productDiv.appendChild(productImage);
    }

    // Name
    const productName = document.createElement('h5');
    productName.textContent = foodData.product_name;
    productName.style.height = '60px';
    productName.classList.add('clickable');
    productName.addEventListener('click', () => showModal(foodData, foodType));
    productDiv.appendChild(productName);

    const priceNquantity = document.createElement('div');
    priceNquantity.classList.add('price-quantity');

    // Price
    const productPrice = document.createElement('h5');
    productPrice.textContent = `RM ${foodData.product_price}`;
    priceNquantity.appendChild(productPrice);

    // Quantity Controls
    const quantityContainer = document.createElement('div');
    quantityContainer.classList.add('quantity-container', 'mb-3');

    // - Button
    const decrementButton = createButton('-', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            updateTotals(parseFloat(foodData.product_price), parseFloat(foodData.product_weight), quantityInput.value, totalPriceElement, totalWeightElement);
        }
    });
    decrementButton.classList.add('btn', 'btn-sm', 'btn-secondary');
    quantityContainer.appendChild(decrementButton);

    // Quantity Input
    const quantityInput = document.createElement('input');
    quantityInput.type = 'number';
    quantityInput.min = 1;
    quantityInput.value = 1;
    quantityInput.classList.add('quantity-input');
    quantityInput.addEventListener('input', () => {
        updateTotals(parseFloat(foodData.product_price), parseFloat(foodData.product_weight), quantityInput.value, totalPriceElement, totalWeightElement);
    });
    quantityContainer.appendChild(quantityInput);

    // + Button
    const incrementButton = createButton('+', () => {
        quantityInput.value = parseInt(quantityInput.value) + 1;
        updateTotals(parseFloat(foodData.product_price), parseFloat(foodData.product_weight), quantityInput.value, totalPriceElement, totalWeightElement);
    });
    incrementButton.classList.add('btn', 'btn-sm', 'btn-secondary');
    quantityContainer.appendChild(incrementButton);

    priceNquantity.appendChild(quantityContainer);
    productDiv.appendChild(priceNquantity);

    // Add to Cart Button
    const addToCartButton = createButton('ADD TO CART', () => {
        const quantity = parseInt(quantityInput.value);
        const productImage = `/image/products/fish&aquatics/${foodType}/${foodData.product_image}`;
        const productStock = parseInt(foodData.product_stock);
    
        addToCart(foodData.id, productImage, foodData.product_name, foodData.product_price, foodData.product_weight, quantity, productStock);
    });

    addToCartButton.classList.add('btn', 'btn-primary', 'add-cart');
    addToCartButton.style.width = '-webkit-fill-available';
    addToCartButton.style.marginTop = '8px';
    productDiv.appendChild(addToCartButton);

    return productDiv;
}

// Function to update total price and total weight based on quantity
function updateTotals(productPrice, productWeight, quantity, totalPriceElement, totalWeightElement) {
    const totalPrice = (productPrice * quantity).toFixed(2);
    const totalWeight = productWeight * quantity;
    totalPriceElement.textContent = `Total Price: RM ${totalPrice}`;
    totalWeightElement.textContent = `Total Weight: ${totalWeight}g`;
}

// Function to show product details in a modal
function showModal(foodData, foodType) {
    const modalBody = document.getElementById('modal-body-content');
    modalBody.innerHTML = '';

    // Image
    if (foodData.product_image) {
        const productImage = document.createElement('img');
        productImage.src = `/image/products/fish&aquatics/${foodType}/${foodData.product_image}`;
        productImage.alt = 'Product Image';
        productImage.classList.add('product-image');
        modalBody.appendChild(productImage);
    }

    // Name
    const productName = document.createElement('h4');
    productName.textContent = foodData.product_name;
    modalBody.appendChild(productName);

    // Description
    const productDescription = document.createElement('p');
    productDescription.textContent = foodData.product_description;
    modalBody.appendChild(productDescription);

    // Price
    const productPrice = document.createElement('h5');
    productPrice.textContent = `RM ${foodData.product_price}`;
    modalBody.appendChild(productPrice);

    // Quantity Controls
    const quantityContainer = document.createElement('div');
    quantityContainer.classList.add('quantity-container', 'd-flex', 'justify-content-center', 'align-items-center', 'mb-3');

    // - Button
    const decrementButton = createButton('-', () => {
        const currentValue = parseInt(quantityInput.value);
        if (currentValue > 1) {
            quantityInput.value = currentValue - 1;
            updateTotals(parseFloat(foodData.product_price), parseFloat(foodData.product_weight), quantityInput.value, totalPriceElement, totalWeightElement);
        }
    });
    decrementButton.classList.add('btn', 'btn-sm', 'btn-secondary', 'mr-2');
    quantityContainer.appendChild(decrementButton);

    // Quantity Input
    const quantityInput = document.createElement('input');
    quantityInput.type = 'text';
    quantityInput.min = 1;
    quantityInput.value = 1;
    quantityInput.classList.add('quantity-input');
    quantityInput.addEventListener('input', () => {
        updateTotals(parseFloat(foodData.product_price), parseFloat(foodData.product_weight), quantityInput.value, totalPriceElement, totalWeightElement);
    });
    quantityContainer.appendChild(quantityInput);

    // + Button
    const incrementButton = createButton('+', () => {
        quantityInput.value = parseInt(quantityInput.value) + 1;
        updateTotals(parseFloat(foodData.product_price), parseFloat(foodData.product_weight), quantityInput.value, totalPriceElement, totalWeightElement);
    });
    incrementButton.classList.add('btn', 'btn-sm', 'btn-secondary', 'ml-2');
    quantityContainer.appendChild(incrementButton);

    modalBody.appendChild(quantityContainer);

    // Add to Cart Button
    const addToCartButton = createButton('ADD TO CART', () => {
        const quantity = parseInt(quantityInput.value);
        const productImage = `/image/products/fish&aquatics/${foodType}/${foodData.product_image}`;
        const productStock = parseInt(foodData.product_stock);
    
        addToCart(foodData.id, productImage, foodData.product_name, foodData.product_price, foodData.product_weight, quantity, productStock);
    });

    addToCartButton.classList.add('btn', 'btn-primary', 'add-cart');
    addToCartButton.style.width = '-webkit-fill-available';
    addToCartButton.style.marginTop = '8px';
    modalBody.appendChild(addToCartButton);

    $('#productModal').modal('show');
}

document.getElementById('food-type').addEventListener('change', fetchDataAndDisplay);

document.addEventListener('DOMContentLoaded', function() {
    fetchDataAndDisplay();
});