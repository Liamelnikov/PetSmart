

/*****************************************************************************************
 * IMPORTS
 * ---------------------------------------------------------------------------------------
 * כאן אנחנו מייבאים מודולים (Modules) מקבצים וספריות חיצוניות.
 *
 * JavaScript מודרני עובד בצורה מודולרית:
 * במקום שכל הקוד יהיה בקובץ אחד ענק,
 * מפצלים אותו לקבצים נפרדים לפי אחריות.
 *
 * import מאפשר "לשאוב" פונקציות/משתנים/אובייקטים
 * מתוך קבצים אחרים.
 *****************************************************************************************/

// auth = אובייקט האימות של 
// db   = חיבור למסד הנתונים 
import { auth, db } from "./firebaseconfig.js";


// ref     = יוצר Reference (מצביע למסלול ב-Database)
// get     = קורא נתונים פעם אחת
// update  = מעדכן נתונים
// onValue = מאזין לשינויים בזמן אמת
import { ref, get, update, onValue } from"https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";


// onAuthStateChanged = מאזין להתחברות והתנתקות משתמשים
import { onAuthStateChanged } from"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";


/* =========================================================================================
   ELEMENTS
   ========================================================================================= */


const petsGrid = document.getElementById("petsGrid");// אזור כרטיסיות החיות

const emptyState = document.getElementById("emptyState");// הודעת "אין חיות"

const activeSection = document.getElementById("activePetSection");// אזור החיה הפעילה

const activePetAvatar = document.getElementById("activePetAvatar");// תמונת החיה

const activePetName = document.getElementById("activePetName");// שם החיה

const activePetAge = document.getElementById("activePetAge");// גיל החיה

const activePetSpecies = document.getElementById("activePetSpecies");// סוג החיה

const collarStatusText = document.getElementById("collarStatusText");// טקסט סטטוס הקולר

const petLogTable = document.getElementById("petLogTable");// גוף טבלת הלוגים

const noLogsText = document.getElementById("noLogsText");// טקסט "אין לוגים"

const seeMoreLogsBtn = document.getElementById("seeMoreLogsBtn");// כפתור "ראה עוד"

const addPetForm = document.getElementById("addPetForm");// טופס הוספת חיה

const addPetModal = document.getElementById("addPetModal");// חלון המודל של הוספת חיה

const deletePetBtn = document.getElementById("deletePetBtn");

const changeCollarBtn = document.getElementById("changeCollarBtn");// כפתור שינוי קולר



/* =========================================================================================
   MODAL
========================================================================================= */


const changeCollarModal = document.getElementById("changeCollarModal");// חלון המודל של החלפת קולר

const petSelect = document.getElementById("petSelect");// select של חיות

const collarSelect = document.getElementById("collarSelect");// select של קולרים

const confirmChangeCollar = document.getElementById("confirmChangeCollar");// כפתור אישור החלפה


/* =========================================================================================
   RULES
========================================================================================= */


const rulesList = document.getElementById("rulesList");// רשימת חוקי גישה

const addRuleBtn = document.getElementById("addRuleBtn");// כפתור הוספת חוק

const saveAccessBtn = document.getElementById("saveAccessBtn");// כפתור שמירת חוקי גישה

const ruleEditor = document.getElementById("ruleEditor");// אזור עריכת חוק

const ruleEditorTitle = document.getElementById("ruleEditorTitle");// כותרת אזור עריכת חוק

const editorAllDay = document.getElementById("editorAllDay");// checkbox של "כל היום"

const editorFrom = document.getElementById("editorFrom");// select של שעת התחלה

const editorTo = document.getElementById("editorTo");// select של שעת סיום

const saveRuleBtn = document.getElementById("saveRuleBtn");// כפתור שמירת חוק

const cancelRuleBtn = document.getElementById("cancelRuleBtn");// כפתור ביטול



let currentUser = null;// המשתמש המחובר כרגע
let pets = {};// אובייקט של כל החיות
let collars = {};// אובייקט של כל הקולרים
let activePetId = null;// id של החיה הפעילה
let currentRules = [];// מערך חוקי הגישה הנוכחיים
let editingRuleIndex = null;// אינדקס החוק שנערך כרגע
let showAllLogs = false;// האם להציג את כל הלוגים


