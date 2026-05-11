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
const header = document.querySelector('.site-header'); // תופס את אלמנט ה-header מהעמוד
const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8); // מוסיף או מסיר class בשם scrolled לפי מיקום הגלילה
onScroll(); // מפעיל את הפונקציה פעם אחת כשהעמוד נטען
window.addEventListener('scroll', onScroll); // מאזין לגלילה ומפעיל את onScroll

// לוגיקת Reveal
const io = new IntersectionObserver((entries)=>{ // יוצר IntersectionObserver שמזהה כניסת אלמנטים למסך
  entries.forEach(e=>{ // עובר על כל האלמנטים
    if(e.isIntersecting){ // אם האלמנט נכנס למסך
      e.target.classList.add('show'); // מוסיף class בשם show
      io.unobserve(e.target); // מפסיק להאזין לאלמנט
    }
  });
}, { threshold: .12 }); // threshold קובע כמה מהאלמנט צריך להיות גלוי
document.querySelectorAll('.reveal').forEach(el=>io.observe(el)); // מחבר את כל אלמנטי reveal ל-observer

// לוגיקת Parallax
const hero = document.querySelector('.hero'); // תופס את אזור ה-hero
const heroBg = document.querySelector('.hero__bg'); // תופס את רקע ה-hero
const heroContent = document.querySelector('.hero__content'); // תופס את תוכן ה-hero

const parallax = () => { // פונקציה לאפקט parallax
  const y = window.scrollY || 0; // שומר את מיקום הגלילה
  if(hero){ // אם hero קיים
    heroContent.style.transform = `translateY(${Math.min(y*0.15, 30)}px)`; // מזיז את התוכן לפי הגלילה
    heroBg.style.backgroundPosition = `50% ${Math.max(35 - y*0.03, 20)}%`; // משנה את מיקום הרקע
  }
};

parallax(); // מפעיל פעם אחת בטעינת הדף
window.addEventListener('scroll', parallax, { passive:true }); // מפעיל parallax בזמן גלילה