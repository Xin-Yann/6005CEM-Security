import { getFirestore, collection, setDoc, doc, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// Function to get the highest promo_order
async function getLastPromoOrder() {
    const q = query(collection(db, 'promo'), orderBy('promo_order', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
        const lastPromo = querySnapshot.docs[0].data();
        return Number(lastPromo.promo_order);
    } else {
        return 0;
    }
}

document.getElementById("add").addEventListener("click", async () => {
    try {
        const promoDescription = document.getElementById('promo_description').value;

        if (!promoDescription) {
            alert('Please fill out required fields: description.');
            return;
        }

        // Get the full path of the image
        const imagePath = document.getElementById('promo_image').value;
        // Extract only the file name
        const imageName = imagePath.split('\\').pop().split('/').pop();

        // Get the last promo order and increment it by 1
        const lastPromoOrder = await getLastPromoOrder();
        const newPromoOrder = lastPromoOrder + 1;

        const promoRef = doc(collection(db, 'promo'));

        await setDoc(promoRef, {
            promo_image: imageName,
            promo_description: promoDescription,
            promo_order: newPromoOrder
        });

        alert('Promo added successfully!');

        // Log the action (add promo) to staff_action collection
        const staffEmail = auth.currentUser?.email;
        if (staffEmail) {
            await logStaffAction(staffEmail, "add promo", newPromoOrder);
        }

        window.location.reload();

    } catch (e) {
        console.error('Error adding document: ', e);
        alert('Error adding document: ' + e.message);
    }
});

// Function to log staff action (add promo) to staff_action collection
async function logStaffAction(email, action, promoOrder) {
    try {
        const actionRef = collection(db, 'staff_action', 'promo', 'add');
        await setDoc(doc(actionRef), {
            email: email,
            action: `${action} with order ${promoOrder}`,
            time: new Date()
        });
        console.log("Staff action logged successfully.");
    } catch (error) {
        console.error('Error logging staff action:', error);
    }
}
