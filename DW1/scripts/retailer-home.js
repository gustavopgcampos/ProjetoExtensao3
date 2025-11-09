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
    deleteDoc,
    getCountFromServer,
    orderBy,
    limit
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { firebaseConfig } from "./config.js";
import { Product } from "../models/Product.js";
import { Producer } from "../models/Producer.js"

initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
let userUid = ""
let userFavorites = new Set();
let allProducers = [];

const contactModalEl = document.getElementById('producerContactModal');
const filterRegionEl = document.getElementById("filterRegion");
const filterSavedEl = document.getElementById("filterSaved");
const filterProductEl = document.getElementById("filterProduct");
const filterProductBtn = document.getElementById("filterProductBtn");
const filterClearBtn = document.getElementById("filterClearBtn");

if (contactModalEl) {
    contactModalEl.addEventListener('show.bs.modal', (event) => {
        const button = event.relatedTarget;
        const farmName = button.getAttribute('data-farm-name');
        const name = button.getAttribute('data-name');
        const phone = button.getAttribute('data-phone');
        const email = button.getAttribute('data-email');
        const modalTitle = contactModalEl.querySelector('#producerContactModalLabel');
        const modalProducerName = contactModalEl.querySelector('#contactModalProducerName');
        const modalProducerPhone = contactModalEl.querySelector('#contactModalProducerPhone');
        const modalProducerEmail = contactModalEl.querySelector('#contactModalProducerEmail');
        modalTitle.textContent = `Contato - ${farmName}`;
        modalProducerName.textContent = name;
        modalProducerPhone.textContent = phone || 'Não informado';
        modalProducerEmail.textContent = email || 'Não informado';
    });
}

async function loadUserFavorites() {
    if (!userUid) return;
    userFavorites.clear();
    const q = query(collection(db, "favorites"), where("retailerId", "==", userUid));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
        userFavorites.add(doc.data().producerId);
    });
}

async function loadDashboardStats(uid) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    try {
        const productsCol = collection(db, "products");
        const qNewProducts = query(
            productsCol,
            where("createdAt", ">=", today),
            where("createdAt", "<", tomorrow)
        );
        const newProductsSnapshot = await getCountFromServer(qNewProducts);
        const newProductsCount = newProductsSnapshot.data().count;
        document.getElementById("newProductsTodayCount").textContent = newProductsCount;
    } catch (error) {
        console.error("Erro ao buscar contagem de novos produtos: ", error);
        document.getElementById("newProductsTodayCount").textContent = "0";
    }

    try {
        const productsCol = collection(db, "products");
        const qCheapest = query(
            productsCol,
            where("stock", ">", 0),
            orderBy("price", "asc"),
            limit(1)
        );

        const cheapestSnapshot = await getDocs(qCheapest);
        const priceEl = document.getElementById("cheapestProductPrice");
        const nameEl = document.getElementById("cheapestProductName");

        if (cheapestSnapshot.empty) {
            priceEl.textContent = "N/A";
            nameEl.textContent = "Nenhum produto em estoque";
        } else {
            const cheapestProduct = cheapestSnapshot.docs[0].data();
            const price = cheapestProduct.price.toFixed(2).replace('.', ',');
            priceEl.textContent = `R$ ${price} / ${cheapestProduct.unit}`;
            nameEl.textContent = cheapestProduct.name;
        }

    } catch (error) {
        console.error("Erro ao buscar produto mais barato: ", error);
        document.getElementById("cheapestProductPrice").textContent = "Erro";
        document.getElementById("cheapestProductName").textContent = "Produto Mais Barato";
    }
    document.getElementById("savedProducersCount").textContent = userFavorites.size;
}

async function getProducers() {
    const producersCol = collection(db, "users");
    const q = query(producersCol, where("type", "==", "producer"));
    const querySnapshot = await getDocs(q);
    
    allProducers = [];
    
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
        allProducers.push(producer);
    });
    
    applyFiltersAndRender();
}

