import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    getFirestore,
    setDoc,
    doc,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

initializeApp(firebaseConfig);
const retailerForm = document.getElementById("retailerForm");
const producerForm = document.getElementById("producerForm");
const retailerErrorMessage = document.getElementById("retailerErrorMessage");
const producerErrorMessage = document.getElementById("producerErrorMessage");

document.addEventListener("DOMContentLoaded", () => {
    const retailerZipCode = document.getElementById("retailerZipCode");
    const retailerState = document.getElementById("retailerState");
    const retailerCity = document.getElementById("retailerCity");
    const producerZipCode = document.getElementById("producerZipCode");
    const producerState = document.getElementById("producerState");
    const producerCity = document.getElementById("producerCity");

    async function handleZipCodeBlur(event) {
        const cepInput = event.target;
        const cep = cepInput.value.replace(/\D/g, "");

        let stateInput, cityInput, zipCodeInput;
        if (cepInput.id === "retailerZipCode") {
            stateInput = retailerState;
            cityInput = retailerCity;
            zipCodeInput = retailerZipCode;
        } else if (cepInput.id === "producerZipCode") {
            stateInput = producerState;
            cityInput = producerCity;
            zipCodeInput = producerZipCode
        } else {
            return;
        }

        if (cep.length !== 8) {
            return;
        }

        zipCodeInput.disabled = true;
        stateInput.value = "";
        cityInput.value = "";

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await response.json();

            if (data.erro) {
                alert("CEP não encontrado.");
                console.warn("ViaCEP: CEP não localizado.");
            } else {
                stateInput.value = data.uf;
                cityInput.value = data.localidade;
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            alert("Erro ao consultar o CEP. Tente novamente.");
        } finally {
            zipCodeInput.disabled = false;
        }
    }

    if (retailerZipCode) {
        retailerZipCode.addEventListener("blur", handleZipCodeBlur);
    }
    if (producerZipCode) {
        producerZipCode.addEventListener("blur", handleZipCodeBlur);
    }
});

function alertRemove(errorDiv) {
    const alert = errorDiv.querySelector(".alert");
    function removeAlert(event) {
        if (!alert.contains(event.target)) {
            errorDiv.innerHTML = "";
            document.removeEventListener("click", removeAlert);
        }
    }
    setTimeout(() => {
        document.addEventListener("click", removeAlert);
    }, 0);
}

retailerForm.addEventListener("submit", async (event) => {
    try {
        event.preventDefault();

        const name = document.getElementById("retailerName").value;
        const storeName = document.getElementById("retailerStore").value;
        const email = document.getElementById("retailerEmail").value;
        const password = document.getElementById("retailerPassword").value;
        const phone = document.getElementById("retailerPhone").value;
        const state = document.getElementById("retailerState").value;
        const city = document.getElementById("retailerCity").value;

        const auth = getAuth();
        const db = getFirestore();

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;
        const userData = {
            name,
            storeName,
            email,
            phone,
            state,
            city,
            type: "retailer",
            createdAt: new Date()
        };

        await setDoc(doc(db, "users", user.uid), userData);

        window.location.href = "retailer-home.html";
    } catch (error) {
        console.error("Error: ", error);
        let mensagem = "Ocorreu um erro, tente novamente!";

        if (error.code == "auth/email-already-in-use") {
            mensagem = "O E-mail que foi fornecido já está em uso!";
        } else if (error.code == "auth/weak-password") {
            mensagem = "Sua senha deve ser maior que 6 caracteres!";
        }

        retailerErrorMessage.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Erro:</strong> ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
            </div>
        `;

        alertRemove(retailerErrorMessage);
    }
});

producerForm.addEventListener("submit", async (event) => {
    try {
        event.preventDefault();

        const name = document.getElementById("producerName").value;
        const farmName = document.getElementById("producerFarm").value;
        const email = document.getElementById("producerEmail").value;
        const password = document.getElementById("producerPassword").value;
        const phone = document.getElementById("producerPhone").value;
        const state = document.getElementById("producerState").value;
        const city = document.getElementById("producerCity").value;

        const auth = getAuth();
        const db = getFirestore();

        const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );
        const user = userCredential.user;
        const userData = {
            name,
            farmName,
            email,
            phone,
            state,
            city,
            password,
            type: "producer",
            createdAt: new Date()
        };

        await setDoc(doc(db, "users", user.uid), userData);
        window.location.href = "producer-home.html";
    } catch (error) {
        console.error("Error: ", error);
        let mensagem = "Ocorreu um erro, tente novamente!";

        if (error.code == "auth/email-already-in-use") {
            mensagem = "O E-mail que foi fornecido já está em uso!";
        } else if (error.code == "auth/weak-password") {
            mensagem = "Sua senha deve ser maior que 6 caracteres!";
        }

        producerErrorMessage.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Erro:</strong> ${mensagem}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar"></button>
            </div>
        `;

        alertRemove(producerErrorMessage);
    }
});
