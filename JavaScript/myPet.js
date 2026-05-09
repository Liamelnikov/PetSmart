import { auth, db } from "./firebaseconfig.js";
import { ref, get, update, onValue } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

/* =====================
   ELEMENTS
===================== */
const petsGrid = document.getElementById("petsGrid");
const emptyState = document.getElementById("emptyState");
const activeSection = document.getElementById("activePetSection");

const activePetAvatar = document.getElementById("activePetAvatar");
const activePetName = document.getElementById("activePetName");
const activePetAge = document.getElementById("activePetAge");
const activePetSpecies = document.getElementById("activePetSpecies");
const collarStatusText = document.getElementById("collarStatusText");

const petLogTable = document.getElementById("petLogTable");
const noLogsText = document.getElementById("noLogsText");
const seeMoreLogsBtn = document.getElementById("seeMoreLogsBtn");

const addPetForm = document.getElementById("addPetForm");
const addPetModal = document.getElementById("addPetModal");

const deletePetBtn = document.getElementById("deletePetBtn");
const changeCollarBtn = document.getElementById("changeCollarBtn");

// MODAL
const changeCollarModal = document.getElementById("changeCollarModal");
const petSelect = document.getElementById("petSelect");
const collarSelect = document.getElementById("collarSelect");
const confirmChangeCollar = document.getElementById("confirmChangeCollar");

// RULES
const rulesList = document.getElementById("rulesList");
const addRuleBtn = document.getElementById("addRuleBtn");
const saveAccessBtn = document.getElementById("saveAccessBtn");

const ruleEditor = document.getElementById("ruleEditor");
const ruleEditorTitle = document.getElementById("ruleEditorTitle");

const editorAllDay = document.getElementById("editorAllDay");
const editorFrom = document.getElementById("editorFrom");
const editorTo = document.getElementById("editorTo");

const saveRuleBtn = document.getElementById("saveRuleBtn");
const cancelRuleBtn = document.getElementById("cancelRuleBtn");

/* =====================
   STATE
===================== */
let currentUser = null;
let pets = {};
let collars = {};
let activePetId = null;

let currentRules = [];
let editingRuleIndex = null;
let showAllLogs = false;

/* =====================
   AUTH
===================== */
onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "login.html";
  currentUser = user;

  await loadPets();
  listenToCollars();
});

/* =====================
   COLLARS
===================== */
function listenToCollars() {
  onValue(ref(db, "collars"), snap => {
    collars = snap.val() || {};
    renderPetsGrid();
    if (activePetId) updateActivePetStatus();
  });
}

/* =====================
   LOAD PETS
===================== */
async function loadPets() {
  const snap = await get(ref(db, `users/${currentUser.uid}/pets`));
  pets = snap.exists() ? snap.val() : {};
  renderPetsGrid();
}

/* =====================
   STATUS
===================== */
function getPetStatus(pet) {
  if (!pet.collarId) return { text: "NONE", class: "text-muted" };

  const collar = collars[pet.collarId];
  if (!collar) return { text: "Not connected", class: "text-danger" };

  return collar.allowedNow
    ? { text: "Allowed now", class: "text-success" }
    : { text: "Blocked", class: "text-danger" };
}

/* =====================
   GRID
===================== */
function renderPetsGrid() {
  petsGrid.innerHTML = "";

  const ids = Object.keys(pets);

  if (!ids.length) {
    emptyState.classList.remove("d-none");
    activeSection.classList.add("d-none");
    return;
  }

  emptyState.classList.add("d-none");

  ids.forEach(id => {
    const p = pets[id];
    const status = getPetStatus(p);

    const col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-md-4";

    col.innerHTML = `
      <div class="card pet-card h-100">
        <div class="pet-card-img">
          <img src="${p.photo}">
        </div>
        <div class="pet-card-body">
          <h5>${p.name}</h5>
          <small>${p.species}</small>

          <small>${p.collarId ? "Collar connected" : "No collar"}</small>

          <small class="${status.class}">
            ${status.text}
          </small>

           <button class="btn pet-btn btn-sm mt-auto">
            View dashboard
          </button>
        </div>
      </div>
    `;

    col.querySelector("button").onclick = () => setActivePet(id);
    petsGrid.appendChild(col);
  });
}

