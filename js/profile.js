import { getFirestore, collection, getDocs, getDoc, query, where, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {

    const db = getFirestore();
    const auth = getAuth();

    let timeout;
    const TIMEOUT_DURATION = 30 * 60 * 1000; 

    // Generate a session ID (UUID) for a new session
    function generateSessionID() {
        const array = new Uint8Array(16); 
        window.crypto.getRandomValues(array);
        return [...array].map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    // Set a session cookie
    function setSessionCookie(sessionID) {
        document.cookie = `sessionID=${sessionID}; path=/; max-age=${TIMEOUT_DURATION / 1000}`;
    }

    // Get session ID from cookies
    function getSessionCookie() {
        const cookies = document.cookie.split('; ');
        const sessionCookie = cookies.find(cookie => cookie.startsWith('sessionID='));
        return sessionCookie ? sessionCookie.split('=')[1] : null;
    }

    // Clear the session cookie
    function clearSessionCookie() {
        document.cookie = `sessionID=; path=/; max-age=0`;
    }

    // Function to start session timeout
    function startSessionTimeout() {
        resetTimeout(); 
        window.addEventListener('mousemove', resetTimeout); 
        window.addEventListener('keydown', resetTimeout);   
        window.addEventListener('click', resetTimeout);     
    }

    // Function to stop session timeout
    function stopSessionTimeout() {
        clearTimeout(timeout); 
        window.removeEventListener('mousemove', resetTimeout);
        window.removeEventListener('keydown', resetTimeout);
        window.removeEventListener('click', resetTimeout);
    }

    // Function to reset the timeout and show the alert
    function resetTimeout() {
        clearTimeout(timeout); 
        timeout = setTimeout(() => {
            window.alert("The session has expired.");
            clearSessionCookie();
            window.location.href = "../html/login.html"; 
        }, TIMEOUT_DURATION); 
    }

    function getCurrentUserId() {
        const user = auth.currentUser;
        return user ? user.uid : null;
    }

    // Function to fetch and display personal details
    async function fetchAndDisplayPersonalDetails(userId) {
        try {
            const q = query(collection(db, 'users'), where('userId', '==', userId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    const userData = doc.data();
                    console.log('User data fetched:', userData);

                    document.getElementById('Name').value = userData.name || '';
                    document.getElementById('Email').value = userData.email || '';
                    document.getElementById('Contact').value = userData.contact || '';
                    document.getElementById('Points').value = userData.points !== undefined ? userData.points : '';
                    document.getElementById('Address').value = userData.address || '';
                    document.getElementById('State').value = userData.state || '';
                    document.getElementById('City').value = userData.city || '';
                    document.getElementById('Postcode').value = userData.post || '';

                });
            } else {
                console.log('User details document does not exist.');
            }
        } catch (error) {
            console.error('Error fetching user details:', error);
        }
    }

    onAuthStateChanged(auth, (user) => {
        if (user) {
            const userId = getCurrentUserId();  
            fetchAndDisplayPersonalDetails(userId);

            let sessionID = getSessionCookie();
            if (!sessionID) {
                sessionID = generateSessionID();
                setSessionCookie(sessionID);
            }
            startSessionTimeout(); 
            updateCartItemCount(userId);

        } else {
            stopSessionTimeout(); 
            clearSessionCookie();
            console.log('No user is authenticated. Redirecting to login page.');
            window.location.href = "/html/login.html";
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

    // Function to update the cart item count in the UI
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

    function validateProfileDetails() {
        const name = document.getElementById('Name').value;
        const email = document.getElementById('Email').value;
        const contact = document.getElementById('Contact').value;
        const address = document.getElementById('Address').value;
        const state = document.getElementById('State').value;
        const city = document.getElementById('City').value;
        const postcode = document.getElementById('Postcode').value;

        const namePattern = /^[A-Za-z\s]+$/;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const contactPattern = /^\d{10,11}$/;
        const postcodePattern = /^\d{5}$/;

        if (!name || !email || !contact || !address || !state || !city || !postcode) {
            alert('Please fill out all required fields: name, email, contact, address, state, city and postcode.');
            return false;
        }

        if (!namePattern.test(name)) {
            alert('Name should contain only letters and spaces.');
            return false;
        }

        if (!emailPattern.test(email)) {
            alert('Please enter a valid email address.');
            return false;
        }

        if (!contactPattern.test(contact)) {
            alert('Please enter a valid 10 or 11-digit contact number.');
            return false;
        }

        if (!postcodePattern.test(postcode)) {
            alert('Please enter a valid 5-digit postcode.');
            return false;
        }

        return true;
    }

    async function saveEditedDetails(email) {
        if (!validateProfileDetails()) {
            return;
        }

        try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach(async (docSnapshot) => {
                    const docRef = doc(db, 'users', docSnapshot.id);

                    const updatedData = {
                        name: document.getElementById('Name').value,
                        email: document.getElementById('Email').value,
                        contact: document.getElementById('Contact').value,
                        points: document.getElementById('Points').value,
                        address: document.getElementById('Address').value,
                        state: document.getElementById('State').value,
                        city: document.getElementById('City').value,
                        post: document.getElementById('Postcode').value,

                    };

                    await updateDoc(docRef, updatedData);
                    alert('User details updated successfully.');
                });
            } else {
                alert('User details document does not exist.');
            }
        } catch (error) {
            console.error('Error updating user details:', error);
        }
    }

    const saveBtn = document.getElementById('save');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const userEmail = sessionStorage.getItem('userEmail');
            if (userEmail) {
                saveEditedDetails(userEmail);
            } else {
                console.log('No user email found in session storage.');
            }
        });
    }

    resetTimeout();

});