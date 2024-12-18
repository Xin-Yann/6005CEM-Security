import { getFirestore, collection, setDoc, doc, getDoc, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

document.getElementById("add").addEventListener("click", async () => {
    try {
        const category = document.getElementById('product_category').value;
        const type = document.getElementById('product_type').value;
        const productId = document.getElementById('product_id').value;

        const productName = document.getElementById('product_name').value;
        const productDescription = document.getElementById('product_description').value;
        const productPrice = document.getElementById('product_price').value;
        const productStock = document.getElementById('product_stock').value;
        const productWeight = document.getElementById('product_weight').value;

        if (!productId || !productName || !productPrice || !productStock || !productWeight) {
            alert('Please fill out all required fields: category, type, ID, name, price, stock, weight.');
            return;
        }

        if (category === "Select category") {
            alert('Please select a category.');
            return;
        }

        if (type === "Select type") {
            alert('Please select a type.');
            return;
        }

        // Check if the product ID already exists
        const productRef = doc(collection(db, 'products', category, type), productId);
        const productSnapshot = await getDoc(productRef);

        if (productSnapshot.exists()) {
            alert('Product ID already exists. Please choose a different ID.');
            return;
        }

        // Check if the product name already exists
        const productsQuery = query(collection(db, 'products', category, type), where("product_name", "==", productName));
        const querySnapshot = await getDocs(productsQuery);

        if (!querySnapshot.empty) {
            alert('Product name already exists. Please choose a different name.');
            return;
        }

        // Get the full path of the image
        const imagePath = document.getElementById('product_image').value;
        // Extract only the file name
        const imageName = imagePath.split('\\').pop().split('/').pop();

        // Set the document in Firestore
        await setDoc(productRef, {
            product_id: productId,
            product_image: imageName,
            product_name: productName,
            product_description: productDescription,
            product_price: productPrice,
            product_stock: productStock,
            product_weight: productWeight,
        });

        alert('Product added successfully!');

        // Log the action (add product) to staff_action collection
        const staffEmail = auth.currentUser?.email;
        if (staffEmail) {
            await logStaffAction(staffEmail, "add product", productId);
        }

        window.location.reload();

        console.log('Document written with ID: ', productId);
    } catch (e) {
        console.error('Error adding document: ', e);
        alert('Error adding document: ' + e.message);
    }
});

// Function to log staff action (add product) to staff_action collection
async function logStaffAction(email, action, productId) {
    try {
        const actionRef = collection(db, 'staff_action', 'product', 'add');
        await setDoc(doc(actionRef), {
            email: email,
            action: `${action} ${productId}`,
            time: Timestamp.now()
        });
        console.log("Staff action logged successfully.");
    } catch (error) {
        console.error('Error logging staff action:', error);
    }
}

// Add an event listener to the product category select element
document.getElementById("product_category").addEventListener("change", function () {
    updateOptions();
});

function updateOptions() {
    var categorySelect = document.getElementById("product_category");
    var typeSelect = document.getElementById("product_type");
    var selectedCategory = categorySelect.value;

    typeSelect.innerHTML = '<option disabled selected>Select type</option>';

    // Add type options based on the selected category
    switch (selectedCategory) {
        case "dog":
            addOption("dry food");
            addOption("wet food");
            addOption("essentials");
            addOption("toys");
            addOption("treats");
            break;
        case "cat":
            addOption("dry food");
            addOption("wet food");
            addOption("essentials");
            addOption("toys");
            addOption("treats");
            break;
        case "hamster&rabbits":
            addOption("dry food");
            addOption("essentials");
            addOption("toys");
            addOption("treats");
            break;
        case "birds":
            addOption("dry food");
            addOption("essentials");
            addOption("toys");
            addOption("treats");
            break;
        case "fish&aquatics":
            addOption("dry food");
            addOption("essentials");
            addOption("treats");
            break;
    }
}

function addOption(type) {
    var typeSelect = document.getElementById("product_type");
    var option = document.createElement("option");
    option.text = type;
    option.value = type;
    typeSelect.add(option);
}
