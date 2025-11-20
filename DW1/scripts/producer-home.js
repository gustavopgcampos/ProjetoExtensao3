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
  updateDoc,
  deleteDoc,
  getCountFromServer
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
let currentEditingProductId = null;

async function loadProducerStats(uid) {
  try {
    const favoritesCol = collection(db, "favorites");
    const q = query(favoritesCol, where("producerId", "==", uid));

    const snapshot = await getCountFromServer(q);
    const count = snapshot.data().count;

    document.getElementById("favoritesCount").textContent = count;
  } catch (error) {
    console.error("Erro ao buscar contagem de favoritos: ", error);
    document.getElementById("favoritesCount").textContent = "0";
  }
}

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

function addProductCardListeners(products) {
  document.querySelectorAll(".btn-edit").forEach((button) => {
    button.addEventListener("click", (e) => {
      const productId = e.currentTarget.getAttribute("data-id");
      const productToEdit = products.find((p) => p.id === productId);

      if (productToEdit) {
        currentEditingProductId = productId;

        document.getElementById("addProductModalLabel").textContent = "Editar Produto";
        document.getElementById("productName").value = productToEdit.name;
        document.getElementById("productPrice").value = productToEdit.price;
        document.getElementById("productUnit").value = productToEdit.unit;
        document.getElementById("productStock").value = productToEdit.stock;
        document.getElementById("productDescription").value =
          productToEdit.description;
      }
    });
  });

  document.querySelectorAll(".btn-delete").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const productId = e.currentTarget.getAttribute("data-id");

      if (confirm("Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.")) {
        try {
          e.currentTarget.disabled = true;
          e.currentTarget.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>`;

          const productRef = doc(db, "products", productId);
          await deleteDoc(productRef);

          alert("Produto excluído com sucesso!");

          await getProducerProducts(userUid);
        } catch (error) {
          console.error("Erro ao excluir produto: ", error);
          alert("Ocorreu um erro ao excluir o produto. Tente novamente.");
          e.currentTarget.disabled = false;
          e.currentTarget.innerHTML = "Excluir";
        }
      }
    });
  });
}

function resetProductModal() {
  currentEditingProductId = null;
  productForm.reset();
  document.getElementById("addProductModalLabel").textContent =
    "Cadastrar Produto";
}

function renderProductsInPage(products) {
  const productsContainer = document.getElementById("products");

  productsContainer.innerHTML = `
    <div class="col-sm-6 col-lg-4">
      <div
        class="card add-product-card h-100"
        data-bs-toggle="modal"
        data-bs-target="#addProductModal"
      >
        <div>
          <span class="material-icons">add_circle_outline</span>
          <h5 class="mt-2">Adicionar Novo Produto</h5>
        </div>
      </div>
    </div>
  `;

  products.forEach((product) => {
    productsContainer.innerHTML += `
        <div class="col-sm-6 col-lg-4">
          <div class="card product-card h-100">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title fw-bold">${product.name}</h5>
              <p class="card-text text-muted">${product.description}</p>
              <p class="card-text text-primary fw-bold fs-5">R$ ${product.price} / ${product.unit}</p>
              <p class="card-text text-muted">Estoque: ${product.stock} ${product.unit}</p>
              <div class="mt-auto pt-3">
                <button 
                  class="btn btn-secondary btn-sm btn-edit" 
                  data-id="${product.id}"
                  data-bs-toggle="modal" 
                  data-bs-target="#addProductModal"
                >
                  Editar
                </button>
                <button 
                  class="btn btn-danger btn-sm btn-delete" 
                  data-id="${product.id}"
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
    `;
  });

  addProductCardListeners(products);

  document
    .querySelector(".add-product-card")
    .addEventListener("click", () => {
      resetProductModal();
    });
}

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userUid = user.uid;

    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      userData = userDocSnap.data();
      await Promise.all([
        getProducerProducts(user.uid), loadProducerStats(user.uid)
      ])

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

    if (price < 0) {
      alert('Valor Unitário não pode ser um valor negativo.');
      return;
    }
    if (stock < 0) {
      alert('Estoque não pode ser um valor negativo.');
      return;
    }

    if (currentEditingProductId) {
      const productRef = doc(db, "products", currentEditingProductId);
      await updateDoc(productRef, {
        name: name,
        price: price,
        unit: unit,
        stock: stock,
        description: description,
      });
      alert("Produto atualizado com sucesso!");
    } else {
      const productData = {
        name: name,
        price: price,
        unit: unit,
        stock: stock,
        description: description,
        createdAt: new Date(),
        producerId: userUid,
      };

      await addDoc(collection(db, "products"), productData);
      alert("Produto cadastrado com sucesso!");
    }
    addProductModal.hide();
    await getProducerProducts(userUid);
  } catch (error) {
    console.error("Error:", error);
    alert("Ocorreu um erro. Tente novamente mais tarde.");
  } finally {
    saveButton.disabled = false;
    saveButton.innerHTML = originalButtonText;
  }
});

addProductModalEl.addEventListener("hidden.bs.modal", () => {
  resetProductModal();
});