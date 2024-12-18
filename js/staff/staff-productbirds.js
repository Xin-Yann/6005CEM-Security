import { getFirestore, doc, collection, query, orderBy, getDocs, deleteDoc, setDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";

const db = getFirestore();
const auth = getAuth();

function createButton(htmlContent, onClickHandler) {
    const button = document.createElement('button');
    button.innerHTML = htmlContent;
    button.addEventListener('click', onClickHandler);
    button.classList.add('btn', 'btn-primary');
    return button;
}

async function fetchDataAndDisplay() {
    try {
        const productType = document.getElementById('food-type').value;
        const birdsDocRef = doc(db, 'products', 'birds');
        const subcollectionRef = collection(birdsDocRef, productType);

        // Fetching without natural sorting in Firestore
        const q = query(subcollectionRef, orderBy("product_id", "asc")); 
        const querySnapshot = await getDocs(q);

        let documents = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        documents.sort((a, b) => {
            return naturalSort(a.product_id, b.product_id);
        });

        const productContainer = document.getElementById('product-container');
        productContainer.innerHTML = '';

        const table = document.createElement('table');
        table.classList.add('table', 'table-bordered', 'table-hover','table-style');
        table.style.backgroundColor = 'white';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Id', 'Image', 'Name', 'Description', 'Price (RM)', 'Stock', 'Weight (g)', 'Edit', 'Delete'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        documents.forEach(foodData => {
            const tr = document.createElement('tr');

            ['product_id', 'product_image', 'product_name', 'product_description', 'product_price', 'product_stock', 'product_weight'].forEach(field => {
                const td = document.createElement('td');
                if (field === 'product_image' && foodData[field]) {
                    const productImage = document.createElement('img');
                    productImage.src = `/image/products/birds/${productType}/${foodData[field]}`;
                    productImage.alt = 'Product Image';
                    productImage.classList.add('table-image')
                    td.appendChild(productImage);
                } else {
                    td.textContent = foodData[field] || 'N/A';
                }
                tr.appendChild(td);
            });

            // Edit button
            const action1 = document.createElement('td');
            const editButton = createButton('Edit', () => {
                editProduct(foodData.id, productType);
            });
            editButton.classList.add('btn');
            action1.appendChild(editButton);
            tr.appendChild(action1);

            // Delete button
            const action2 = document.createElement('td');
            const deleteButton = createButton('Delete', async () => {
                await deleteProduct(foodData.id, productType);
            });
            deleteButton.classList.add('btn', 'btn-danger');
            action2.appendChild(deleteButton);
            tr.appendChild(action2);

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        productContainer.appendChild(table);
    } catch (error) {
        console.error('Error fetching documents:', error);
    }
}

function naturalSort(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

// Function to delete product
async function deleteProduct(productId, productType) {
    try {
        const productRef = doc(db, `products/dog/${productType}/${productId}`);
        await deleteDoc(productRef);
        alert('Product deleted successfully!');
        
        // Log the deletion to staff_action collection
        const staffEmail = auth.currentUser?.email;
        if (staffEmail) {
            await logStaffAction(staffEmail, `delete product ${productId}`);
        }

        fetchDataAndDisplay();
    } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting product.');
    }
}

// Function to log staff action to staff_action collection
async function logStaffAction(email, action) {
    try {
        const actionRef = collection(db, 'staff_action', 'product', 'delete');
        await setDoc(doc(actionRef), {
            email: email,
            action: action,
            time: Timestamp.now()
        });
        console.log("Staff action logged successfully.");
    } catch (error) {
        console.error('Error logging staff action:', error);
    }
}

// Function to edit product page
function editProduct(productId, productType) {
    window.location.href = `/html/staff/staff-editproduct.html?category=birds&id=${productId}&type=${encodeURIComponent(productType)}`;
}

document.getElementById('food-type').addEventListener('change', fetchDataAndDisplay);

document.addEventListener('DOMContentLoaded', function() {
    fetchDataAndDisplay();
});
