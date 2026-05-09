// ייבוא Firebase Auth
import { auth } from "./firebaseconfig.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";



// 1. לוגיקה של כפתור הקריאה לפעולה (CTA)
const ctaBtn = document.getElementById("ctaBtn");

if (ctaBtn) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // אם המשתמש מחובר: מפנים לדף My Pet
            ctaBtn.href = "myPet.html";
        } else {
            // אם המשתמש אינו מחובר: מפנים לדף Login
            ctaBtn.href = "login.html";
        }
    });
}

// 2. לוגיקה קיימת של אנימציה ו-Parallax
// לוגיקת Navbar
const header = document.querySelector('.site-header');
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
onScroll(); 
window.addEventListener('scroll', onScroll);

// לוגיקת Reveal
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add('show');
      io.unobserve(e.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));

// לוגיקת Parallax
const hero = document.querySelector('.hero');
const heroBg = document.querySelector('.hero__bg');
const heroContent = document.querySelector('.hero__content');
const parallax = () => {
  const y = window.scrollY || 0;
  if(hero){
    heroContent.style.transform = `translateY(${Math.min(y*0.15, 30)}px)`;
    heroBg.style.backgroundPosition = `50% ${Math.max(35 - y*0.03, 20)}%`;
  }
};
parallax(); 
window.addEventListener('scroll', parallax, { passive:true });