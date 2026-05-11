import { auth, db } from "./firebaseconfig.js"; // מייבא את auth ו-db מתוך קובץ ההגדרות של Firebase
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js"; // מייבא פונקציות של Firebase Database
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"; // מייבא מאזין להתחברות משתמש

console.log("myGate.js loaded"); // מדפיס לקונסול שהקובץ נטען


// =======================
// אלמנטים 
// =======================

const tableBody = document.getElementById("accessLog"); // tbody של טבלת הלוגים
const statusEl  = document.getElementById("gateStatus"); // אלמנט טקסט של סטטוס הדלת
const doorIcon  = document.getElementById("doorIcon"); // אייקון הדלת
const toggleBtn = document.getElementById("toggleButton"); // כפתור פתיחה/סגירה
const seeMoreLogsBtn = document.getElementById("expandLogBtn"); // כפתור "ראה עוד"
let showAllLogs = false; // האם להציג את כל הלוגים


if (!toggleBtn) { // אם הכפתור לא נמצא
  console.error("toggleButton not found in DOM"); // מדפיס שגיאה לקונסול
}


let currentUser = null; // המשתמש המחובר כרגע
let currentGateStatus = "closed"; // מצב הדלת הנוכחי


// =======================
// עדכון UI
// =======================

function updateGateUI(status) { // פונקציה שמעדכנת את ה-UI של הדלת לפי הסטטוס

  const isOpen = status === "open"; // בודק האם הדלת פתוחה

  doorIcon.classList.remove( // מסיר classes ישנים מהאייקון
    "fa-door-open",
    "fa-door-closed",
    "fa-plug-circle-xmark",
    "open",
    "closed"
  );

  if (status === "offline") { // אם הדלת offline

    statusEl.textContent = "Offline"; // משנה טקסט ל-Offline
    statusEl.classList.remove("text-success"); // מסיר צבע ירוק
    statusEl.classList.add("text-danger"); // מוסיף צבע אדום
    doorIcon.classList.add("fa-plug-circle-xmark"); // מוסיף אייקון offline
    toggleBtn.disabled = true; // מבטל את הכפתור
    toggleBtn.textContent = "Offline"; // משנה טקסט כפתור

    return; // יוצא מהפונקציה
  }

  if (isOpen) { // אם הדלת פתוחה

    statusEl.textContent = "Open"; // משנה טקסט ל-Open
    statusEl.classList.remove("text-danger"); // מסיר אדום
    statusEl.classList.add("text-success"); // מוסיף ירוק
    doorIcon.classList.add("fa-door-open", "open"); // מוסיף אייקון דלת פתוחה
    toggleBtn.textContent = "Close Gate"; // משנה טקסט כפתור

  } else { // אם הדלת סגורה

    statusEl.textContent = "Closed"; // משנה טקסט ל-Closed
    statusEl.classList.remove("text-success"); // מסיר ירוק
    statusEl.classList.add("text-danger"); // מוסיף אדום
    doorIcon.classList.add("fa-door-closed", "closed"); // מוסיף אייקון דלת סגורה
    toggleBtn.textContent = "Open Gate"; // משנה טקסט כפתור
  }

  toggleBtn.disabled = false; // מאפשר את הכפתור
}


// =======================
// מאזין לסטטוס
// =======================

function loadGateStatus() { // פונקציה שמאזינה לסטטוס הדלת ב-Firebase

  const stateRef = ref(db, "gate/state"); // יוצר reference למסלול gate/state

  onValue(stateRef, (snapshot) => { // מאזין לשינויים בזמן אמת

    const data = snapshot.val() || {}; // מביא נתונים או אובייקט ריק
    const status = data.status || "closed"; // סטטוס הדלת
    const lastSeen = data.lastSeen; // זמן lastSeen
    const now = Date.now(); // הזמן הנוכחי
    const diff = lastSeen ? now - lastSeen : Infinity; // כמה זמן עבר מאז lastSeen

    if (!lastSeen || diff > 40000) { // אם עברו יותר מ-40 שניות

      updateGateUI("offline"); // מציג offline

      return; // יוצא מהפונקציה
    }

    currentGateStatus = status; // שומר את מצב הדלת
    updateGateUI(status); // מעדכן UI
  });
}