function isAllowedNow(rules) {

  if (!rules || !rules.length) return true;

  const now = new Date();

  const dayMap = ["sun","mon","tue","wed","thu","fri","sat"];
  const currentDay = dayMap[now.getDay()];
  const currentTime = now.toTimeString().slice(0,5);

  const todayRules = rules.filter(rule =>
    rule.days.includes(currentDay)
  );

  if (todayRules.length === 0) return true;

  return todayRules.some(rule => {

    if (rule.allDay) return true;

    return currentTime >= rule.from && currentTime <= rule.to;
  });
}

async function updateAllowedNowForPet(id) {

  const pet = pets[id];
  if (!pet || !pet.collarId) return;

  const allowed = isAllowedNow(pet.accessPolicy?.rules || []);

  await update(ref(db), {
    [`collars/${pet.collarId}/allowedNow`]: allowed
  });

  console.log("allowedNow updated:", allowed);
}


setInterval(() => {

  Object.keys(pets).forEach(id => {
    updateAllowedNowForPet(id);
  });

}, 30000);

/* =====================
   ACTIVE PET
===================== */
function setActivePet(id) {
  activePetId = id;
  activeSection.classList.remove("d-none");

  const p = pets[id];

  activePetAvatar.src = p.photo;
  activePetName.textContent = p.name;
  activePetAge.textContent = p.age || "-";
  activePetSpecies.textContent = p.species;

  currentRules = p.accessPolicy?.rules || [];
  renderRulesList();

  updateActivePetStatus();
  loadPetLogs(id);
  updateAllowedNowForPet(id);
}

/* =====================
   STATUS UI
===================== */
function updateActivePetStatus() {
  const p = pets[activePetId];
  const status = getPetStatus(p);

  collarStatusText.innerHTML = `
    ${p.collarId ? "Connected" : "NONE"}<br>
    <strong class="${status.class}">${status.text}</strong>
  `;
}

/* =====================
   CHANGE COLLAR
===================== */
changeCollarBtn.onclick = () => {

  if (!activePetId) return alert("Select pet");

  petSelect.innerHTML = "";
  Object.entries(pets).forEach(([id, p]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = p.name;
    petSelect.appendChild(opt);
  });

  petSelect.value = activePetId;

  collarSelect.innerHTML = `<option value="">No collar</option>`;
  Object.entries(collars).forEach(([id, c]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = c.collarName || id;
    collarSelect.appendChild(opt);
  });

  collarSelect.value = pets[activePetId].collarId || "";

  new bootstrap.Modal(changeCollarModal).show();
};

confirmChangeCollar.onclick = async () => {

  const petId = petSelect.value;
  const collarId = collarSelect.value || null;
  const pet = pets[petId];

  const updates = {};

  //   להסיר את הקולר מכל החיות
  Object.entries(pets).forEach(([id, p]) => {
    if (p.collarId === collarId) {
      updates[`users/${currentUser.uid}/pets/${id}/collarId`] = null;
    }
  });

  //   להסיר שיוך קודם של החיה עצמה
  if (pet.collarId) {
    updates[`collars/${pet.collarId}/petId`] = null;
    updates[`collars/${pet.collarId}/petName`] = null;
  }

  //   לשייך קולר חדש
  if (collarId) {
    updates[`users/${currentUser.uid}/pets/${petId}/collarId`] = collarId;
    updates[`collars/${collarId}/petId`] = petId;
    updates[`collars/${collarId}/petName`] = pet.name;
  } else {
    updates[`users/${currentUser.uid}/pets/${petId}/collarId`] = null;
  }

  await update(ref(db), updates);

  bootstrap.Modal.getInstance(changeCollarModal).hide();
  await loadPets();
};

/* =====================
   DELETE
===================== */
deletePetBtn.onclick = async () => {

  if (!activePetId) return;

  const updates = {};
  updates[`users/${currentUser.uid}/pets/${activePetId}`] = null;

  await update(ref(db), updates);

  await loadPets();
  activeSection.classList.add("d-none");
};

