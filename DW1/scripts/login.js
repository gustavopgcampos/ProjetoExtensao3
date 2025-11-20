import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const googleLoginButton = document.getElementById("googleLoginButton");
const form = document.getElementById('form');
const errorDiv = document.getElementById('errorMessage');

function alertRemove(errorDiv) {
    const alert = errorDiv.querySelector('.alert');

    function removeAlert(event) {
        if (!alert.contains(event.target)) {
            errorDiv.innerHTML = '';
            document.removeEventListener("click", removeAlert)
        }
    }

    setTimeout(() => {
        document.addEventListener("click", removeAlert);
    }, 0);
}

googleLoginButton.addEventListener("click", async e => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data()

        if (userData.type === 'retailer') {
            window.location.href = "retailer-home.html"
        } else if (userData.type === 'producer') {
            window.location.href = "producer-home.html"
        } else {
            await signOut(auth);
        }
    } catch (error) {
        console.log(error)
        let mensagem = "Ocorreu um erro, tente novamente!"

        if (error.code == "auth/invalid-credential") {
            mensagem = "Informações de credenciais inválidas!"
        } else if (error.code = "auth/invalid-email") {
            mensagem = "E-mail inválido!"
        }

        errorDiv.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Erro:</strong> ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
            </div>
        `;
        alertRemove(errorDiv);
    }
});

form.addEventListener("submit", async (event) => {
    try {
        event.preventDefault()

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();

        if (userData.type == "retailer") {
            window.location.href = "retailer-home.html"
        } else if (userData.type == "producer") {
            window.location.href = "producer-home.html"
        }
    } catch (error) {
        console.log(error)
        let mensagem = "Ocorreu um erro, tente novamente!"

        if (error.code == "auth/invalid-credential") {
            mensagem = "Informações de credenciais inválidas!"
        } else if (error.code = "auth/invalid-email") {
            mensagem = "E-mail inválido!"
        }

        errorDiv.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Erro:</strong> ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
            </div>
        `;
        alertRemove(errorDiv);
    }
});