// =======================
// שליחת פקודה
// =======================

async function sendToggleCommand() { // פונקציה ששולחת פקודת OPEN/CLOSE

  if (!currentUser) return; // אם אין משתמש יוצא

  toggleBtn.disabled = true; // מבטל זמנית את הכפתור

  try { // התחלת try

    const commandRef = ref(db, "gate/command"); // reference למסלול פקודות
    const cmd = currentGateStatus === "open" ? "CLOSE" : "OPEN"; // קובע איזו פקודה לשלוח

    await set(commandRef, { // שומר את הפקודה ב-Firebase

      action: cmd, // סוג הפקודה

      ts: Date.now() // timestamp
    });

    await set(ref(db, "gate/lastOpener"), { // שומר מי פתח

      type: "app", // מקור הפתיחה

      name: "ME" // שם המשתמש
    });

  } catch (error) { // אם יש שגיאה
    console.error(error); // מדפיס שגיאה
  }

  toggleBtn.disabled = false; // מחזיר את הכפתור לפעיל
}


// =======================
//  לוגים 
// =======================

function loadAccessLog() { // פונקציה שטוענת את הלוגים

  const logRef = ref(db, "gate/log"); // reference למסלול הלוגים

  onValue(logRef, (snapshot) => { // מאזין לשינויים בזמן אמת

    tableBody.innerHTML = ""; // מנקה את הטבלה

    if (!snapshot.exists()) { // אם אין לוגים

      tableBody.innerHTML = ` // מציג הודעת empty
        <tr>
          <td colspan="4" class="text-muted text-center py-3">
            No entries yet…
          </td>
        </tr>`;

      return; // יוצא מהפונקציה
    }

    const entries = []; // מערך הלוגים

    snapshot.forEach((child) => { // עובר על כל הלוגים

      const entry = child.val(); // מביא את הרשומה
      let ts = typeof entry.timestamp === "number" ? entry.timestamp : 0; // timestamp בטוח

      entries.push({ // מוסיף למערך

        ...entry, // מעתיק את כל השדות

        _ts: ts // timestamp פנימי
      });
    })

    entries.sort((a, b) => b._ts - a._ts); // ממיין מהחדש לישן
    const limit = showAllLogs ? entries.length : 10; // מגביל כמות לוגים

    entries.slice(0, limit).forEach((entry, index) => { // עובר על הלוגים לתצוגה

      const date = entry._ts // יוצר תאריך קריא
        ? new Date(entry._ts).toLocaleString()
        : "N/A";

      tableBody.innerHTML += ` // מוסיף שורה לטבלה
        <tr>
          <td>${index + 1}</td>
          <td>${entry.petName || entry.source || "System"}</td>
          <td>${entry.source === "app" ? "Manual Open" : "Collar Open"}</td>
          <td>${date}</td>
        </tr>`;
    });

    if (entries.length <= 10) { // אם יש עד 10 לוגים
      seeMoreLogsBtn.classList.add("d-none"); // מסתיר כפתור
    } 
    else {
      seeMoreLogsBtn.classList.remove("d-none"); // מציג כפתור
    }
  });
}


// =======================
//  כפתור
// =======================

seeMoreLogsBtn.onclick = () => { // לחיצה על כפתור ראה עוד

  showAllLogs = !showAllLogs; // הופך true/false

  seeMoreLogsBtn.textContent = showAllLogs // משנה טקסט כפתור
    ? "Show less"
    : "See more";

  loadAccessLog(); // טוען מחדש את הלוגים
};


// =======================
// Auth
// =======================

onAuthStateChanged(auth, (user) => { // מאזין להתחברות משתמש

  if (!user) { // אם אין משתמש

    window.location.href = "login.html"; // מעבר למסך התחברות

    return; // יוצא
  }
  currentUser = user; // שומר את המשתמש
  loadGateStatus(); // טוען סטטוס דלת
  loadAccessLog(); // טוען לוגים
  toggleBtn.addEventListener("click", sendToggleCommand); // מאזין ללחיצה על הכפתור
});