import { getFirestore, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

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
            document.getElementById('promo_order').value = promoData.promo_order || '';
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
            alert('Please fill out all required fields: description.');
            return;
        }

        // Check if the file input actually has a file
        const imageFile = document.getElementById('promo_image').files[0];
        let imageName;

        if (imageFile) {
            imageName = imageFile.name; 
        } else {
            const currentSnapshot = await getDoc(promoDocRef);
            const currentData = currentSnapshot.exists() ? currentSnapshot.data() : {};
            imageName = currentData.promo_image; 
        }

        const updatedData = {
            promo_image: imageName,
            promo_description: promoDescription,
        };

        await updateDoc(promoDocRef, updatedData);
        alert('Promo updated successfully!');
        window.location.href = '/html/staff/staff-offerdetails.html';
    } catch (error) {
        console.error('Error saving promo details:', error);
        alert('Error saving promo details: ' + error.message);
    }
}

document.getElementById('edit').addEventListener('click', savePromoDetails);

document.addEventListener('DOMContentLoaded', fetchAndDisplayPromoDetails);
