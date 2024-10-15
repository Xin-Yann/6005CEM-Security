import { getFirestore, doc, collection, query, orderBy, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

// Function to fetch promo data and display it on the webpage
async function fetchPromosAndDisplay() {
    try {
        const promoCollection = query(collection(db, 'promo'), orderBy('promo_order', 'asc'));
        
        const promoSnapshot = await getDocs(promoCollection);

        const promoContainer = document.getElementById('promo-container');
        promoContainer.innerHTML = '';

        const table = document.createElement('table');
        table.classList.add('table', 'table-bordered', 'table-hover', 'table-style');
        table.style.backgroundColor = 'white';

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Order', 'Image', 'Description', 'Edit', 'Delete'].forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        promoSnapshot.forEach(doc => {
            const promoData = doc.data();
            const tr = document.createElement('tr');

            ['promo_order', 'promo_image', 'promo_description'].forEach(field => {
                const td = document.createElement('td');
                if (field === 'promo_image' && promoData[field]) {
                    const promoImage = document.createElement('img');
                    promoImage.src = `/image/${promoData[field]}`;
                    promoImage.alt = 'Promo Image';
                    promoImage.classList.add('table-image');
                    td.appendChild(promoImage);
                } else {
                    td.textContent = promoData[field] || 'N/A';
                }
                tr.appendChild(td);
            });

            // Edit button
            const action1 = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('btn', 'btn-primary');
            editButton.addEventListener('click', () => {
                editPromo(doc.id);
            });
            action1.appendChild(editButton);
            tr.appendChild(action1);

            // Delete button
            const action2 = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('btn', 'btn-danger');
            deleteButton.addEventListener('click', async () => {
                await deletePromo(doc.id);
            });
            action2.appendChild(deleteButton);
            tr.appendChild(action2);

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        promoContainer.appendChild(table);
    } catch (error) {
        console.error('Error fetching promos:', error);
    }
}

// Function to delete promo
async function deletePromo(promoId) {
    try {
        const promoRef = doc(db, `promo/${promoId}`);
        await deleteDoc(promoRef);
        alert('Promo deleted successfully!');
        fetchPromosAndDisplay();
    } catch (error) {
        console.error('Error deleting document:', error);
        alert('Error deleting promo.');
    }
}

function editPromo(promoId) {
    window.location.href = `/html/staff/staff-editpromo.html?id=${promoId}`;
}

document.addEventListener('DOMContentLoaded', function() {
    fetchPromosAndDisplay();
});