/* =========================================================================================
   AUTH
   =========================================================================================
   onAuthStateChanged()

   פונקציה שמאזינה למצב ההתחברות של המשתמש.

   זה Listener שחי כל הזמן ברקע.

   בכל פעם שיש שינוי במשתמש:
   - התחברות
   - התנתקות
   - רענון דף
   - שחזור Session

   Firebase מפעיל את הפונקציה מחדש.
========================================================================================= */

onAuthStateChanged(auth, async user => {

  // אם אין משתמש מחובר
  if (!user)
    return location.href = "login.html";// מעביר למסך התחברות
    currentUser = user; // שומר את המשתמש במשתנה גלובלי
    await loadPets();// טוען את החיות מה-Database
    listenToCollars();// מפעיל האזנה לקולרים בזמן אמת
});


/* =========================================================================================
   COLLARS
   =========================================================================================
   listenToCollars()

   מאזין למסלול collars ב-Firebase.

   onValue() = Real-Time Listener

   כלומר:
   Firebase דוחף עדכונים אוטומטית בכל פעם שמשהו משתנה.

   אין צורך לעשות refresh.
========================================================================================= */

function listenToCollars() {

  // יוצר מאזין למסלול collars
  onValue(ref(db, "collars"), snap => {
    // snap = Snapshot
    // אובייקט שמייצג את הנתונים שהתקבלו
    collars = snap.val() || {};// שומר את הנתונים או אובייקט ריק
    renderPetsGrid();// מצייר מחדש את גריד החיות

    // אם יש חיה פעילה
    if (activePetId)
      updateActivePetStatus();// מעדכן את הסטטוס שלה
  });
}


/* =========================================================================================
   LOAD PETS
========================================================================================= */

async function loadPets() {
  const snap = await get(ref(db, `users/${currentUser.uid}/pets`));// קורא את החיות של המשתמש

  // אם קיימים נתונים - משתמש בהם
  // אחרת - אובייקט ריק
  pets = snap.exists() ? snap.val() : {};
  renderPetsGrid();// מרנדר את הגריד
}


/* =========================================================================================
   STATUS
========================================================================================= */

function getPetStatus(pet) {

  // אם אין קולר
  if (!pet.collarId)

    return {
      text: "NONE",
      class: "text-muted"
    };
  
    const collar = collars[pet.collarId];// מביא את הקולר לפי id


    // אם הקולר לא נמצא
    if (!collar)
      return {
        text: "Not connected",
        class: "text-danger"
      };


      // בודק האם הקולר מורשה עכשיו
      return collar.allowedNow

      ? {
          text: "Allowed now",
          class: "text-success"
        }

      : {
          text: "Blocked",
          class: "text-danger"
        };
  }


/* =========================================================================================
   GRID
========================================================================================= */

function renderPetsGrid() {

  petsGrid.innerHTML = "";// מנקה את ה-grid
  const ids = Object.keys(pets);// מחלץ את כל ה-id's של החיות

  // אם אין חיות
  if (!ids.length) {
    emptyState.classList.remove("d-none");// מציג empty state
    activeSection.classList.add("d-none");// מסתיר אזור חיה פעילה
    return;
  }
  
  emptyState.classList.add("d-none");// מסתיר הודעת empty

  // עובר על כל החיות
  ids.forEach(id => {

    const p = pets[id];// החיה הנוכחית
    const status = getPetStatus(p);// סטטוס החיה    
    const col = document.createElement("div");// יוצר div חדש
    col.className = "col-12 col-sm-6 col-md-4";// מוסיף class של Bootstrap

    // בונה HTML דינמי
    col.innerHTML = `
      <div class="card pet-card h-100">

        <div class="pet-card-img">
          <img src="${p.photo}">
        </div>

        <div class="pet-card-body">

          <h5>${p.name}</h5>

          <small>${p.species}</small>

          <small>
            ${p.collarId ? "Collar connected" : "No collar"}
          </small>

          <small class="${status.class}">
            ${status.text}
          </small>

          <button class="btn pet-btn btn-sm mt-auto">
            View dashboard
          </button>

        </div>
      </div>
    `;

    col.querySelector("button").onclick = () => setActivePet(id);// מאזין ללחיצה על הכפתור
    petsGrid.appendChild(col);// מוסיף את הכרטיס לגריד
  });
}


/* =========================================================================================
   ACCESS RULE ENGINE
========================================================================================= */

