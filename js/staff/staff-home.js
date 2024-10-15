import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const db = getFirestore();

let yearSelect, monthSelect;

async function fetchMonthlySalesData(year, month) {
    const salesData = {};

    try {
        const ordersRef = collection(db, 'orders');
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const q = query(ordersRef, where("orderDate", ">=", startDate.toISOString()), where("orderDate", "<=", endDate.toISOString()));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {
            const order = doc.data();
            const cartItems = order.cartItems;

            cartItems.forEach((item) => {
                const category = item.type || "Unknown";
                if (salesData[category]) {
                    salesData[category] += item.price * item.quantity;
                } else {
                    salesData[category] = item.price * item.quantity;
                }
            });
        });

    } catch (error) {
        console.error("Error fetching sales data:", error);
    }

    return salesData;
}

async function displayMonthlySalesReport(year, month) {
    const salesData = await fetchMonthlySalesData(year, month);

    const xValues = Object.keys(salesData);
    const yValues = Object.values(salesData);
    const barColors = [
        "#b91d47", "#00aba9", "#2b5797", "#e8c3b9", "#1e7145"
    ];

    new Chart("myChart", {
        type: "pie",
        data: {
            // Append price to each label
            labels: xValues.map((label, index) => `${label} - RM ${yValues[index].toFixed(2)}`), 
            datasets: [{
                backgroundColor: barColors,
                data: yValues
            }]
        },
        options: {
            title: {
                display: true,
                text: `Pet Mart Monthly Sales Report (${year}-${month})`
            }
        }
    });
}

function updateSalesReport() {
    const selectedYear = yearSelect.value;
    const selectedMonth = monthSelect.value;
    displayMonthlySalesReport(selectedYear, selectedMonth);
}

document.addEventListener('DOMContentLoaded', async () => {
    yearSelect = document.getElementById('year'); 
    monthSelect = document.getElementById('month'); 

    // Populate the year dropdown with the last 3 years
    const currentYear = new Date().getFullYear();
    for (let i = 0; i < 3; i++) {
        const yearOption = document.createElement('option');
        yearOption.value = currentYear - i;
        yearOption.text = currentYear - i;
        yearSelect.appendChild(yearOption);
    }

    // Populate the month dropdown with the months
    for (let i = 1; i <= 12; i++) {
        const monthOption = document.createElement('option');
        monthOption.value = i;
        monthOption.text = new Date(currentYear, i - 1, 1).toLocaleString('default', { month: 'long' });
        monthSelect.appendChild(monthOption);
    }

    const currentMonth = new Date().getMonth() + 1;
    monthSelect.value = currentMonth;

    updateSalesReport();

    monthSelect.addEventListener('change', updateSalesReport);
});
