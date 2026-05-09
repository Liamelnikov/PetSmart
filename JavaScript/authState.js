import { getAuth, onAuthStateChanged, signOut }
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { firebaseConfig } from "./firebaseconfig.js";
import { initializeApp } 
  from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// תופס את הכפתור ב־Navbar
const loginLogoutLink = document.getElementById("loginLogoutLink");

onAuthStateChanged(auth, (user) => {
  if (user) {
    // אם מחובר — Logout
    loginLogoutLink.textContent = "Logout";
    loginLogoutLink.href = "#";
    loginLogoutLink.onclick = async () => {
      await signOut(auth);
      window.location.href = "login.html";
    };
  } else {
    // אם לא מחובר — חזרה ל־Login
    loginLogoutLink.textContent = "Login";
    loginLogoutLink.href = "login.html";
  }
});
