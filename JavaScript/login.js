// ייבוא auth מתוך firebaseconfig.js
import { auth } from "./firebaseconfig.js"; 

// ייבוא פונקציות Firebase Authentication
import {
  createUserWithEmailAndPassword, // יצירת משתמש חדש
  signInWithEmailAndPassword, // התחברות משתמש
  updateProfile, // עדכון פרופיל משתמש
  onAuthStateChanged // מאזין להתחברות/התנתקות
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

onAuthStateChanged(auth, (user) => { // מאזין למצב ההתחברות

  if (user) { // אם המשתמש מחובר

    window.location.href = "home.html"; // מעבר לעמוד הבית
  }
});

// -----------------------
// אחזור אלמנטים
// -----------------------

const $ = (s) => document.querySelector(s); // פונקציית קיצור ל-querySelector

const formTitle    = $('#formTitle'); // כותרת הטופס
const formSubtitle = $('#formSubtitle'); // כותרת משנה
const authForm     = $('#authForm'); // הטופס עצמו

const nameRow     = $('#nameRow'); // שורת שם
const confirmRow  = $('#confirmRow'); // שורת אימות סיסמה
const toggleLink  = $('#toggleLink'); // לינק מעבר Login/Signup
const submitBtn   = $('#submitBtn'); // כפתור שליחה
const errorBox    = $('#errorBox'); // תיבת שגיאה

let mode = "login"; // מצב ברירת מחדל

function showError(message) { // פונקציה להצגת שגיאה

  errorBox.textContent = message; // מכניס את הטקסט

  errorBox.style.display = "block"; // מציג את תיבת השגיאה
}

function setMode(type) { // פונקציה שמחליפה מצב בין login/signup

  mode = type; // שומר את המצב החדש

  if (mode === "signup") { // אם מצב signup

    formTitle.textContent = "Create an Account"; // משנה כותרת

    formSubtitle.textContent = "Register to start managing your PetSmartGate"; // משנה תיאור

    nameRow.style.display = "block"; // מציג שורת שם

    confirmRow.style.display = "block"; // מציג אימות סיסמה

    submitBtn.textContent = "Sign Up"; // משנה טקסט כפתור

    toggleLink.innerHTML = "Already have an account? <strong>Login</strong>"; // משנה טקסט מעבר

  } else { // אם מצב login

    formTitle.textContent = "Login"; // משנה כותרת

    formSubtitle.textContent = "Welcome back! Login to your PetSmartGate account"; // משנה תיאור

    submitBtn.textContent = "Login"; // משנה טקסט כפתור

    toggleLink.innerHTML = "Don’t have an account? <strong>Sign up</strong>"; // משנה טקסט מעבר

    nameRow.style.display = "none"; // מסתיר שורת שם

    confirmRow.style.display = "none"; // מסתיר אימות סיסמה
  }

  errorBox.style.display = "none"; // מסתיר שגיאות

  authForm.reset(); // מאפס את הטופס
}

// מעבר בין Login ל-Signup
toggleLink.addEventListener("click", (e) => { // מאזין ללחיצה על toggle

  e.preventDefault(); // מונע refresh

  setMode(mode === "login" ? "signup" : "login"); // מחליף מצב
});

// מאזין לשליחת הטופס
authForm.addEventListener("submit", async (e) => {

  e.preventDefault(); // מונע refresh

  errorBox.style.display = "none"; // מסתיר שגיאה קודמת

  const email = $('#email').value.trim().toLowerCase(); // מביא email ומנקה רווחים

  const password = $('#password').value; // מביא password

  try {

    if (mode === "signup") { // אם מצב signup

      const name = $('#name').value.trim(); // מביא שם

      const pass2 = $('#password2').value; // מביא אימות סיסמה

      if (!name) return showError("Please enter your full name."); // אם אין שם

      if (password.length < 6) return showError("Password must be at least 6 characters."); // אם הסיסמה קצרה

      if (password !== pass2) return showError("Passwords do not match."); // אם הסיסמאות לא תואמות

      const userCred = await createUserWithEmailAndPassword(auth, email, password); // יוצר משתמש חדש

      await updateProfile(userCred.user, { displayName: name }); // מעדכן displayName

      window.location.href = "myPet.html"; // מעבר לעמוד myPet

      return; // יציאה מהפונקציה
    }

    // LOGIN 

    await signInWithEmailAndPassword(auth, email, password); // התחברות משתמש

    window.location.href = "myPet.html"; // מעבר לעמוד myPet

  } catch (error) { // אם יש שגיאה

    let message = "An unknown error occurred."; // הודעת ברירת מחדל

    switch (error.code) { // בודק סוג שגיאה

      case "auth/invalid-email": // אימייל לא תקין

        message = "Invalid email address format.";

        break;

      case "auth/user-not-found": // משתמש לא קיים

      case "auth/wrong-password": // סיסמה שגויה

        message = "Incorrect email or password.";

        break;

      case "auth/email-already-in-use": // אימייל כבר קיים

        message = "This email is already registered.";

        break;

      case "auth/weak-password": // סיסמה חלשה

        message = "Password is too weak. Choose a stronger one.";

        break;

      default: // ברירת מחדל

        console.error(error); // מדפיס שגיאה לקונסול

        message = "Login failed. Please check your credentials."; // הודעת שגיאה כללית
    }

    showError(message); // מציג שגיאה
  }
});