import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

initializeApp(firebaseConfig);
const db = getFirestore();

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.getElementById("contactForm");
  const sendMessageBtn = document.getElementById("btnSendMessage")
  sendMessageBtn.addEventListener("click", storeMessageInFirebase);

  async function storeMessageInFirebase() {
    if (!contactForm.checkValidity()) {
      contactForm.reportValidity();
      return;
    }

    const originalButtonText = sendMessageBtn.innerHTML;
    sendMessageBtn.disabled = true;
    sendMessageBtn.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Enviando...`;

    const name = document.getElementById("contactName").value;
    const email = document.getElementById("contactEmail").value;
    const subject = document.getElementById("contactSubject").value;
    const message = document.getElementById("contactMessage").value;

    const contactData = {
      name,
      email,
      subject,
      message
    }

    try {
      await addDoc(collection(db, "contacts"), contactData),
        alert("Mensagem enviada com sucesso!");
      contactForm.reset();
    } catch (error) {
      console.error("Erro ao salvar contato: ", error);
      alert("Ocorreu um erro ao enviar a mensagem. Tente novamente.");
    } finally {
      sendMessageBtn.disabled = false;
      sendMessageBtn.innerHTML = originalButtonText;
    }
  }
})