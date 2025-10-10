import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js"
import { getFirestore, setDoc, doc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js"
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig);
const retailerForm = document.getElementById('retailerForm');
const producerForm = document.getElementById('producerForm');

const retailerErrorMessage = document.getElementById('retailerErrorMessage');
const producerErrorMessage = document.getElementById('producerErrorMessage');

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

retailerForm.addEventListener("submit", async (event) => {
    try {
        event.preventDefault();

        const name = document.getElementById('retailerName').value;
        const storeName = document.getElementById('retailerStore').value;
        const email = document.getElementById('retailerEmail').value;
        const password = document.getElementById('retailerPassword').value;

        const auth = getAuth();
        const db = getFirestore();

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userData = {
            name: name,
            storeName: storeName,
            email: email,
            type: "retailer"
        }

        await setDoc(doc(db, "users", user.uid), userData);

        window.location.href = "retailer-home.html";

    } catch (error) {
        console.error("Error: ", error);

        let mensagem = "Ocorreu um erro, tente novamente!"

        if (error.code == "auth/email-already-in-use") {
            mensagem = "O E-mail que foi fornecido já está em uso!"
        } else if (error.code == "auth/weak-password") {
            mensagem = "Sua senha deve ser maior que 6 caracteres!"
        }

        retailerErrorMessage.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Erro:</strong> ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
            </div>
        `;

        alertRemove(retailerErrorMessage)
    }
});

producerForm.addEventListener("submit", async (event) => {
    try {
        event.preventDefault();

        const name = document.getElementById("producerName").value;
        const farmName = document.getElementById("producerFarm").value;
        const email = document.getElementById("producerEmail").value;
        const password = document.getElementById("producerPassword").value;

        const auth = getAuth();
        const db = getFirestore();

        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user;
        const userData = {
            name: name,
            farmName: farmName,
            email: email,
            password: password,
            type: "producer"
        }

        await setDoc(doc(db, "users", user.uid), userData);
        window.location.href = "producer-home.html";

    } catch (error) {
        console.error("Error: ", error);

        let mensagem = "Ocorreu um erro, tente novamente!"

        if (error.code == "auth/email-already-in-use") {
            mensagem = "O E-mail que foi fornecido já está em uso!"
        } else if (error.code == "auth/weak-password") {
            mensagem = "Sua senha deve ser maior que 6 caracteres!"
        }

        producerErrorMessage.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Erro:</strong> ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
            </div>
        `;

        alertRemove(producerErrorMessage)
    }
});