function isAllowedNow(rules) {

  // אם אין חוקים
  if (!rules || !rules.length)
    
    return true;// ברירת מחדל = מותר

  const now = new Date();// תאריך ושעה נוכחיים
  const dayMap = ["sun","mon","tue","wed","thu","fri","sat"];// מיפוי ימים
  const currentDay = dayMap[now.getDay()];// היום הנוכחי 
  const currentTime = now.toTimeString().slice(0,5);// שעה נוכחית בפורמט HH:MM
  // מסנן רק חוקים של היום
  const todayRules = rules.filter(rule =>
    rule.days.includes(currentDay)
  );

  // אם אין חוקים להיום
  if (todayRules.length === 0)

    return true;

    // some() מחזיר true אם לפחות איבר אחד עומד בתנאי
  return todayRules.some(rule => {

    // אם החוק הוא כל היום
    if (rule.allDay)

      return true;

    return currentTime >= rule.from && currentTime <= rule.to;// בודק האם השעה הנוכחית בטווח
  });
}


/* =========================================================================================
   UPDATE ALLOWED NOW
========================================================================================= */

async function updateAllowedNowForPet(id) {

  const pet = pets[id];// מביא את החיה

  // אם אין חיה או אין קולר
  if (!pet || !pet.collarId)

    return;
  
  const allowed = isAllowedNow(pet.accessPolicy?.rules || []);// מחשב האם כרגע מותר

  // מעדכן Firebase
  await update(ref(db), {

    // computed property name
    // יוצר מפתח דינמי
    [`collars/${pet.collarId}/allowedNow`]: allowed
  });
  
  console.log("allowedNow updated:", allowed);// מדפיס לקונסול
}


/* =========================================================================================
   AUTO UPDATE TIMER
   =========================================================================================
   setInterval()

   מריץ פונקציה שוב ושוב כל X זמן.

   כאן:
   כל 30 שניות.
========================================================================================= */

setInterval(() => {

  // עובר על כל החיות
  Object.keys(pets).forEach(id => {
    updateAllowedNowForPet(id);// מעדכן allowedNow
  });

}, 30000);


/* =========================================================================================
   ACTIVE PET
========================================================================================= */

function setActivePet(id) {

  activePetId = id; // שומר את ה-id של החיה הפעילה#  
  activeSection.classList.remove("d-none");// מציג את אזור החיה הפעילה
  const p = pets[id];// החיה הנבחרת
  activePetAvatar.src = p.photo;// מעדכן תמונה
  activePetName.textContent = p.name;// מעדכן שם
  activePetAge.textContent = p.age || "-";// מעדכן גיל
  activePetSpecies.textContent = p.species;// מעדכן סוג
  
  currentRules = p.accessPolicy?.rules || [];// טוען את חוקי הגישה
  renderRulesList();// מציג את החוקים
  updateActivePetStatus();// מעדכן UI של סטטוס
  loadPetLogs(id);// טוען לוגים
  updateAllowedNowForPet(id);// מעדכן allowedNow
}


/* =========================================================================================
   STATUS UI
========================================================================================= */

function updateActivePetStatus() {

  const p = pets[activePetId];// החיה הפעילה  
  const status = getPetStatus(p);// הסטטוס שלה

  // בונה HTML דינמי
  collarStatusText.innerHTML = `
    ${p.collarId ? "Connected" : "NONE"}<br>
    <strong class="${status.class}">${status.text}</strong>
  `;
}


/* =========================================================================================
   CHANGE COLLAR
========================================================================================= */

changeCollarBtn.onclick = () => {

  // אם אין חיה פעילה
  if (!activePetId)

    return alert("Select pet");

  petSelect.innerHTML = "";// מנקה select של חיות

  // מוסיף את כל החיות לרשימה
  Object.entries(pets).forEach(([id, p]) => {

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = p.name;
    petSelect.appendChild(opt);
  });

  petSelect.value = activePetId;// בוחר את החיה הפעילה  
  collarSelect.innerHTML = `<option value="">No collar</option>`;// ברירת מחדל

  // מוסיף את כל הקולרים
  Object.entries(collars).forEach(([id, c]) => {

    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = c.collarName || id;
    collarSelect.appendChild(opt);
  });

  collarSelect.value = pets[activePetId].collarId || "";// בוחר את הקולר הקיים
  new bootstrap.Modal(changeCollarModal).show();// מציג modal של bootstrap
};


