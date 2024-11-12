import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, Timestamp, query, collection, where, getDocs } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();
let countdownInterval; // To handle countdown interval for OTP expiration

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000);
}

// Handle sign-in button click
document.getElementById('signIn').addEventListener('click', async (event) => {
    event.preventDefault();
    const email = document.getElementById('Email').value.trim();
    const password = document.getElementById('Password').value.trim();
    const checkbox = document.getElementById('checkbox');

    if (!email || !password) {
        alert('Both email and password are required.');
        return;
    }
    if (!checkbox.checked) {
        alert('You must agree to the Privacy Policy & T&C.');
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        console.log('User authenticated successfully:', userCredential.user);

        // Generate and hash OTP
        const otpCode = generateOtp();
        const hashedOtp = CryptoJS.SHA256(otpCode.toString()).toString();
        const expirationTime = Timestamp.fromDate(new Date(Date.now() + 60 * 1000));

        // Save OTP in Firestore
        await setDoc(doc(db, "otps", email), {
            otp: hashedOtp,
            expiresAt: expirationTime,
            email: email
        });

        // Send OTP to the user's email via EmailJS
        emailjs.send("service_e5hae3o", "template_2ljm0rm", {
            name: "Valued Customer",
            otp: otpCode,
            email: email
        }).then(() => {
            console.log("OTP sent successfully to:", email);
            showOtpModal(email);
        }).catch((error) => {
            console.error("Failed to send OTP:", error);
            alert("Failed to send OTP. Please try again.");
        });
    } catch (error) {
        console.error("Authentication failed:", error);
        alert("Invalid email or password. Please try again.");
    }
});

// Display OTP modal and start countdown
function showOtpModal(email) {
    const otpModal = new bootstrap.Modal(document.getElementById('otpModal'));
    otpModal.show();

    otpModal._element.addEventListener('shown.bs.modal', () => {
        clearOtpInputs();
        document.querySelector('.otp-input').focus();
    });

    otpModal._element.addEventListener('hidden.bs.modal', async () => {
        await clearOtp(email);
        clearInterval(countdownInterval);
    });

    initializeOtpCountdown(email);
}

function clearOtpInputs() {
    document.querySelectorAll(".otp-input").forEach(input => input.value = "");
}

// Start OTP countdown timer
function startCountdown(expirationTime, email) {
    clearInterval(countdownInterval);
    countdownInterval = setInterval(async () => {
        const currentTime = new Date().getTime();
        const timeLeft = Math.floor((expirationTime - currentTime) / 1000);

        if (timeLeft <= 0) {
            clearInterval(countdownInterval);
            document.getElementById("countdown").textContent = "00:00";
            document.getElementById("verifyOtpButton").disabled = true;
            alert("OTP has expired. Please request a new one.");
            await clearOtp(email);
        } else {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            document.getElementById("countdown").textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }, 1000);
}

// Initialize OTP countdown
async function initializeOtpCountdown(email) {
    try {
        const otpDoc = await getDoc(doc(db, "otps", email));
        if (otpDoc.exists()) {
            const expiresAt = otpDoc.data().expiresAt.toDate().getTime();
            startCountdown(expiresAt, email);
        }
    } catch (error) {
        console.error("Error fetching OTP document:", error);
    }
}

// Clear OTP from Firestore
async function clearOtp(email) {
    try {
        await deleteDoc(doc(db, "otps", email));
        console.log("OTP cleared from Firestore.");
    } catch (error) {
        console.error("Error clearing OTP:", error);
    }
}

// Handle OTP input field navigation
const otpInputs = document.querySelectorAll(".otp-input");
otpInputs.forEach((input, index) => {
    input.addEventListener("input", (e) => {
        input.value = input.value.replace(/[^0-9]/g, "");
        if (input.value && index < otpInputs.length - 1) otpInputs[index + 1].focus();
    });
    input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !input.value && index > 0) otpInputs[index - 1].focus();
    });
});

// Verify OTP button click handler
document.getElementById('verifyOtpButton').addEventListener('click', async () => {
    const enteredOtp = Array.from(otpInputs).map(input => input.value).join('');
    const hashedEnteredOtp = CryptoJS.SHA256(enteredOtp).toString();
    const email = document.getElementById("Email").value.trim();

    try {
        const otpDocRef = doc(db, "otps", email);
        const otpDoc = await getDoc(otpDocRef);
        if (!otpDoc.exists()) {
            alert("OTP not found. Please request a new OTP.");
            return;
        }
        const { otp: storedHashedOtp, expiresAt } = otpDoc.data();
        const isOtpValid = hashedEnteredOtp === storedHashedOtp;
        const isNotExpired = expiresAt.toDate().getTime() > new Date().getTime();

        if (isOtpValid && isNotExpired) {
            await clearOtp(email);
            await loginUser(email);
        } else {
            alert(isNotExpired ? "Invalid OTP. Please try again." : "OTP has expired. Please request a new one.");
        }
    } catch (error) {
        console.error("OTP verification failed:", error);
        alert("OTP verification failed. Please try again.");
    }
});

// Login user after successful OTP verification
async function loginUser(email) {
    sessionStorage.setItem('userEmail', email); 
    window.location.href = "../html/home.html"; 
}

// Resend OTP handler
document.getElementById('resendOtp').addEventListener('click', async () => {
    const email = document.getElementById("Email").value.trim();
    const newOtp = generateOtp();
    const hashedNewOtp = CryptoJS.SHA256(newOtp.toString()).toString();
    const expirationTime = Timestamp.fromDate(new Date(Date.now() + 60 * 1000));

    try {
        await setDoc(doc(db, "otps", email), {
            otp: hashedNewOtp,
            expiresAt: expirationTime,
            email: email
        });

        emailjs.send("service_e5hae3o", "template_2ljm0rm", {
            name: "Valued Customer",
            otp: newOtp,
            email: email
        }).then(() => {
            alert("New OTP sent successfully.");
            clearOtpInputs();
            document.getElementById("verifyOtpButton").disabled = false;
            initializeOtpCountdown(email); // Restart countdown
            document.querySelector('.otp-input').focus();
        }).catch((error) => {
            console.error("Failed to resend OTP:", error);
            alert("Failed to resend OTP. Please try again.");
        });
    } catch (error) {
        console.error("Error resending OTP:", error);
        alert("Failed to resend OTP. Please try again.");
    }
});
