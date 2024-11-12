import { getFirestore, doc, getDoc, updateDoc, collection, setDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

// Function to get query parameter by name
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Function to fetch and display product details
async function fetchAndDisplayProductDetails() {
    try {
        const productCategory = getQueryParam('category');
        const productId = getQueryParam('id');
        const productType = decodeURIComponent(getQueryParam('type'));

        if (!productId || !productType || !productCategory) {
            alert('No product category, id or type found in URL');
            return;
        }

        const productDocRef = doc(db, 'products', productCategory, productType, productId);
        const productSnapshot = await getDoc(productDocRef);

        if (productSnapshot.exists()) {
            const productData = productSnapshot.data();
            document.getElementById('product_category').value = productCategory;
            document.getElementById('product_type').value = productType;
            document.getElementById('product_id').value = productId;
            document.getElementById('product_name').value = productData.product_name || '';
            document.getElementById('product_description').value = productData.product_description || '';
            document.getElementById('product_price').value = productData.product_price || '';
            document.getElementById('product_stock').value = productData.product_stock || '';
            document.getElementById('product_weight').value = productData.product_weight || '';
        } else {
            alert('No such document!');
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
    }
}

// Function to save edited product details
async function saveProductDetails() {
    try {
        const productCategory = document.getElementById('product_category').value;
        const productId = document.getElementById('product_id').value;
        const productType = document.getElementById('product_type').value;
        const productName = document.getElementById('product_name').value;
        const productDescription = document.getElementById('product_description').value;
        const productPrice = document.getElementById('product_price').value;
        const productStock = parseInt(document.getElementById('product_stock').value);
        const productWeight = document.getElementById('product_weight').value;

        const productDocRef = doc(db, 'products', productCategory, productType, productId);

        // Check if required fields are filled
        if (!productName || !productPrice || !productStock || !productWeight) {
            alert('Please fill out all required fields: name, price, stock, weight.');
            return;
        }

        // Check if the file input actually has a file
        const imageFile = document.getElementById('product_image').files[0];
        let imageName;

        if (imageFile) {
            imageName = imageFile.name; // Get the file name without uploading
        } else {
            // Fetch the existing data to potentially get the existing image
            const currentSnapshot = await getDoc(productDocRef);
            const currentData = currentSnapshot.exists() ? currentSnapshot.data() : {};
            imageName = currentData.product_image; // Retain the existing image name if no new file is uploaded
        }

        const updatedData = {
            product_image: imageName,
            product_name: productName,
            product_description: productDescription,
            product_price: productPrice,
            product_stock: productStock,
            product_weight: productWeight,
        };

        // Update the product document in Firestore
        await updateDoc(productDocRef, updatedData);
        alert('Product updated successfully!');

        // Log the action (edit product) to staff_action collection
        const staffEmail = auth.currentUser?.email;
        if (staffEmail) {
            await logStaffAction(staffEmail, "edit product", productId);
        }

        // Redirect to the appropriate category page
        switch (productCategory) {
            case 'dog':
                window.location.href = encodeURI('/html/staff/staff-productdog.html');
                break;
            case 'cat':
                window.location.href = encodeURI('/html/staff/staff-productcat.html');
                break;
            case 'hamster&rabbits':
                window.location.href = encodeURI('/html/staff/staff-producthamster&rabbits.html');
                break;
            case 'birds':
                window.location.href = encodeURI('/html/staff/staff-productbirds.html');
                break;
            case 'fish&aquatics':
                window.location.href = encodeURI('/html/staff/staff-productfish&aquatics.html');
                break;
            default:
                window.location.href = '/html/staff/staff-home.html';
                break;
        }

    } catch (error) {
        console.error('Error saving product details:', error);
        alert('Error saving product details: ' + error.message);
    }
}

// Function to log staff action (edit product) to staff_action collection
async function logStaffAction(email, action, productId) {
    try {
        const actionRef = collection(db, 'staff_action', 'product', 'edit');
        await setDoc(doc(actionRef), {
            email: email,
            action: `${action} ${productId}`,
            time: new Date()
        });
        console.log("Staff action logged successfully.");
    } catch (error) {
        console.error('Error logging staff action:', error);
    }
}

document.getElementById('edit').addEventListener('click', saveProductDetails);

document.addEventListener('DOMContentLoaded', fetchAndDisplayProductDetails);
