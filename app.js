// ========================================
// HOME.JS - Página Principal
// ========================================

function renderHome() {
    const app = document.getElementById('app');
    const listings = getListings();

    app.innerHTML = `
        <div class="hero">
            <div class="container">
                <h1>Bem-vindo ao EspaçoGO</h1>
                <p>Encontre o espaço perfeito para suas necessidades</p>
                <div class="search-box">
                    <input 
                        type="text" 
                        id="search" 
                        placeholder="Buscar por cidade, tipo ou descrição..."
                        autocomplete="off"
                    >
                    <button class="btn btn-primary" onclick="handleSearch()">Buscar</button>
                </div>
            </div>
        </div>

        <div class="container">
            <div id="results">
                ${listings.length === 0 
                    ? '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Nenhum anúncio disponível no momento</p></div>'
                    : `<div class="cards-grid">${listings.map(l => renderCard(l)).join('')}</div>`
                }
            </div>
        </div>
    `;

    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleSearch();
                searchInput.blur();
            }
        });

        // Focar no input em mobile
        setTimeout(() => {
            searchInput.focus();
        }, 100);
    }
}

function renderCard(listing) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const owner = users.find(u => u.id === listing.ownerId);
    
    return `
        <div class="card" onclick="goToDetail('${listing.id}')">
            <div class="card-image">
                ${listing.images.length > 0 
                    ? `<img src="${listing.images[0]}" alt="${listing.title}">` 
                    : '🏠'
                }
            </div>
            <div class="card-content">
                <div class="card-title">${listing.title}</div>
                <div class="card-info">
                    <span>📍 ${listing.city}</span>
                    <span>${listing.category}</span>
                </div>
                <div class="card-price">R$ ${listing.price.toFixed(2)}</div>
                <button class="btn btn-primary" style="width: 100%;">Ver Detalhes</button>
            </div>
        </div>
    `;
}

function handleSearch() {
    const query = document.getElementById('search').value;
    const results = searchListings(query);
    const resultsDiv = document.getElementById('results');
    
    resultsDiv.innerHTML = results.length === 0
        ? '<div class="empty-state"><div class="empty-state-icon">🔍</div><p>Nenhum resultado encontrado</p></div>'
        : `<div class="cards-grid">${results.map(l => renderCard(l)).join('')}</div>`;
}

function goToDetail(id) {
    currentPage = 'detail';
    currentDetailId = id;
    render();
}

function goHome() {
    currentPage = 'home';
    render();
}

// ========================================
// DASHBOARD.JS - Painel do Anfitrião
// ========================================

