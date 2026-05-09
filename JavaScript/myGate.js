import { auth, db } from "./firebaseconfig.js";
import { ref, onValue, set } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

console.log("myGate.js loaded");

// =======================
// אלמנטים 
// =======================
const tableBody = document.getElementById("accessLog");
const statusEl  = document.getElementById("gateStatus");
const doorIcon  = document.getElementById("doorIcon");
const toggleBtn = document.getElementById("toggleButton");
const seeMoreLogsBtn = document.getElementById("expandLogBtn"); 

let showAllLogs = false;

if (!toggleBtn) {
  console.error("toggleButton not found in DOM");
}

let currentUser = null;
let currentGateStatus = "closed"; 

// =======================
// עדכון UI
// =======================
function updateGateUI(status) {
  const isOpen = status === "open";

  doorIcon.classList.remove(
    "fa-door-open",
    "fa-door-closed",
    "fa-plug-circle-xmark",
    "open",
    "closed"
  );

  if (status === "offline") {
    statusEl.textContent = "Offline";
    statusEl.classList.remove("text-success");
    statusEl.classList.add("text-danger");

    doorIcon.classList.add("fa-plug-circle-xmark");

    toggleBtn.disabled = true;
    toggleBtn.textContent = "Offline";
    return;
  }

  if (isOpen) {
    statusEl.textContent = "Open";
    statusEl.classList.remove("text-danger");
    statusEl.classList.add("text-success");

    doorIcon.classList.add("fa-door-open", "open");
    toggleBtn.textContent = "Close Gate";
  } else {
    statusEl.textContent = "Closed";
    statusEl.classList.remove("text-success");
    statusEl.classList.add("text-danger");

    doorIcon.classList.add("fa-door-closed", "closed");
    toggleBtn.textContent = "Open Gate";
  }

  toggleBtn.disabled = false;
}

// =======================
// מאזין לסטטוס
// =======================
function loadGateStatus() {
  const stateRef = ref(db, "gate/state");

  onValue(stateRef, (snapshot) => {
    const data = snapshot.val() || {};

    const status = data.status || "closed";
    const lastSeen = data.lastSeen;

    const now = Date.now();
    const diff = lastSeen ? now - lastSeen : Infinity;

    if (!lastSeen || diff > 40000) {
      updateGateUI("offline");
      return;
    }

    currentGateStatus = status;
    updateGateUI(status);
  });
}

// =======================
// שליחת פקודה
// =======================
async function sendToggleCommand() {

  if (!currentUser) return;

  toggleBtn.disabled = true;

  try {
    const commandRef = ref(db, "gate/command");

    const cmd = currentGateStatus === "open" ? "CLOSE" : "OPEN";

    await set(commandRef, {
      action: cmd,
      ts: Date.now()
    });

    await set(ref(db, "gate/lastOpener"), {
      type: "app",
      name: "ME"
    });

  } catch (error) {
    console.error(error);
  }

  toggleBtn.disabled = false;
}

// =======================
//  לוגים 
// =======================
function loadAccessLog() {
  const logRef = ref(db, "gate/log");

  onValue(logRef, (snapshot) => {
    tableBody.innerHTML = "";

    if (!snapshot.exists()) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-muted text-center py-3">
            No entries yet…
          </td>
        </tr>`;
      return;
    }

    const entries = [];

    snapshot.forEach((child) => {
      const entry = child.val();
      let ts = typeof entry.timestamp === "number" ? entry.timestamp : 0;

      entries.push({
        ...entry,
        _ts: ts
      });
    })
    entries.sort((a, b) => b._ts - a._ts);

    const limit = showAllLogs ? entries.length : 10;

    entries.slice(0, limit).forEach((entry, index) => {

      const date = entry._ts
        ? new Date(entry._ts).toLocaleString()
        : "N/A";

      tableBody.innerHTML += `
        <tr>
          <td>${index + 1}</td>
          <td>${entry.petName || entry.source || "System"}</td>
          <td>${entry.source === "app" ? "Manual Open" : "Collar Open"}</td>
          <td>${date}</td>
        </tr>`;
    });
    if (entries.length <= 10) { //  ניהול כפתור
      seeMoreLogsBtn.classList.add("d-none");
    } 
    else {
      seeMoreLogsBtn.classList.remove("d-none");
    }
  });
}

// =======================
//  כפתור
// =======================
seeMoreLogsBtn.onclick = () => {
  showAllLogs = !showAllLogs;

  seeMoreLogsBtn.textContent = showAllLogs
    ? "Show less"
    : "See more";

  loadAccessLog();
};

// =======================
// Auth
// =======================
onAuthStateChanged(auth, (user) => {

  if (!user) {
    window.location.href = "login.html";
    return;
  }

  currentUser = user;

  loadGateStatus();
  loadAccessLog();

  toggleBtn.addEventListener("click", sendToggleCommand);
});