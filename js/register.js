import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();

document.getElementById('signUpButton').addEventListener('click', async () => {
    event.preventDefault();
    try {
        const name = document.getElementById('Name').value.trim();
        const email = document.getElementById('Email').value.trim();
        const password = document.getElementById('Password').value.trim();
        const contact = document.getElementById('Contact').value.trim();
        const address = document.getElementById('Address').value.trim();
        const state = document.getElementById('State').value.trim();
        const city = document.getElementById('City').value.trim();
        const post = document.getElementById('Postcode').value.trim();
        const checkbox = document.getElementById('checkbox');


        // Check if any field is empty
        if (!name || !email || !password || !contact || !address || !state || !city || !post) {
            window.alert("Please fill in all the details.");
            return;
        }

        const uppercase = /[A-Z]/;
        const lowercase = /[a-z]/;

        if (password.length < 8 || !uppercase.test(password) || !lowercase.test(password)) {
            window.alert("Password must be at least 8 characters long and contain at least one uppercase and one lowercase character");
            return; 
        }

        if (!checkbox.checked) {
            window.alert('You must agree to the Privacy Policy & T&C.');
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        const userId = userCredential.user.uid;

        const docRef = await addDoc(collection(db, 'users'), {
            userId: userId,
            name: name,
            email: email,
            contact: contact,
            address: address,
            state: state,
            city: city,
            post: post
        });

        window.location.href = "../html/home.html";

        console.log('User created with email: ', userCredential.user.email);
        console.log('Document written with ID (used as user ID): ', docRef.id);
    } catch (error) {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.error('Error adding document: ', errorCode, errorMessage);
        switch (errorCode) {
            case 'auth/wrong-password':
                window.alert("Invalid password. Please try again.");
                break;
            case 'auth/user-not-found':
                window.alert("No user found with this email. Please sign up.");
                break;
            case 'auth/invalid-email':
                window.alert("Invalid email format. Please check your email.");
                break;
            case 'auth/email-already-in-use':
                window.alert("The email address is already in use by another account.");
                break;
            default:
                window.alert("Error: " + errorMessage);
        }
    }
});
