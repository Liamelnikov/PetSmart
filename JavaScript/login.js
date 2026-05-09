
// ייבוא מ-firebaseconfig.js שתוקן
import { auth } from "./firebaseconfig.js"; 

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";



onAuthStateChanged(auth, (user) => {
  if (user) {
    window.location.href = "home.html"; 
  }
});

// -----------------------
// אחזור אלמנטים
// -----------------------
const $ = (s) => document.querySelector(s);
const formTitle    = $('#formTitle');
const formSubtitle = $('#formSubtitle');
const authForm     = $('#authForm');

const nameRow     = $('#nameRow');
const confirmRow  = $('#confirmRow');
const toggleLink  = $('#toggleLink');
const submitBtn   = $('#submitBtn');
const errorBox    = $('#errorBox');

let mode = "login";

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = "block";
}

function setMode(type) {
  mode = type;

  if (mode === "signup") {
    formTitle.textContent = "Create an Account";
    formSubtitle.textContent = "Register to start managing your PetSmartGate";
    nameRow.style.display = "block";
    confirmRow.style.display = "block";
    submitBtn.textContent = "Sign Up";
    toggleLink.innerHTML = "Already have an account? <strong>Login</strong>";
  } else {
    // mode === "login"
    formTitle.textContent = "Login";
    formSubtitle.textContent = "Welcome back! Login to your PetSmartGate account";
    submitBtn.textContent = "Login";
    toggleLink.innerHTML = "Don’t have an account? <strong>Sign up</strong>";
    nameRow.style.display = "none";
    confirmRow.style.display = "none";
  }

  errorBox.style.display = "none";
  authForm.reset();
}


// מעבר ל Signup
toggleLink.addEventListener("click", (e) => {
  e.preventDefault();
  setMode(mode === "login" ? "signup" : "login");
});

// שליחת טופס
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.style.display = "none";

  const email = $('#email').value.trim().toLowerCase();
  const password = $('#password').value;

  try {
    if (mode === "signup") {
      const name = $('#name').value.trim();
      const pass2 = $('#password2').value;

      if (!name) return showError("Please enter your full name.");
      if (password.length < 6) return showError("Password must be at least 6 characters.");
      if (password !== pass2) return showError("Passwords do not match.");

      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCred.user, { displayName: name });

      window.location.href = "myPet.html";
      return;
    }

    // LOGIN 
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "myPet.html";

  } catch (error) {
    let message = "An unknown error occurred.";

    switch (error.code) {
      case "auth/invalid-email":
        message = "Invalid email address format.";
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
        message = "Incorrect email or password.";
        break;
      case "auth/email-already-in-use":
        message = "This email is already registered.";
        break;
      case "auth/weak-password":
        message = "Password is too weak. Choose a stronger one.";
        break;
      default:
        console.error(error);
        message = "Login failed. Please check your credentials.";
    }

    showError(message);
  }
});