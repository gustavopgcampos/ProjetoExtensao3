import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  addDoc,
  collection,
  getDocs,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";
import { Product } from "./../models/Product.js";

initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();

const saveButton = document.getElementById("saveProductBtn");
const productForm = document.getElementById("productForm");
const addProductModalEl = document.getElementById("addProductModal");
const addProductModal = new bootstrap.Modal(addProductModalEl);
let userUid;
let userData;

async function getProducerProducts(uid) {
  const produtosCol = collection(db, "products");
  const q = query(produtosCol, where("producerId", "==", uid));
  const querySnapshot = await getDocs(q);
  const products = [];
  querySnapshot.forEach((doc) => {
    const product = new Product(
      doc.id,
      doc.data().producerId,
      doc.data().unit,
      doc.data().name,
      doc.data().description,
      doc.data().stock,
      new Date(doc.data().createdAt.seconds * 1000),
      doc.data().price
    );
    products.push(product);
  });
  renderProductsInPage(products);
}

function renderProductsInPage(products) {
  products.forEach((product) => {
    document.getElementById("products").innerHTML += `
        <div class="col-sm-6 col-lg-4">
          <div class="card product-card h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title fw-bold">${product.name}</h5>
              <p class="card-text text-muted">${product.description}</p>
              <p class="card-text text-primary fw-bold fs-5">R$ ${product.price} / ${product.unit}</p>
              <p class="card-text text-muted">Estoque: ${product.stock} ${product.unit}</p>
              <div class="mt-auto pt-3">
                <a href="#" class="btn btn-secondary btn-sm">Editar</a>
              </div>
            </div>
          </div>
        </div>
    `;
  });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userUid = user.uid;
    console.log("UID do usuário:", user.uid);

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      userData = userDocSnap.data();
      getProducerProducts(user.uid);
      document.getElementById("producerName").innerHTML += `${userData.name}!`;

      const storeNameElement = document.getElementById("storeNameDisplay");
      if (storeNameElement) {
        storeNameElement.textContent = `Bem-vindo à ${userData.storeName}!`;
      }
    } else {
      console.log(
        "Não encontramos dados adicionais para este usuário no Firestore."
      );
    }
  } else {
    console.log("Nenhum usuário logado. Redirecionando...");
    window.location.href = "index.html";
  }
});

saveButton.addEventListener("click", async () => {
  if (!productForm.checkValidity()) {
    productForm.reportValidity();
    return;
  }

  const originalButtonText = saveButton.innerHTML;
  saveButton.disabled = true;
  saveButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...`;
  try {
    const name = document.getElementById("productName").value;
    const price = parseFloat(document.getElementById("productPrice").value);
    const unit = document.getElementById("productUnit").value;
    const stock = parseInt(document.getElementById("productStock").value);
    const description = document.getElementById("productDescription").value;

    const productData = {
      name: name,
      price: price,
      unit: unit,
      stock: stock,
      description: description,
      createdAt: new Date(),
      producerId: userUid,
    };

    await addDoc(collection(db, "products"), productData),
      alert("Produto cadastrado com sucesso!");
    productForm.reset();
    addProductModal.hide();
  } catch (error) {
    console.error("Erro ao cadastrar produto: ", error);
    alert("Ocorreu um erro ao cadastrar o produto. Tente novamente.");
  } finally {
    saveButton.disabled = false;
    saveButton.innerHTML = originalButtonText;
  }
});