/* =========================================================================================
   CONFIRM CHANGE COLLAR
========================================================================================= */

confirmChangeCollar.onclick = async () => {

  const petId = petSelect.value;// id של החיה  
  const collarId = collarSelect.value || null;// id של הקולר
  const pet = pets[petId];// החיה

  // אובייקט updates
  // Firebase מאפשר לעדכן כמה מסלולים בבת אחת
  const updates = {};

  // להסיר את הקולר מכל חיה אחרת
  Object.entries(pets).forEach(([id, p]) => {

    if (p.collarId === collarId) {

      updates[`users/${currentUser.uid}/pets/${id}/collarId`] = null;
    }
  });

  // להסיר שיוך קודם
  if (pet.collarId) {

    updates[`collars/${pet.collarId}/petId`] = null;
    updates[`collars/${pet.collarId}/petName`] = null;
  }

  // אם יש קולר חדש
  if (collarId) {

    updates[`users/${currentUser.uid}/pets/${petId}/collarId`] = collarId;
    updates[`collars/${collarId}/petId`] = petId;
    updates[`collars/${collarId}/petName`] = pet.name;

  } 
  
  else {
    updates[`users/${currentUser.uid}/pets/${petId}/collarId`] = null;
  }

  await update(ref(db), updates);// שולח את כל העדכונים בבת אחת  
  bootstrap.Modal.getInstance(changeCollarModal).hide();// סוגר את המודל
  await loadPets(); // טוען מחדש את החיות
};


/* =========================================================================================
   DELETE PET
========================================================================================= */

deletePetBtn.onclick = async () => {

  // אם אין חיה פעילה
  if (!activePetId)
    return;

  const updates = {};// אובייקט עדכונים  
  updates[`users/${currentUser.uid}/pets/${activePetId}`] = null;// מחיקה ב-Firebase נעשית ע"י null
  await update(ref(db), updates);  // מבצע את העדכון
  await loadPets();  // טוען מחדש
  activeSection.classList.add("d-none");  // מסתיר אזור חיה פעילה
};

// לחיצה על הוספת חוק
addRuleBtn.onclick = () => openRuleEditor();


/* =========================================================================================
   OPEN RULE EDITOR
========================================================================================= */

function openRuleEditor(rule = null, index = null) {

  ruleEditor.classList.remove("d-none");  // מציג את העורך
  editingRuleIndex = index;  // שומר איזה חוק נערך

  // עובר על כל ה-checkboxes של הימים
  document.querySelectorAll(".day-cb").forEach(cb => {

    cb.checked = rule?.days?.includes(cb.value) || false;    // מסמן לפי החוק
  });

  editorAllDay.checked = rule?.allDay || false;  // האם כל היום
  editorFrom.value = rule?.from || "08:00";  // שעת התחלה
  editorTo.value = rule?.to || "17:00";  // שעת סיום
}


/* =========================================================================================
   SAVE RULE
========================================================================================= */

saveRuleBtn.onclick = () => {

  // אוסף את כל הימים המסומנים
  const days = [...document.querySelectorAll(".day-cb:checked")]

    .map(cb => cb.value);    // ממיר למערך של value

  // אם לא נבחר יום
  if (!days.length)

    return alert("בחרי יום");

  // יוצר אובייקט חוק
  const rule = {
    days,
    allDay: editorAllDay.checked,
    from: editorFrom.value,
    to: editorTo.value
  };

  // אם עורכים חוק קיים
  if (editingRuleIndex !== null)

    currentRules[editingRuleIndex] = rule;

  // אם זה חוק חדש
  else

    currentRules.push(rule);

  ruleEditor.classList.add("d-none");  // מסתיר את העורך

  renderRulesList();  // מצייר מחדש את הרשימה
};


/* =========================================================================================
   CANCEL RULE
========================================================================================= */

cancelRuleBtn.onclick = () => {

  ruleEditor.classList.add("d-none");  // מסתיר את העורך
};


/* =========================================================================================
   RENDER RULES LIST
========================================================================================= */

