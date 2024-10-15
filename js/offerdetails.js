import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

async function fetchPromos() {
    try {
        
        const promoCollection = query(collection(db, 'promo'), orderBy('promo_order'));

        const promoSnapshot = await getDocs(promoCollection);
        
        const promoContainer = document.getElementById('promoContainer');
        
        promoContainer.innerHTML = '';

        let isAlternate = true;
        promoSnapshot.forEach(doc => {
            const promoData = doc.data();
            
            const promoElement = document.createElement('div');
            promoElement.className = isAlternate ? 'container1' : 'container2';

            if (promoData.promo_image) {
                const promoImage = document.createElement('img');
                promoImage.src = `/image/${promoData.promo_image}`;
                promoImage.classList.add('offerimg');
                promoElement.appendChild(promoImage);
            }
            
            const promoInfo = document.createElement('div');
            promoInfo.className = 'offerinfo';
            promoInfo.innerHTML = `<p>${promoData.promo_description}</p>`;
            
            promoElement.appendChild(promoInfo);
            promoContainer.appendChild(promoElement);
            
            isAlternate = !isAlternate;
        });
        
    } catch (error) {
        console.error("Error fetching promos: ", error);
    }
}

window.onload = fetchPromos;
