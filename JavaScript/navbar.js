//navbar.js
import { app, auth } from "./firebaseconfig.js"; // ייבוא מ-firebaseconfig.js
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const navLinks = document.getElementById("navLinks");
const greeting = document.getElementById("userGreeting");

//הדגשה
function highlightActiveLink() {
  const currentPath = window.location.pathname.split("/").pop();
  
  // הסר את class .nav-active מכל הקישורים
  document.querySelectorAll('#navLinks .nav-link').forEach(link => {
    link.classList.remove('nav-active');
  });

  // מצא את הקישור שתואם לדף הנוכחי והדלק אותו
  const activeLink = document.querySelector(`#navLinks a[data-page="${currentPath}"]`);
  if (activeLink) {
    activeLink.classList.add('nav-active');
  }
}


// מצב ברירת מחדל – משתמש לא מחובר
navLinks.innerHTML = `
  <li class="nav-item"><a class="nav-link" data-page="home.html" href="home.html"><i class="fas fa-home"></i> Home</a></li>
  <li class="nav-item"><a class="nav-link" href="login.html">My Gate</a></li>
  <li class="nav-item"><a class="nav-link" href="login.html">My Pet</a></li>
  <li class="nav-item"><a class="nav-link" data-page="about.html" href="about.html">About</a></li>
  <li class="nav-item"><a class="nav-link" data-page="login.html" href="login.html"><i class="fas fa-user"></i> Login</a></li>
`;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    greeting.textContent = "";
    highlightActiveLink();
    return;
  }

  const name = user.displayName || user.email.split("@")[0];
  greeting.textContent = `Hello ${name}`;
  greeting.style.display = "inline-block";

  // מצב מחובר – קישורים מלאים
  navLinks.innerHTML = `
    <li class="nav-item"><a class="nav-link" data-page="home.html" href="home.html"><i class="fas fa-home"></i> Home</a></li>
    <li class="nav-item"><a class="nav-link" data-page="myGate.html" href="myGate.html">My Gate</a></li>
    <li class="nav-item"><a class="nav-link" data-page="myPet.html" href="myPet.html">My Pet</a></li>
    <li class="nav-item"><a class="nav-link" data-page="about.html" href="about.html">About</a></li>
    <li class="nav-item"><a id="logoutBtn" class="nav-link" href="#"><i class="fas fa-sign-out-alt"></i> Logout</a></li>
  `;

  document.getElementById("logoutBtn").onclick = async () => {
    await signOut(auth);
    window.location.href = "login.html";
  };

  highlightActiveLink();
});