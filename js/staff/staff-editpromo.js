import { getFirestore, doc, getDoc, updateDoc, collection, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// Function to get query parameter by name
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Function to fetch and display promo details
async function fetchAndDisplayPromoDetails() {
    try {
        const promoId = getQueryParam('id');

        if (!promoId) {
            alert('No promo ID found in URL');
            return;
        }

        const promoDocRef = doc(db, 'promo', promoId);
        const promoSnapshot = await getDoc(promoDocRef);

        if (promoSnapshot.exists()) {
            const promoData = promoSnapshot.data();
            document.getElementById('promo_description').value = promoData.promo_description || '';
            document.getElementById('promo_order_display').innerText = promoData.promo_order || ''; // Show order in a display element
        } else {
            alert('No such document!');
        }
    } catch (error) {
        console.error('Error fetching promo details:', error);
    }
}

// Function to save edited promo details
async function savePromoDetails() {
    try {
        const promoId = getQueryParam('id');
        const promoDescription = document.getElementById('promo_description').value;
        
        const promoDocRef = doc(db, 'promo', promoId);

        // Check if required fields are filled
        if (!promoDescription) {
            alert('Please fill out the required description field.');
            return;
        }

        // Fetch promo order directly from Firestore (it shouldn't be an input)
        const currentSnapshot = await getDoc(promoDocRef);
        const currentData = currentSnapshot.exists() ? currentSnapshot.data() : {};
        const promoOrder = currentData.promo_order || ''; // Fetch the promo_order value from the document

        // Check if the promoOrder exists
        if (!promoOrder) {
            alert('Promo order not found!');
            return;
        }

        // Check if the file input actually has a file
        const imageFile = document.getElementById('promo_image')?.files[0];
        let imageName;

        if (imageFile) {
            imageName = imageFile.name; 
        } else {
            imageName = currentData.promo_image || ''; 
        }

        const updatedData = {
            promo_image: imageName,
            promo_description: promoDescription,
            promo_order: promoOrder, // Save the fetched promo_order
        };

        // Update the promo document in Firestore
        await updateDoc(promoDocRef, updatedData);
        alert('Promo updated successfully!');

        // Log the action (edit promo) to staff_action collection
        const staffEmail = auth.currentUser?.email;
        if (staffEmail) {
            await logStaffAction(staffEmail, "edit promo", promoOrder);
        }

        window.location.href = '/html/staff/staff-offerdetails.html';
    } catch (error) {
        console.error('Error saving promo details:', error);
        alert('Error saving promo details: ' + error.message);
    }
}

// Function to log staff action (edit promo) to staff_action collection
async function logStaffAction(email, action, promoOrder) {
    try {
        // Reference to the 'staff_action' collection and 'product' document
        const actionRef = collection(db, 'staff_action', 'promo', 'edit');
        
        // Log action with email, promo description, promo order, and timestamp
        await setDoc(doc(actionRef), {
            email: email,
            action: `${action} with order ${promoOrder}`,
            time: Timestamp.now()
        });
        console.log("Staff action logged successfully.");
    } catch (error) {
        console.error('Error logging staff action:', error);
    }
}

document.getElementById('edit').addEventListener('click', savePromoDetails);

document.addEventListener('DOMContentLoaded', fetchAndDisplayPromoDetails);