function renderDashboard() {
    if (!isAuthenticated()) {
        window.location.hash = 'login';
        return;
    }

    const app = document.getElementById('app');
    const listings = getUserListings();
    const user = getCurrentUser();

    app.innerHTML = `
        <div class="container mt-2">
            <h1>Dashboard - Meus Anúncios</h1>
            <p>Bem-vindo, ${user.name}!</p>

            <button class="btn btn-primary mb-2" onclick="openNewListingModal()">+ Novo Anúncio</button>

            ${listings.length === 0
                ? '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Você ainda não tem nenhum anúncio</p></div>'
                : `<div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Cidade</th>
                                <th>Preço</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${listings.map(l => `
                                <tr>
                                    <td>${l.title}</td>
                                    <td>${l.city}</td>
                                    <td>R$ ${l.price.toFixed(2)}</td>
                                    <td>
                                        <button class="btn btn-secondary btn-small" onclick="openEditListingModal('${l.id}')">Editar</button>
                                        <button class="btn btn-danger btn-small" onclick="confirmDeleteListing('${l.id}')">Excluir</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`
            }
        </div>

        <div id="listingModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modalTitle">Novo Anúncio</h2>
                    <button class="modal-close" onclick="closeListingModal()">✕</button>
                </div>
                <form id="listingForm" onsubmit="handleListingSubmit(event)">
                    <div class="form-group">
                        <label>Título</label>
                        <input type="text" id="title" required>
                    </div>

                    <div class="form-group">
                        <label>Descrição</label>
                        <textarea id="description" required></textarea>
                    </div>

                    <div class="form-group">
                        <label>Categoria</label>
                        <select id="category" required>
                            <option value="">Selecione uma categoria</option>
                            <option value="Casa">Casa</option>
                            <option value="Quarto">Quarto</option>
                            <option value="Kitnet">Kitnet</option>
                            <option value="Apartamento">Apartamento</option>
                            <option value="Estúdio">Estúdio</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Cidade</label>
                        <input type="text" id="city" required>
                    </div>

                    <div class="form-group">
                        <label>Preço (R$)</label>
                        <input type="number" id="price" step="0.01" required>
                    </div>

                    <div class="form-group">
                        <label>WhatsApp (com DDD, sem símbolos)</label>
                        <input type="text" id="whatsapp" placeholder="558899999999" required>
                    </div>

                    <div class="form-group">
                        <label>Imagem</label>
                        <input type="file" id="image" accept="image/*">
                        <small>Envie uma imagem para seu anúncio</small>
                    </div>

                    <button type="submit" class="btn btn-primary" style="width: 100%;">Salvar Anúncio</button>
                </form>
            </div>
        </div>
    `;
}

function openNewListingModal() {
    currentEditId = null;
    document.getElementById('modalTitle').textContent = 'Novo Anúncio';
    document.getElementById('listingForm').reset();
    document.getElementById('listingModal').classList.add('active');
}

function openEditListingModal(id) {
    const listing = getListing(id);
    currentEditId = id;
    
    document.getElementById('modalTitle').textContent = 'Editar Anúncio';
    document.getElementById('title').value = listing.title;
    document.getElementById('description').value = listing.description;
    document.getElementById('category').value = listing.category;
    document.getElementById('city').value = listing.city;
    document.getElementById('price').value = listing.price;
    document.getElementById('whatsapp').value = listing.whatsapp;
    
    document.getElementById('listingModal').classList.add('active');
}

function closeListingModal() {
    document.getElementById('listingModal').classList.remove('active');
}

function handleListingSubmit(e) {
    e.preventDefault();

    const data = {
        title: document.getElementById('title').value,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        city: document.getElementById('city').value,
        price: document.getElementById('price').value,
        whatsapp: document.getElementById('whatsapp').value,
        images: []
    };

    const imageInput = document.getElementById('image');
    if (imageInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = (event) => {
            data.images = [event.target.result];
            finalizeListing(data);
        };
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        finalizeListing(data);
    }
}

function finalizeListing(data) {
    if (currentEditId) {
        updateListing(currentEditId, data);
    } else {
        createListing(data);
    }
    closeListingModal();
    renderDashboard();
}

function confirmDeleteListing(id) {
    if (confirm('Tem certeza que deseja excluir este anúncio?')) {
        deleteListingItem(id);
        renderDashboard();
    }
}

// ========================================
// AUTH.JS - Autenticação com LocalStorage
// ========================================

function initializeLocalStorage() {
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify([]));
    }
    if (!localStorage.getItem('listings')) {
        localStorage.setItem('listings', JSON.stringify([]));
    }
}

function getCurrentUser() {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.logged) return null;
    
    const users = JSON.parse(localStorage.getItem('users'));
    return users.find(u => u.id === session.userId);
}

function isAuthenticated() {
    return !!getCurrentUser();
}

function registerUser(name, email, password) {
    let users = JSON.parse(localStorage.getItem('users')) || [];

    if (users.some(u => u.email === email)) {
        return { success: false, message: 'Email já cadastrado!' };
    }

    const user = {
        id: crypto.randomUUID(),
        name,
        email,
        password: btoa(password),
        createdAt: new Date().toISOString()
    };

    users.push(user);
    localStorage.setItem('users', JSON.stringify(users));
    return { success: true, message: 'Cadastro realizado com sucesso!' };
}

function loginUser(email, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === btoa(password));

    if (!user) {
        return { success: false, message: 'Email ou senha inválidos!' };
    }

    localStorage.setItem('session', JSON.stringify({ userId: user.id, logged: true }));
    return { success: true, message: 'Login realizado com sucesso!' };
}

function logoutUser() {
    localStorage.removeItem('session');
}

// ========================================
// DATA.JS - CRUD de Anúncios
// ========================================

function createListing(data) {
    const user = getCurrentUser();
    if (!user) return null;

    const listing = {
        id: crypto.randomUUID(),
        ownerId: user.id,
        title: data.title,
        description: data.description,
        category: data.category,
        city: data.city,
        price: parseFloat(data.price),
        whatsapp: data.whatsapp,
        images: data.images || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    let listings = JSON.parse(localStorage.getItem('listings')) || [];
    listings.push(listing);
    localStorage.setItem('listings', JSON.stringify(listings));
    return listing;
}

function getListings() {
    return JSON.parse(localStorage.getItem('listings')) || [];
}

function getListing(id) {
    const listings = getListings();
    return listings.find(l => l.id === id);
}

function getUserListings() {
    const user = getCurrentUser();
    if (!user) return [];
    const listings = getListings();
    return listings.filter(l => l.ownerId === user.id);
}

function updateListing(id, data) {
    const user = getCurrentUser();
    if (!user) return null;

    let listings = JSON.parse(localStorage.getItem('listings')) || [];
    const index = listings.findIndex(l => l.id === id && l.ownerId === user.id);

    if (index === -1) return null;

    listings[index] = {
        ...listings[index],
        ...data,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem('listings', JSON.stringify(listings));
    return listings[index];
}

function deleteListingItem(id) {
    const user = getCurrentUser();
    if (!user) return false;

    let listings = JSON.parse(localStorage.getItem('listings')) || [];
    listings = listings.filter(l => !(l.id === id && l.ownerId === user.id));
    localStorage.setItem('listings', JSON.stringify(listings));
    return true;
}

function searchListings(query) {
    const listings = getListings();
    if (!query) return listings;
    
    const q = query.toLowerCase();
    return listings.filter(l => 
        l.title.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q)
    );
}



// ========================================
// APP.JS - Aplicação Principal e Routing
// ========================================

let currentPage = 'home';
let currentDetailId = null;
let currentEditId = null;

// ========================================
// HEADER COMPONENT
// ========================================

function renderHeader() {
    const header = document.getElementById('header');
    const user = getCurrentUser();

    const navLinks = user
        ? `
            <a href="#home" class="btn btn-secondary">Home</a>
            <a href="#dashboard" class="btn btn-secondary">Meus Anúncios</a>
            <span style="color: var(--dark); font-weight: 500;">Olá, ${user.name}!</span>
            <button onclick="handleLogout()" class="btn btn-danger">Sair</button>
        `
        : `
            <a href="#home" class="btn btn-secondary">Home</a>
            <a href="#login" class="btn btn-primary">Login</a>
            <a href="#register" class="btn btn-secondary">Cadastro</a>
        `;

    header.innerHTML = `
        <div class="container">
            <div class="header-content">
                <a href="#home" class="logo">
                    <img src="espacoGO.png" alt="EspaçoGO Logo" class="logo-img">
                    <span class="logo-text">EspaçoGO</span>
                </a>
                <nav class="nav">
                    ${navLinks}
                </nav>
            </div>
        </div>
    `;
}

// ========================================
// AUTH PAGES - Login e Registro
// ========================================

function renderLogin() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-logo">
                <img src="espacoGO.png" alt="EspaçoGO Logo" class="auth-logo-img">
            </div>
            <h1>Login</h1>
            <form onsubmit="handleLogin(event)">
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="loginEmail" required autofocus>
                </div>
                <div class="form-group">
                    <label>Senha</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Entrar</button>
            </form>
            <div class="auth-link">
                Não tem conta? <a href="#register">Cadastre-se aqui</a>
            </div>
        </div>
    `;
}

function renderRegister() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="auth-container">
            <div class="auth-logo">
                <img src="espacoGO.png" alt="EspaçoGO Logo" class="auth-logo-img">
            </div>
            <h1>Cadastro</h1>
            <form onsubmit="handleRegister(event)">
                <div class="form-group">
                    <label>Nome Completo</label>
                    <input type="text" id="registerName" required autofocus>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="registerEmail" required>
                </div>
                <div class="form-group">
                    <label>Senha</label>
                    <input type="password" id="registerPassword" required>
                </div>
                <div class="form-group">
                    <label>Confirmar Senha</label>
                    <input type="password" id="registerPasswordConfirm" required>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Cadastrar</button>
            </form>
            <div class="auth-link">
                Já tem conta? <a href="#login">Faça login aqui</a>
            </div>
        </div>
    `;
}

function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const result = loginUser(email, password);
    
    if (result.success) {
        alert(result.message);
        currentPage = 'home';
        render();
    } else {
        alert(result.message);
    }
}

function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    
    if (password !== passwordConfirm) {
        alert('As senhas não coincidem!');
        return;
    }

    if (password.length < 6) {
        alert('A senha deve ter no mínimo 6 caracteres!');
        return;
    }
    
    const result = registerUser(name, email, password);
    
    if (result.success) {
        alert(result.message);
        currentPage = 'login';
        render();
    } else {
        alert(result.message);
    }
}

function handleLogout() {
    if (confirm('Tem certeza que deseja sair?')) {
        logoutUser();
        currentPage = 'home';
        render();
    }
}

// ========================================
// RENDERIZAÇÃO PRINCIPAL
// ========================================

function render() {
    renderHeader();

    switch (currentPage) {
        case 'home':
            renderHome();
            break;
        case 'login':
            renderLogin();
            break;
        case 'register':
            renderRegister();
            break;
        case 'dashboard':
            if (!isAuthenticated()) {
                alert('Você precisa fazer login para acessar o dashboard');
                currentPage = 'login';
                render();
            } else {
                renderDashboard();
            }
            break;
        case 'detail':
            renderDetail();
            break;
        default:
            renderHome();
    }
}

// ========================================
// HASH ROUTING
// ========================================

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1) || 'home';
    currentPage = hash;
    render();
});

// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeLocalStorage();
    render();

    // Adicionar suporte a toque/swipe
    let touchStart = null;
    let touchEnd = null;

    const handleSwipe = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart.clientX - touchEnd.clientX;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        // Aqui você pode adicionar lógica de swipe se necessário
    };

    document.addEventListener('touchstart', (e) => {
        touchStart = e.changedTouches[0];
    });

    document.addEventListener('touchend', (e) => {
        touchEnd = e.changedTouches[0];
        handleSwipe();
    });

    // Fechar modal ao tocar fora dele
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // Detectar orientação do dispositivo
    window.addEventListener('orientationchange', () => {
        render();
    });
});

// ========================================
// VIEW.JS - Página de Detalhes
// ========================================

function renderDetail() {
    const listing = getListing(currentDetailId);
    const app = document.getElementById('app');

    if (!listing) {
        app.innerHTML = '<div class="container"><div class="empty-state"><p>Anúncio não encontrado</p><button class="btn btn-primary mt-2" onclick="goHome()">Voltar</button></div></div>';
        return;
    }

    const whatsappUrl = `https://wa.me/55${listing.whatsapp}?text=Olá! Estou interessado no espaço "${listing.title}" encontrado no EspaçoGO.`;

    app.innerHTML = `
        <div class="container mt-2">
            <button class="btn btn-secondary mb-2" onclick="goHome()">← Voltar</button>
            
            <div class="detail-content">
                <div class="gallery">
                    <div class="gallery-main">
                        ${listing.images.length > 0 
                            ? `<img src="${listing.images[0]}" alt="${listing.title}">`
                            : '🏠'
                        }
                    </div>
                </div>

                <div class="detail-info">
                    <h1 class="detail-title">${listing.title}</h1>
                    
                    <div class="detail-meta">
                        <div class="detail-meta-item">
                            <label>Localização</label>
                            <value>📍 ${listing.city}</value>
                        </div>
                        <div class="detail-meta-item">
                            <label>Categoria</label>
                            <value>${listing.category}</value>
                        </div>
                        <div class="detail-meta-item">
                            <label>Preço</label>
                            <value>R$ ${listing.price.toFixed(2)}</value>
                        </div>
                    </div>

                    <div class="detail-price">R$ ${listing.price.toFixed(2)}/noite</div>

                    <h3>Descrição</h3>
                    <p class="detail-description">${listing.description}</p>

                    <a href="${whatsappUrl}" target="_blank" class="btn btn-primary" style="width: 100%; font-size: 1.1rem; padding: 1rem;">
                        💬 Falar no WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `;
}