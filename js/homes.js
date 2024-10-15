import { getFirestore, collection, getDocs, getDoc, setDoc, doc, query, limit } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
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

async function addToCart(productId, productImages, productName, productPrice, productType, productStock, productWeight) {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            window.alert(`Please login to add products to your cart.`);
            window.location.href = "/html/login.html";
            return;
        }

        const userCartDocRef = doc(collection(db, 'carts'), userId);
        const userCartDocSnap = await getDoc(userCartDocRef);
        let totalQuantity = 0;

        if (userCartDocSnap.exists()) {
            const cartItems = userCartDocSnap.data().cart || [];
            const existingProduct = cartItems.find(item => item.id === productId);
            totalQuantity = existingProduct ? existingProduct.quantity : 0;
        }

        if (productStock === 0 || totalQuantity + 1 > productStock) {
            window.alert(`Insufficient stock for ${productName}.`);
            return;
        }

        let product = {
            id: productId,
            image: productImages,
            name: productName,
            price: productPrice,
            type: productType,
            quantity: 1,
            totalPrice: parseFloat(productPrice).toFixed(2),
            weight:productWeight
        };

        await saveProductToFirestore(product, productName);
        await updateCartItemCount(userId);

        window.alert(`${productName} has been added to your cart!`);
        window.location.href = "/html/cart.html";
    } catch (error) {
        console.error("Error adding product to cart:", error);
        window.alert(`An error occurred while adding the product to your cart. Please try again.`);
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

// Function to fetch data and display it
async function fetchDataAndDisplay() {
    try {
        const catDocRef = doc(collection(db, 'products'), 'cat');
        const dogDocRef = doc(collection(db, 'products'), 'dog');
        const birdDocRef = doc(collection(db, 'products'), 'birds');
        const fishDocRef = doc(collection(db, 'products'), 'fish&aquatics');
        const hamsterDocRef = doc(collection(db, 'products'), 'hamster&rabbits');

        //CAT
        const catDryFoodCollectionRef = collection(catDocRef, 'dry food');
        const catWetFoodCollectionRef = collection(catDocRef, 'wet food');
        const catToyFoodCollectionRef = collection(catDocRef, 'toys');
        const catTreatFoodCollectionRef = collection(catDocRef, 'essentials');
        const catEssentialFoodCollectionRef = collection(catDocRef, 'treats');
        //DOG
        const dogDryFoodCollectionRef = collection(dogDocRef, 'dry food');
        const dogWetFoodCollectionRef = collection(dogDocRef, 'wet food');
        const dogToyFoodCollectionRef = collection(dogDocRef, 'toys');
        const dogTreatFoodCollectionRef = collection(dogDocRef, 'treats');
        const dogEssentialFoodCollectionRef = collection(dogDocRef, 'essentials');
        //Bird
        const birdDryFoodCollectionRef = collection(birdDocRef, 'dry food');
        const birdToyFoodCollectionRef = collection(birdDocRef, 'toys');
        const birdTreatFoodCollectionRef = collection(birdDocRef, 'treats');
        const birdEssentialFoodCollectionRef = collection(birdDocRef, 'essentials');
        //Fish
        const fishDryFoodCollectionRef = collection(fishDocRef, 'dry food');
        const fishEssentialFoodCollectionRef = collection(fishDocRef, 'essentials');
        //Hamster
        const hamsterDryFoodCollectionRef = collection(hamsterDocRef, 'dry food');
        const hamsterEssentialFoodCollectionRef = collection(hamsterDocRef, 'essentials');

        const limitCount = 2;

        //cat
        const catDryQuerySnapshot = await getDocs(query(catDryFoodCollectionRef, limit(limitCount)));
        const catWetQuerySnapshot = await getDocs(query(catWetFoodCollectionRef, limit(limitCount)));
        const catToyQuerySnapshot = await getDocs(query(catToyFoodCollectionRef, limit(limitCount)));
        const catTreatQuerySnapshot = await getDocs(query(catTreatFoodCollectionRef, limit(limitCount)));
        const catEssentialQuerySnapshot = await getDocs(query(catEssentialFoodCollectionRef, limit(limitCount)));
        //dog
        const dogDryQuerySnapshot = await getDocs(query(dogDryFoodCollectionRef, limit(limitCount)));
        const dogWetQuerySnapshot = await getDocs(query(dogWetFoodCollectionRef, limit(limitCount)));
        const dogToyQuerySnapshot = await getDocs(query(dogToyFoodCollectionRef, limit(limitCount)));
        const dogTreatQuerySnapshot = await getDocs(query(dogTreatFoodCollectionRef, limit(limitCount)));
        const dogEssentialQuerySnapshot = await getDocs(query(dogEssentialFoodCollectionRef, limit(limitCount)));
        //bird
        const birdDryQuerySnapshot = await getDocs(query(birdDryFoodCollectionRef, limit(limitCount)));
        const birdToyQuerySnapshot = await getDocs(query(birdToyFoodCollectionRef, limit(limitCount)));
        const birdTreatQuerySnapshot = await getDocs(query(birdTreatFoodCollectionRef, limit(limitCount)));
        const birdEssentialQuerySnapshot = await getDocs(query(birdEssentialFoodCollectionRef, limit(limitCount)));
        //fish
        const fishDryQuerySnapshot = await getDocs(query(fishDryFoodCollectionRef, limit(limitCount)));
        const fishEssentialQuerySnapshot = await getDocs(query(fishEssentialFoodCollectionRef, limit(limitCount)));
        //Hamster
        const hamsterDryQuerySnapshot = await getDocs(query(hamsterDryFoodCollectionRef, limit(limitCount)));
        const hamsterEssentialQuerySnapshot = await getDocs(query(hamsterEssentialFoodCollectionRef, limit(limitCount)));

        const combinedQuerySnapshot = catDryQuerySnapshot.docs
            .concat(catWetQuerySnapshot.docs)
            .concat(catToyQuerySnapshot.docs)
            .concat(catTreatQuerySnapshot.docs)
            .concat(catEssentialQuerySnapshot.docs)
            //dog
            .concat(dogDryQuerySnapshot.docs)
            .concat(dogWetQuerySnapshot.docs)
            .concat(dogToyQuerySnapshot.docs)
            .concat(dogTreatQuerySnapshot.docs)
            .concat(dogEssentialQuerySnapshot.docs)
            //bird
            .concat(birdDryQuerySnapshot.docs)
            .concat(birdToyQuerySnapshot.docs)
            .concat(birdTreatQuerySnapshot.docs)
            .concat(birdEssentialQuerySnapshot.docs)
            //fish
            .concat(fishDryQuerySnapshot.docs)
            .concat(fishEssentialQuerySnapshot.docs)
            //hamster
            .concat(hamsterDryQuerySnapshot.docs)
            .concat(hamsterEssentialQuerySnapshot.docs);


        const owlCarousel = document.getElementById('owl-demo');
        owlCarousel.innerHTML = '';

        combinedQuerySnapshot.forEach(doc => {
            const foodType = doc.ref.parent.parent.id;
            const productType = doc.ref.parent.id;
            const productImage = doc.data().product_image;
        
            const imageUrl = `/image/products/${foodType}/${productType}/${productImage}`;
        
            const productHTML = `
                <div class="card">
                    <span class="product-id" style="display: none;">${doc.data().product_id}</span>
                    <img class="card-img-top" src="${imageUrl}" alt="${doc.data().product_name}">
                    <div class="card-body">
                        <h5 class="card-title">${doc.data().product_name}</h5>
                        <p class="card-desc" style="height:25px">${doc.data().product_description}</p>
                        <p class="card-text"><small class="text-muted">Available Stock: ${doc.data().product_stock}</small></p>
                        <p class="product-price pt-3">Price: RM${doc.data().product_price}</p>
                        <span class="product-weight" style="display: none;">${doc.data().product_weight}</span>
                        <a href="" class="btn btn-primary add-cart">Add To Cart</a>
                    </div>
                </div>
            `;
            owlCarousel.innerHTML += productHTML;
        });
        
        $(owlCarousel).owlCarousel({
            loop: true,
            margin: 10,
            responsiveClass: true,
            responsive: {
                0: {
                    items: 1,
                    nav: true
                },
                600: {
                    items: 3,
                    nav: false
                },
                1000: {
                    items: 5,
                    nav: true,
                    loop: false
                }
            },
            autoplay: true,
            autoplayTimeout: 3000,
            autoplayHoverPause: true
        });
        
        const addToCartButtons = document.querySelectorAll('.btn.btn-primary');
        addToCartButtons.forEach(button => {
            button.addEventListener('click', async function (event) {
                event.preventDefault();
                const item = this.closest('.card');
                const productId = item.querySelector('.product-id').textContent;
                const productImageElement = item.querySelector('.card-img-top');
                const productImages = productImageElement.getAttribute('src');
                const productName = item.querySelector('h5').textContent;
                const productPriceText = item.querySelector('.product-price').textContent;
                const productPrice = parseFloat(productPriceText.split(':')[1].trim().replace('RM', ''));
                const productStockText = item.querySelector('.text-muted').textContent.split(':')[1].trim();
                const productStock = parseInt(productStockText);
                const productWeight = item.querySelector('.product-weight').textContent;
        
                let productType = "";
                if (productId.includes("DF")) {
                    productType = "Dry Food";
                } else if (productId.includes("WF")) {
                    productType = "Wet Food";
                } else if (productId.includes("ES")) {
                    productType = "Essentials";
                } else if (productId.includes("TO")) {
                    productType = "Toys";
                } else if (productId.includes("TR")) {
                    productType = "Treats";
                } else {
                    productType = "Unknown";
                }
        
                await addToCart(productId, productImages, productName, productPrice, productType, productStock, productWeight);
            });
        });     

    } catch (error) {
        console.error("Error fetching and displaying data:", error);
    }
}

fetchDataAndDisplay();

var slideIndex = 0;
var slides = document.getElementsByClassName("mySlides");
var dots = document.getElementsByClassName("dot");
var slideInterval = 10000; 

function showSlide(n) {
    for (var i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }

    for (var i = 0; i < dots.length; i++) {
        dots[i].classList.remove("active");
    }

    slides[n].style.display = "block";
    dots[n].classList.add("active");
}

function prevSlide() {
    slideIndex--;
    if (slideIndex < 0) {
        slideIndex = slides.length - 1;
    }
    showSlide(slideIndex);
}

function nextSlide() {
    slideIndex++;
    if (slideIndex >= slides.length) {
        slideIndex = 0;
    }
    showSlide(slideIndex);
}

function autoSlide() {
    nextSlide();
    setTimeout(autoSlide, slideInterval);
}

document.querySelector(".carousel-control-prev").addEventListener("click", prevSlide);

document.querySelector(".carousel-control-next").addEventListener("click", nextSlide);

for (var i = 0; i < dots.length; i++) {
    dots[i].addEventListener("click", function () {
        var slideIndex = parseInt(this.getAttribute("data-slide-to"));
        showSlide(slideIndex);
    });
}

showSlide(slideIndex);

setTimeout(autoSlide, slideInterval);