function renderRulesList() {

  rulesList.innerHTML = "";  // מנקה רשימה

  // עובר על כל החוקים
  currentRules.forEach((r, i) => {

    const div = document.createElement("div");    // יוצר div

    // HTML של החוק
    div.innerHTML = `
      ${r.days.join(", ")} ${r.allDay ? "All day" : `${r.from}-${r.to}`}
      <button data-i="${i}">X</button>
    `;

    // מאזין למחיקה
    div.querySelector("button").onclick = () => {

      currentRules.splice(i, 1);      // מסיר את החוק מהמערך
      renderRulesList();      // מרנדר מחדש
    };

    rulesList.appendChild(div);    // מוסיף לרשימה
  });
}


/* =========================================================================================
   SAVE ACCESS POLICY
========================================================================================= */

saveAccessBtn.onclick = async () => {

  // אם אין חיה פעילה
  if (!activePetId)

    return;

  // שומר את החוקים ב-Firebase
  await update(ref(db), {

    [`users/${currentUser.uid}/pets/${activePetId}/accessPolicy`]: {
      rules: currentRules
    }
  });
  
  alert("Saved");// הודעת הצלחה
};


/* =========================================================================================
   HOURS
========================================================================================= */

function fillHours(select) {

  // לולאה מ-0 עד 23
  for (let i = 0; i < 24; i++) {
    const h = `${String(i).padStart(2, "0")}:00`;    // יוצר שעה בפורמט HH:00
    select.innerHTML += `<option>${h}</option>`;    // מוסיף option
  }
}


// ממלא שעות לשדות
fillHours(editorFrom);
fillHours(editorTo);


/* =========================================================================================
   LOGS
========================================================================================= */

async function loadPetLogs(id) {

  const snap = await get(ref(db, "gate/log"));  // קורא את הלוגים
  petLogTable.innerHTML = "";  // מנקה טבלה

  if (!snap.exists()) return;  // אם אין לוגים

  const logs = [];  // מערך לוגים

  // עובר על כל הרשומות
  snap.forEach(c => {

    const e = c.val();

    // אם הלוג שייך לחיה הזאת
    if (e.petId === id) {

      logs.push({
        ...e,

        // timestamp בטוח
        _ts: typeof e.timestamp === "number" ? e.timestamp : 0
      });
    }
  });

  logs.sort((a, b) => b._ts - a._ts);  // ממיין מהחדש לישן

  const limit = showAllLogs ? logs.length : 5;  // מגביל תצוגה

  // מציג רק חלק מהלוגים
  logs.slice(0, limit).forEach(e => {

    const d = new Date(e._ts);    // יוצר Date

    // מוסיף שורה לטבלה
    petLogTable.innerHTML += `
      <tr>
        <td>${d.toLocaleDateString()}</td>
        <td>${d.toLocaleTimeString()}</td>
      </tr>`;
  });

  // ניהול כפתור "ראה עוד"
  if (logs.length <= 5) {
    seeMoreLogsBtn.style.display = "none";
  } 
  else {
    seeMoreLogsBtn.style.display = "block";
  }
}


/* =========================================================================================
   SEE MORE LOGS
========================================================================================= */

seeMoreLogsBtn.onclick = () => {

  showAllLogs = !showAllLogs;  // הופך true/false

  // מחליף טקסט
  seeMoreLogsBtn.textContent = showAllLogs
    ? "Show less"
    : "See more";

  loadPetLogs(activePetId);  // טוען מחדש
};


/* =========================================================================================
   ADD PET
========================================================================================= */

addPetForm.onsubmit = async e => {

  e.preventDefault();  // מונע רענון דף
  const data = Object.fromEntries(new FormData(addPetForm));  // הופך FormData לאובייקט רגיל
  const reader = new FileReader();  // FileReader קורא קבצים מהמחשב

  // מה קורה כשהקריאה מסתיימת
  reader.onload = async () => {

    const id = Date.now().toString();    // יוצר id לפי זמן

    // שומר את החיה ב-Firebase
    await update(ref(db), {

      [`users/${currentUser.uid}/pets/${id}`]: {

        name: data.name,
        species: data.species,
        age: data.age,

        // תמונה כ-base64
        photo: reader.result,

        // עדיין אין קולר
        collarId: null,
        accessPolicy: { rules: [] }        // חוקי גישה ריקים
      }
    });

    bootstrap.Modal.getInstance(addPetModal).hide();    // סוגר modal
    addPetForm.reset();   // מאפס טופס
    await loadPets();// טוען מחדש את החיות
  };
  
  reader.readAsDataURL(addPetForm.photo.files[0]);// קורא את התמונה כ-base64
};
