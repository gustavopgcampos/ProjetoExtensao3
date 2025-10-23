import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    addDoc,
    collection,
    getDocs,
    query,
    where,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";
import { Product } from "../models/Product.js";
import { Producer } from "../models/Producer.js"

initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
let userUid = ""
let userFavorites = new Set();

async function loadUserFavorites() {
    if (!userUid) return;

    userFavorites.clear();
    const q = query(collection(db, "favorites"), where("retailerId", "==", userUid));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
        userFavorites.add(doc.data().producerId);
    });
}

async function getProducers() {
    const producersCol = collection(db, "users");
    const q = query(producersCol, where("type", "==", "producer"));
    const querySnapshot = await getDocs(q);
    const producers = [];
    querySnapshot.forEach((doc) => {
        const producer = new Producer(
            doc.id,
            doc.data().city,
            doc.data().email,
            doc.data().farmName,
            doc.data().name,
            doc.data().phone,
            doc.data().state,
            new Date(doc.data().createdAt.seconds * 1000),
        );
        producers.push(producer);
    });
    renderProducersInPage(producers);
}

function renderProducersInPage(producers) {
    const producersContainer = document.getElementById("producers");
    let html = "";

    producers.forEach((producer) => {
        const isSaved = userFavorites.has(producer.id);
        const iconName = isSaved ? 'bookmark' : 'bookmark_border';
        const savedClass = isSaved ? 'saved' : '';

        html += `
        <div class="col-md-6 col-lg-4">
            <div class="card producer-card h-100">
                <div class="card-body d-flex flex-column">
                <h5 class="card-title fw-bold">${producer.farmName}</h5>
                <p class="card-text text-muted mb-1"><span
                    class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">${producer.name}</span></p>
                <p class="card-text text-muted"><span class="material-icons"
                    style="font-size: 1rem; vertical-align: text-bottom;">location_on</span> ${producer.city}, ${producer.state}</p>
                <div class="mt-auto d-flex justify-content-between align-items-center pt-3">
                    <button class="btn btn-primary view-products" type="button" data-bs-toggle="offcanvas"
                    data-bs-target="#producerProductsOffcanvas" aria-controls="producerProductsOffcanvas"
                    data-producer-id="${producer.id}" data-farm-name="${producer.farmName}">Ver Produtos</button>
                    <a href="#" class="btn-save ${savedClass}" title="Salvar Produtor" data-producer-id="${producer.id}">
                        <span class="material-icons">${iconName}</span>
                    </a>
                </div>
                </div>
            </div>
        </div>
        `;
    });

    producersContainer.innerHTML = html;

    const productButtons = document.querySelectorAll('.view-products');
    productButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const producerId = event.currentTarget.dataset.producerId;
            const farmName = event.currentTarget.dataset.farmName;
            await getProducerProducts(farmName, producerId);
        });
    });
    const favoriteButtons = document.querySelectorAll('.btn-save');
    favoriteButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const producerId = event.currentTarget.dataset.producerId;
            await toggleFavoriteProducer(producerId, event.currentTarget)
        });
    })
}

async function toggleFavoriteProducer(producerId, buttonElement) {
    if (!producerId || !userUid) return;

    const icon = buttonElement.querySelector('span.material-icons');
    const q = query(collection(db, "favorites"),
        where("retailerId", "==", userUid),
        where("producerId", "==", producerId)
    );
    
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        const favoriteData = {
            producerId,
            retailerId: userUid,
            createdAt: new Date()
        };
        await addDoc(collection(db, "favorites"), favoriteData);
        icon.textContent = 'bookmark';
        buttonElement.classList.add('saved');
        userFavorites.add(producerId);
        alert("Produtor favoritado!");

    } else {
        const docToDeleteRef = querySnapshot.docs[0].ref;
        await deleteDoc(docToDeleteRef);

        icon.textContent = 'bookmark_border';
        buttonElement.classList.remove('saved');
        userFavorites.delete(producerId);
        alert("Produtor desfavoritado!");
    }
}

async function getProducerProducts(farmName, producerId) {
    const produtosCol = collection(db, "products");
    const q = query(produtosCol, where("producerId", "==", producerId));
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
    renderProductsInPage(farmName, products)
}

function renderProductsInPage(farmName, products) {
    document.getElementById("produtos-titulo").innerHTML = `
        <h5 class="offcanvas-title fw-bold" id="offcanvasLabel">Produtos de ${farmName}</h5>
        <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
    `;
    
    const productListContainer = document.getElementById("lista-produtos");
    let productsHtml = "";

    products.forEach((product) => {
        productsHtml += `
            <li class="list-group-item d-flex justify-content-between align-items-center py-3">
                <div>
                    <strong class="d-block">${product.name}</strong>
                    <small class="text-muted">${product.stock}${product.unit} disponíveis</small>
                    <small class="d-block text-muted">${product.description}</small>
                </div>
                <span class="badge bg-primary rounded-pill fs-6">R$ ${product.price}/${product.unit}</span>
            </li>
        `;
    });

    productListContainer.innerHTML = productsHtml;
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        userUid = user.uid;
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            await loadUserFavorites();
            getProducers();
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