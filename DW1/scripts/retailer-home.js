import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("UID do usuário:", user.uid);

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            document.getElementById("retailerName").innerHTML += `${userData.name}!`

            const storeNameElement = document.getElementById('storeNameDisplay');
            if (storeNameElement) {
                storeNameElement.textContent = `Bem-vindo à ${userData.storeName}!`;
            }
        } else {
            console.log("Não encontramos dados adicionais para este usuário no Firestore.");
        }

    } else {
        console.log("Nenhum usuário logado. Redirecionando...");
        window.location.href = "index.html";
    }
});