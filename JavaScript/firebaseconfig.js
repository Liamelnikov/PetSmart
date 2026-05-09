// firebaseconfig.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

export const firebaseConfig = {
  apiKey: "AIzaSyC47R7vKX_P5NKypQHaNpRDD6_wdkRIxmM",
  authDomain: "petsmartgate.firebaseapp.com",
  databaseURL: "https://petsmartgate-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "petsmartgate",
  storageBucket: "petsmartgate.appspot.com",
  messagingSenderId: "493724815426",
  appId: "1:493724815426:web:91e9916aea15b9b51a5ddb"
};

// מוודא שה-App לא יאותחל פעמיים
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (e) {
  console.log("Firebase already initialized");
}

// ייצוא נקי של אובייקטים לשימוש חוזר
export const auth = getAuth(app);
export const db = getDatabase(app);
export { app };