/* =====================
   RULES
===================== */
addRuleBtn.onclick = () => openRuleEditor();

function openRuleEditor(rule = null, index = null) {
  ruleEditor.classList.remove("d-none");
  editingRuleIndex = index;

  document.querySelectorAll(".day-cb").forEach(cb => {
    cb.checked = rule?.days?.includes(cb.value) || false;
  });

  editorAllDay.checked = rule?.allDay || false;
  editorFrom.value = rule?.from || "08:00";
  editorTo.value = rule?.to || "17:00";
}

saveRuleBtn.onclick = () => {

  const days = [...document.querySelectorAll(".day-cb:checked")]
    .map(cb => cb.value);

  if (!days.length) return alert("בחרי יום");

  const rule = {
    days,
    allDay: editorAllDay.checked,
    from: editorFrom.value,
    to: editorTo.value
  };

  if (editingRuleIndex !== null)
    currentRules[editingRuleIndex] = rule;
  else
    currentRules.push(rule);

  ruleEditor.classList.add("d-none");
  renderRulesList();
};

cancelRuleBtn.onclick = () => {
  ruleEditor.classList.add("d-none");
};

function renderRulesList() {
  rulesList.innerHTML = "";

  currentRules.forEach((r, i) => {

    const div = document.createElement("div");
    div.innerHTML = `
      ${r.days.join(", ")} ${r.allDay ? "All day" : `${r.from}-${r.to}`}
      <button data-i="${i}">X</button>
    `;

    div.querySelector("button").onclick = () => {
      currentRules.splice(i, 1);
      renderRulesList();
    };

    rulesList.appendChild(div);
  });
}

saveAccessBtn.onclick = async () => {

  if (!activePetId) return;

  await update(ref(db), {
    [`users/${currentUser.uid}/pets/${activePetId}/accessPolicy`]: {
      rules: currentRules
    }
  });

  alert("Saved");
};

/* =====================
   HOURS
===================== */
function fillHours(select) {
  for (let i = 0; i < 24; i++) {
    const h = `${String(i).padStart(2, "0")}:00`;
    select.innerHTML += `<option>${h}</option>`;
  }
}
fillHours(editorFrom);
fillHours(editorTo);

/* =====================
   LOGS
===================== */
async function loadPetLogs(id) {
  const snap = await get(ref(db, "gate/log"));
  petLogTable.innerHTML = "";

  if (!snap.exists()) return;

  const logs = [];

  snap.forEach(c => {
    const e = c.val();
    if (e.petId === id) {
      logs.push({
        ...e,
        _ts: typeof e.timestamp === "number" ? e.timestamp : 0
      });
    }
  });
 
  logs.sort((a, b) => b._ts - a._ts); //  מיון מהחדש לישן
  const limit = showAllLogs ? logs.length : 5;//  הגבלת תצוגה

  logs.slice(0, limit).forEach(e => {
    const d = new Date(e._ts);

    petLogTable.innerHTML += `
      <tr>
        <td>${d.toLocaleDateString()}</td>
        <td>${d.toLocaleTimeString()}</td>
      </tr>`;
  });
  
  if (logs.length <= 5) { //  ניהול כפתור
    seeMoreLogsBtn.style.display = "none";
  } else {
    seeMoreLogsBtn.style.display = "block";
  }
}

seeMoreLogsBtn.onclick = () => {
  showAllLogs = !showAllLogs;

  seeMoreLogsBtn.textContent = showAllLogs
    ? "Show less"
    : "See more";

  loadPetLogs(activePetId);
};

/* =====================
   ADD PET
===================== */
addPetForm.onsubmit = async e => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(addPetForm));
  const reader = new FileReader();

  reader.onload = async () => {

    const id = Date.now().toString();

    await update(ref(db), {
      [`users/${currentUser.uid}/pets/${id}`]: {
        name: data.name,
        species: data.species,
        age: data.age,
        photo: reader.result,
        collarId: null,
        accessPolicy: { rules: [] }
      }
    });

    bootstrap.Modal.getInstance(addPetModal).hide();
    addPetForm.reset();
    await loadPets();
  };

  reader.readAsDataURL(addPetForm.photo.files[0]);
};