import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, deleteDoc, Timestamp, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.10.0/firebase-firestore.js";

const auth = getAuth();
const db = getFirestore();
const ATTEMPT_LIMIT = 3;
const LOCK_DURATION = 15 * 60 * 1000;

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000);
}

document.addEventListener('DOMContentLoaded', () => {
    const signUpButton = document.getElementById('signUpButton');
    const resendOtpButton = document.getElementById('resendOtp');
    const countdownDisplay = document.getElementById("countdown");
    let countdownInterval;
    let lockCountdownInterval;

    signUpButton.addEventListener('click', async (event) => {
        event.preventDefault();
        const name = document.getElementById('Name').value.trim();
        const email = document.getElementById('Email').value.trim();
        const password = document.getElementById('Password').value.trim();
        const contact = document.getElementById('Contact').value.trim();
        const address = document.getElementById('Address').value.trim();
        const state = document.getElementById('State').value.trim();
        const city = document.getElementById('City').value.trim();
        const post = document.getElementById('Postcode').value.trim();
        const checkbox = document.getElementById('checkbox');

        const uppercase = /[A-Z]/;
        const lowercase = /[a-z]/;

        if (!name || !email || !password || !contact || !address || !state || !city || !post || !checkbox.checked) {
            alert("Please fill in all the details and agree to the terms.");
            return;
        }

        if (email.endsWith('@staff.com') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert('Invalid email address.');
            return;
        }

        if (password.length < 8 || !uppercase.test(password) || !lowercase.test(password)) {
            alert("Password must be at least 8 characters long and contain at least one uppercase and one lowercase character");
            return;
        }

        if (!checkbox.checked) {
            alert('You must agree to the Privacy Policy & T&C.');
            return;
        }

        const attemptData = await getDoc(doc(db, "otp_attempts", email));
        if (attemptData.exists() && attemptData.data().lockUntil?.toDate() > new Date()) {
            const unlockTime = attemptData.data().lockUntil.toDate().getTime();
            showOtpModal(email); 
            startLockCountdown(unlockTime, email); 
            return;
        }

        const otpCode = generateOtp();
        const hashedOtp = CryptoJS.SHA256(otpCode.toString()).toString();
        const expirationTime = Timestamp.fromDate(new Date(Date.now() + 60 * 1000));

        try {
            await setDoc(doc(db, "otps", email), {
                otp: hashedOtp,
                expiresAt: expirationTime,
                email: email
            });

            emailjs.send("service_wv3i5aq", "template_ipcct2s", {
                name: name,
                email: email,
                otp: otpCode,
            }).then(() => {
                showOtpModal(email);
            }).catch((error) => {
                alert("Failed to send OTP. Please try again.");
            });
        } catch (error) {
            console.error("Error saving OTP in Firestore:", error);
            alert("Failed to initiate OTP process.");
        }
    });

    function showOtpModal(email) {
        const otpModal = new bootstrap.Modal(document.getElementById('otpModal'));
        otpModal.show();

        otpModal._element.addEventListener('shown.bs.modal', () => {
            document.querySelector('.otp-input').focus();
        });

        otpModal._element.addEventListener('hidden.bs.modal', async () => {
            await deleteDoc(doc(db, "otps", email));
            clearInterval(countdownInterval);
            clearOtpInputs();
        });

        initializeOtp(email);
        setupOtpInputAutofocus();
    }

    function setupOtpInputAutofocus() {
        const otpInputs = document.querySelectorAll(".otp-input");
        otpInputs.forEach((input, index) => {
            input.addEventListener("input", () => {
                input.value = input.value.replace(/[^0-9]/g, "");
                if (input.value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                } else if (input.value && index === otpInputs.length - 1) {
                    input.focus();
                }   
            });
            input.addEventListener("keydown", (e) => {
                if (e.key === "Backspace" && !input.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
        });
    }

    function disableOtpInputs() {
        const otpInputs = document.querySelectorAll(".otp-input");
        otpInputs.forEach(input => input.disabled = true);
    }

    function enableOtpInputs() {
        const otpInputs = document.querySelectorAll(".otp-input");
        otpInputs.forEach(input => input.disabled = false);
    }

    async function initializeOtp(email) {
        try {
            const otpDoc = await getDoc(doc(db, "otps", email));
            if (otpDoc.exists()) {
                const expiresAt = otpDoc.data().expiresAt.toDate().getTime();
                startCountdown(expiresAt, email);
            }
        } catch (error) {
            console.error("Error fetching OTP document", error);
        }
    }

    function startCountdown(expirationTime, email) {
        clearInterval(countdownInterval);
        enableOtpInputs();

        countdownInterval = setInterval(() => {
            const currentTime = new Date().getTime();
            const timeLeft = Math.floor((expirationTime - currentTime) / 1000);

            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                countdownDisplay.textContent = "00:00";
                document.getElementById("verifyOtpButton").disabled = true;
                alert("OTP has expired. Please request a new one.");
                deleteDoc(doc(db, "otps", email));
            } else {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                countdownDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    function startLockCountdown(unlockTime, email) {
        clearInterval(countdownInterval); 
        clearInterval(lockCountdownInterval);
        disableOtpInputs(); 
        resendOtpButton.disabled = true;

        lockCountdownInterval = setInterval(async () => {
            const currentTime = new Date().getTime();
            const timeLeft = Math.floor((unlockTime - currentTime) / 1000);

            if (timeLeft <= 0) {
                clearInterval(lockCountdownInterval);
                enableOtpInputs(); 
                resendOtpButton.disabled = false;
                await deleteDoc(doc(db, "otp_attempts", email));
                alert("Your account is unlocked. You can click resend OTP for try again now.");
                countdownDisplay.textContent = ""; 
                document.querySelector(".otp-input:first-of-type").focus();
            } else {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                countdownDisplay.textContent = `Account locked. Try again in ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    function clearOtpInputs() {
        const otpInputs = document.querySelectorAll(".otp-input");
        otpInputs.forEach(input => input.value = "");
        otpInputs[0].focus();
    }

    document.getElementById('verifyOtpButton').addEventListener('click', async () => {
        const enteredOtp = Array.from(document.querySelectorAll(".otp-input")).map(input => input.value).join('');
        const hashedEnteredOtp = CryptoJS.SHA256(enteredOtp).toString();
        const email = document.getElementById("Email").value.trim();
        const otpDocRef = doc(db, "otps", email);
        const attemptDocRef = doc(db, "otp_attempts", email);

        try {
            const otpDoc = await getDoc(otpDocRef);
            const attemptData = await getDoc(attemptDocRef);
            let failedAttempts = attemptData.exists() ? attemptData.data().failedAttempts : 0;

            if (!otpDoc.exists()) {
                alert("OTP not found. Please request a new OTP.");
                return;
            }

            const { otp: storedHashedOtp, expiresAt } = otpDoc.data();
            const isOtpValid = hashedEnteredOtp === storedHashedOtp;
            const isNotExpired = expiresAt.toDate().getTime() > new Date().getTime();

            if (isOtpValid && isNotExpired) {
                await deleteDoc(otpDocRef);
                await deleteDoc(attemptDocRef);
                await completeRegistration(email);
            } else {
                failedAttempts++;
                if (failedAttempts >= ATTEMPT_LIMIT) {
                    const lockUntil = Timestamp.fromDate(new Date(Date.now() + LOCK_DURATION));
                    await setDoc(attemptDocRef, { failedAttempts, lockUntil });
                    startLockCountdown(lockUntil.toDate().getTime(), email);
                    alert("Account locked due to multiple failed attempts. Try again later.");
                } else {
                    await setDoc(attemptDocRef, { failedAttempts });
                    alert("Invalid OTP. Please try again.");
                    document.querySelector(".otp-input:last-of-type").focus();
                }
            }
        } catch (error) {
            console.error("OTP verification failed:", error);
            alert("OTP verification failed. Please try again.");
        }
    });

    resendOtpButton.addEventListener('click', async () => {
        const email = document.getElementById("Email").value.trim();
        const newOtp = generateOtp();
        const hashedNewOtp = CryptoJS.SHA256(newOtp.toString()).toString();
        const expirationTime = Timestamp.fromDate(new Date(Date.now() + 60 * 1000)); // 60 seconds

        try {
            await setDoc(doc(db, "otps", email), {
                otp: hashedNewOtp,
                expiresAt: expirationTime,
                email: email
            });

            emailjs.send("service_wv3i5aq", "template_ipcct2s", {
                name: document.getElementById('Name').value.trim(),
                email: email,
                otp: newOtp,
            }).then(() => {
                alert("New OTP sent successfully.");
                clearOtpInputs();
                document.getElementById("verifyOtpButton").disabled = false;
                initializeOtp(email);
            }).catch((error) => {
                alert("Failed to resend OTP. Please try again.");
            });
        } catch (error) {
            console.error("Error resending OTP:", error);
        }
    });

    async function completeRegistration(email) {
        const name = document.getElementById("Name").value.trim();
        const password = document.getElementById("Password").value.trim();
        const contact = document.getElementById("Contact").value.trim();
        const address = document.getElementById("Address").value.trim();
        const state = document.getElementById("State").value.trim();
        const city = document.getElementById("City").value.trim();
        const post = document.getElementById("Postcode").value.trim();

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const userId = userCredential.user.uid;

            await addDoc(collection(db, "users"), {
                userId: userId,
                name: name,
                email: email,
                contact: contact,
                address: address,
                state: state,
                city: city,
                post: post,
                points: 0
            });

            alert("Registration successful!");
            window.location.href = "../html/home.html";
        } catch (error) {
            if (error.code === 'auth/email-already-in-use') {
                alert("The email address is already in use by another account.");
            } else {
                alert("Failed to register. Please try again.");
            }
        }
    }
});