function renderProducersInPage(producers) {
    const producersContainer = document.getElementById("producers");
    let html = "";

    if (producers.length === 0) {
        html = `<div class="col-12"><p class="text-center text-muted">Nenhum produtor encontrado com os filtros selecionados.</p></div>`;
    }

    producers.forEach((producer) => {
        const isSaved = userFavorites.has(producer.id);
        const iconName = isSaved ? 'bookmark' : 'bookmark_border';
        const savedClass = isSaved ? 'saved' : '';

        html += `
        <div class="col-md-6 col-lg-4">
            <div class="card producer-card h-100">
                <div class="card-body d-flex flex-column">
                <h5 class="card-title fw-bold">${producer.farmName ?? "-"}</h5>
                <p class="card-text text-muted mb-1"><span
                    class="badge bg-secondary-subtle text-secondary-emphasis rounded-pill">${producer.name}</span></p>
                ${producer?.state ? `<p class="card-text text-muted"><span class="material-icons" style="font-size: 1rem; vertical-align: text-bottom;">location_on</span> ${producer.city}, ${producer.state}</p>` : ''}
                <div class="mt-auto d-flex justify-content-between align-items-center pt-3">
                    <div class="d-flex gap-2">
                        <button class="btn btn-outline-secondary btn-sm btn-contact" 
                            data-bs-toggle="modal"
                            data-bs-target="#producerContactModal"
                            data-name="${producer.name}"
                            data-farm-name="${producer.farmName}"
                            data-phone="${producer.phone ?? "-"}"
                            data-email="${producer.email}">
                            Contato
                        </button>
                        
                        <button class="btn btn-primary btn-sm view-products" type="button" data-bs-toggle="offcanvas"
                            data-bs-target="#producerProductsOffcanvas" aria-controls="producerProductsOffcanvas"
                            data-producer-id="${producer.id}" data-farm-name="${producer.farmName}">
                            Ver Produtos
                        </button>
                    </div>
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
            event.preventDefault();
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
    } else {
        const docToDeleteRef = querySnapshot.docs[0].ref;
        await deleteDoc(docToDeleteRef);
        icon.textContent = 'bookmark_border';
        buttonElement.classList.remove('saved');
        userFavorites.delete(producerId);
    }

    document.getElementById("savedProducersCount").textContent = userFavorites.size;
    applyFiltersAndRender();
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

async function searchProducersByProduct() {
    const productName = filterProductEl.value.trim();
    if (!productName) {
        alert("Por favor, digite um nome de produto para buscar.");
        return;
    }

    const capitalizedName = productName.charAt(0).toUpperCase() + productName.slice(1).toLowerCase();

    try {
        const qProducts = query(collection(db, "products"), where("name", "==", capitalizedName));
        const productSnapshot = await getDocs(qProducts);
        
        if (productSnapshot.empty) {
            renderProducersInPage([]);
            return;
        }

        const producerIds = new Set();
        productSnapshot.forEach(doc => {
            producerIds.add(doc.data().producerId);
        });

        const matchingProducers = allProducers.filter(p => producerIds.has(p.id));

        renderProducersInPage(matchingProducers);
        
        filterRegionEl.value = "";
        filterSavedEl.checked = false;

    } catch (error) {
        console.error("Erro ao buscar por produto: ", error);
        alert("Ocorreu um erro ao buscar por produtos.");
    }
}

function applyFiltersAndRender() {
    const regionInput = filterRegionEl.value.trim().toUpperCase();
    const saved = filterSavedEl.checked;

    let filteredProducers = [...allProducers];

    if (regionInput) {
        filteredProducers = filteredProducers.filter(p => p.state.toUpperCase().startsWith(regionInput));
    }

    if (saved) {
        filteredProducers = filteredProducers.filter(p => userFavorites.has(p.id));
    }
    
    filterProductEl.value = ""; 

    renderProducersInPage(filteredProducers);
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        userUid = user.uid;
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
            const userData = userDocSnap.data();

            await loadUserFavorites();
            await loadDashboardStats(user.uid);
            await getProducers();
            
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

filterRegionEl.addEventListener('input', applyFiltersAndRender);
filterSavedEl.addEventListener('change', applyFiltersAndRender);
filterProductBtn.addEventListener('click', searchProducersByProduct);

filterProductEl.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        searchProducersByProduct();
    }
});

filterClearBtn.addEventListener('click', () => {
    filterRegionEl.value = "";
    filterSavedEl.checked = false;
    filterProductEl.value = "";
    applyFiltersAndRender();
});