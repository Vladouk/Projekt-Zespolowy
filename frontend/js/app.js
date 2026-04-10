/**
 * Delivery Manager - Головна логіка додатку з авторизацією
 */

let currentFilter = 'все';
let currentUser = null;

// Ініціалізація при завантаженні
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Delivery Manager завантажується...');
    
    // Перевірити авторизацію
    if (!api.token) {
        window.location.href = 'login.html';
        return;
    }

    try {
        // Отримати інформацію про користувача
        currentUser = await api.getCurrentUser();
        displayUserInfo();
        
        // Показати admin панель якщо адмін
        if (currentUser.role === 'admin') {
            showAdminPanel();
        }
    } catch (error) {
        console.error('❌ Помилка отримання користувача:', error);
        window.location.href = 'login.html';
        return;
    }
    
    setupEventListeners();
    await loadOrders();
    
    // Синхронізація кожні 30 секунд, якщо онлайн
    setInterval(async () => {
        if (navigator.onLine) {
            await syncOrders();
        }
    }, 30000);
});

/**
 * Показати інформацію про користувача
 */
function displayUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const username = document.getElementById('username');
    const roleElement = document.getElementById('role');
    
    if (userInfo) {
        userInfo.style.display = 'flex';
        username.textContent = currentUser.username;
        roleElement.textContent = currentUser.role.toUpperCase();
        roleElement.className = `badge ${currentUser.role}`;
    }
}

/**
 * Показити admin панель
 */
async function showAdminPanel() {
    const addOrderSection = document.querySelector('.add-order-section');
    
    // Вставити admin панель перед додаванням замовлень
    const adminHTML = `
        <section class="admin-panel">
            <h2>🔧 Admin Панель</h2>
            <div style="display: flex; gap: 10px; margin-bottom: 15px;">
                <button class="btn btn-primary" onclick="loadAdminUsers()">👥 Управління користувачами</button>
                <button class="btn btn-primary" onclick="loadActivityLogs()">📋 Логи активності</button>
            </div>
            <div id="adminContent"></div>
        </section>
    `;
    
    addOrderSection.insertAdjacentHTML('beforebegin', adminHTML);
}

/**
 * Завантажити список користувачів (для admin)
 */
async function loadAdminUsers() {
    try {
        const users = await api.getUsers();
        const adminContent = document.getElementById('adminContent');
        
        const usersHTML = users.map(user => `
            <div class="user-card">
                <div class="user-card-header">
                    <div>
                        <div class="user-card-name">${escapeHtml(user.username)}</div>
                        <div class="user-card-email">${escapeHtml(user.email)}</div>
                    </div>
                    <span class="user-card-role">${user.role.toUpperCase()}</span>
                </div>
                <div class="user-card-actions">
                    <button class="btn btn-small btn-edit" onclick="changeUserRole(${user.id}, '${user.role}')">
                        Змінити роль
                    </button>
                </div>
            </div>
        `).join('');
        
        adminContent.innerHTML = `<div class="users-grid">${usersHTML}</div>`;
    } catch (error) {
        showNotification(`Помилка завантаження користувачів: ${error.message}`, 'error');
    }
}

/**
 * Змінити роль користувача
 */
async function changeUserRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (!confirm(`Змінити роль на ${newRole}?`)) {
        return;
    }

    try {
        await api.updateUserRole(userId, newRole);
        showNotification(`✅ Роль змінена на ${newRole}`, 'success');
        await loadAdminUsers();
    } catch (error) {
        showNotification(`Помилка: ${error.message}`, 'error');
    }
}

/**
 * Завантажити логи активності
 */
async function loadActivityLogs() {
    try {
        const logs = await api.getActivityLogs();
        const adminContent = document.getElementById('adminContent');
        
        const logsHTML = logs.map(log => `
            <div style="padding: 10px; background: #f5f5f5; border-radius: 6px; margin-bottom: 8px;">
                <div style="font-weight: 600;">${escapeHtml(log.username)} - ${log.action}</div>
                <div style="font-size: 0.85rem; color: #666;">
                    ${escapeHtml(log.details)} (${log.ip_address})
                </div>
                <div style="font-size: 0.75rem; color: #999;">${log.timestamp}</div>
            </div>
        `).join('');
        
        adminContent.innerHTML = `<div>${logsHTML}</div>`;
    } catch (error) {
        showNotification(`Помилка завантаження логів: ${error.message}`, 'error');
    }
}

/**
 * Налаштування обробників подій
 */
function setupEventListeners() {
    // Форма додавання замовлення
    const addOrderForm = document.getElementById('addOrderForm');
    addOrderForm.addEventListener('submit', handleAddOrder);

    // Кнопки фільтрації
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });

    // Кнопка синхронізації
    const syncBtn = document.getElementById('syncBtn');
    syncBtn.addEventListener('click', handleSync);
}

/**
 * Завантажити і відобразити замовлення
 */
async function loadOrders() {
    try {
        console.log('📥 Завантаження замовлень...');
        const orders = await api.getOrders();
        
        console.log(`✅ Завантажено ${orders.length} замовлень`);
        displayOrders(orders);
    } catch (error) {
        console.error('❌ Помилка завантаження замовлень:', error);
        showNotification('Помилка завантаження замовлень', 'error');
    }
}

/**
 * Обробник додавання замовлення
 */
async function handleAddOrder(event) {
    event.preventDefault();
    
    const addressInput = document.getElementById('addressInput');
    const statusSelect = document.getElementById('statusSelect');
    
    const address = addressInput.value.trim();
    const status = statusSelect.value;
    
    if (!address) {
        showNotification('Введіть адресу доставки', 'error');
        return;
    }

    try {
        console.log('➕ Додавання замовлення...');
        
        const order = await api.addOrder(address, status);
        
        console.log('✅ Замовлення додано:', order);
        showNotification('✅ Замовлення додано успішно', 'success');
        
        // Очистити форму
        addressInput.value = '';
        statusSelect.value = 'нове';
        
        // Перезавантажити список
        await loadOrders();
    } catch (error) {
        console.error('❌ Помилка додавання замовлення:', error);
        showNotification('Помилка додавання замовлення', 'error');
    }
}

/**
 * Обробник зміни статусу замовлення
 */
async function handleChangeStatus(id, currentStatus) {
    const statusOptions = ['нове', 'в дорозі', 'доставлено', 'скасовано'];
    const newStatus = prompt(
        'Виберіть новий статус:\n' + 
        statusOptions.map((s, i) => `${i + 1}. ${s}`).join('\n'),
        currentStatus
    );

    if (!newStatus) return;

    if (!statusOptions.includes(newStatus)) {
        showNotification('Невідомий статус', 'error');
        return;
    }

    try {
        console.log(`🔄 Оновлення статусу замовлення ${id}...`);
        
        const orders = await api.getOrders();
        const order = orders.find(o => o.id === id);
        
        if (!order) {
            showNotification('Замовлення не знайдено', 'error');
            return;
        }

        await api.updateOrder(id, order.address, newStatus);
        
        console.log('✅ Статус оновлено');
        showNotification('✅ Статус змінено', 'success');
        
        await loadOrders();
    } catch (error) {
        console.error('❌ Помилка оновлення статусу:', error);
        showNotification('Помилка оновлення статусу', 'error');
    }
}

/**
 * Обробник видалення замовлення
 */
async function handleDeleteOrder(id) {
    if (!confirm('Ви впевнені, що хочете видалити це замовлення?')) {
        return;
    }

    try {
        console.log(`🗑️ Видалення замовлення ${id}...`);
        
        await api.deleteOrder(id);
        
        console.log('✅ Замовлення видалено');
        showNotification('✅ Замовлення видалено', 'success');
        
        await loadOrders();
    } catch (error) {
        console.error('❌ Помилка видалення замовлення:', error);
        showNotification('Помилка видалення замовлення', 'error');
    }
}

/**
 * Обробник фільтрування
 */
function handleFilter(event) {
    const filterBtn = event.target;
    const filter = filterBtn.getAttribute('data-filter');
    
    currentFilter = filter;
    
    // Оновити активну кнопку
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    filterBtn.classList.add('active');
    
    // Перезавантажити замовлення з фільтром
    loadOrders();
}

/**
 * Обробник синхронізації
 */
async function handleSync() {
    const syncBtn = document.getElementById('syncBtn');
    const syncStatus = document.getElementById('syncStatus');
    
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<span class="loading"></span> Синхронізація...';
    
    try {
        const result = await api.syncWithServer();
        
        if (result.success) {
            syncStatus.textContent = result.message;
            syncStatus.classList.add('success');
            showNotification(result.message, 'success');
            await loadOrders();
        } else {
            syncStatus.textContent = result.message;
            syncStatus.classList.add('error');
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('❌ Помилка синхронізації:', error);
        syncStatus.textContent = 'Помилка синхронізації';
        syncStatus.classList.add('error');
        showNotification('Помилка синхронізації', 'error');
    } finally {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '🔄 Синхронізація';
        
        setTimeout(() => {
            syncStatus.textContent = '';
            syncStatus.classList.remove('success', 'error');
        }, 3000);
    }
}

/**
 * Синхронізація замовлень
 */
async function syncOrders() {
    if (!navigator.onLine) {
        console.log('📱 Офлайн режим: синхронізація пропущена');
        return;
    }

    try {
        await api.syncWithServer();
    } catch (error) {
        console.error('❌ Помилка автоматичної синхронізації:', error);
    }
}

/**
 * Відобразити замовлення
 */
async function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    // Фільтрування
    let filteredOrders = orders;
    if (currentFilter !== 'все') {
        filteredOrders = orders.filter(order => order.status === currentFilter);
    }
    
    // Сортування за датою
    filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<p class="empty-state">Немає замовлень. Додайте своє першу!</p>';
        return;
    }

    ordersList.innerHTML = filteredOrders.map(order => createOrderCard(order)).join('');
    
    // Додати обробники подій для кнопок
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const status = btn.getAttribute('data-status');
            handleChangeStatus(id, status);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            handleDeleteOrder(id);
        });
    });
}

/**
 * Створити картку замовлення
 */
function createOrderCard(order) {
    const statusClass = order.status
        .replace('нове', 'new')
        .replace('в дорозі', 'in-progress')
        .replace('доставлено', 'completed')
        .replace('скасовано', 'cancelled');

    const statusEmoji = {
        'нове': '🆕',
        'в дорозі': '🚗',
        'доставлено': '✅',
        'скасовано': '❌'
    }[order.status] || '📦';

    const date = new Date(order.date).toLocaleDateString('uk-UA');

    return `
        <div class="order-card ${statusClass}">
            <div class="order-content">
                <div class="order-id">ID: #${order.id}</div>
                <div class="order-address">${escapeHtml(order.address)}</div>
                <div>
                    <span class="order-status ${statusClass}">
                        ${statusEmoji} ${order.status}
                    </span>
                </div>
                <div class="order-date">📅 ${date}</div>
            </div>
            <div class="order-actions">
                <button class="btn btn-status btn-small" data-id="${order.id}" data-status="${order.status}">
                    ✏️ Змінити статус
                </button>
                <button class="btn btn-delete btn-small" data-id="${order.id}">
                    🗑️ Видалити
                </button>
            </div>
        </div>
    `;
}

/**
 * Екранування HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Показати повідомлення (сповіщення)
 */
function showNotification(message, type = 'info') {
    // Створити елемент повідомлення
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${
            type === 'success' ? '#28a745' :
            type === 'error' ? '#dc3545' :
            '#17a2b8'
        };
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Видалити через 3 секунди
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Налаштування обробників подій
 */
function setupEventListeners() {
    // Форма додавання замовлення
    const addOrderForm = document.getElementById('addOrderForm');
    addOrderForm.addEventListener('submit', handleAddOrder);

    // Кнопки фільтрації
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', handleFilter);
    });

    // Кнопка синхронізації
    const syncBtn = document.getElementById('syncBtn');
    syncBtn.addEventListener('click', handleSync);
}

/**
 * Завантажити і відобразити замовлення
 */
async function loadOrders() {
    try {
        console.log('📥 Завантаження замовлень...');
        const orders = await api.getOrders();
        
        console.log(`✅ Завантажено ${orders.length} замовлень`);
        displayOrders(orders);
    } catch (error) {
        console.error('❌ Помилка завантаження замовлень:', error);
        showNotification('Помилка завантаження замовлень', 'error');
    }
}

/**
 * Обробник додавання замовлення
 */
async function handleAddOrder(event) {
    event.preventDefault();
    
    const addressInput = document.getElementById('addressInput');
    const statusSelect = document.getElementById('statusSelect');
    
    const address = addressInput.value.trim();
    const status = statusSelect.value;
    
    if (!address) {
        showNotification('Введіть адресу доставки', 'error');
        return;
    }

    try {
        console.log('➕ Додавання замовлення...');
        
        const order = await api.addOrder(address, status);
        
        console.log('✅ Замовлення додано:', order);
        showNotification('✅ Замовлення додано успішно', 'success');
        
        // Очистити форму
        addressInput.value = '';
        statusSelect.value = 'нове';
        
        // Перезавантажити список
        await loadOrders();
    } catch (error) {
        console.error('❌ Помилка додавання замовлення:', error);
        showNotification('Помилка додавання замовлення', 'error');
    }
}

/**
 * Обробник зміни статусу замовлення
 */
async function handleChangeStatus(id, currentStatus) {
    const statusOptions = ['нове', 'в дорозі', 'доставлено', 'скасовано'];
    const newStatus = prompt(
        'Виберіть новий статус:\n' + 
        statusOptions.map((s, i) => `${i + 1}. ${s}`).join('\n'),
        currentStatus
    );

    if (!newStatus) return;

    if (!statusOptions.includes(newStatus)) {
        showNotification('Невідомий статус', 'error');
        return;
    }

    try {
        console.log(`🔄 Оновлення статусу замовлення ${id}...`);
        
        const orders = await api.getOrders();
        const order = orders.find(o => o.id === id);
        
        if (!order) {
            showNotification('Замовлення не знайдено', 'error');
            return;
        }

        await api.updateOrder(id, order.address, newStatus);
        
        console.log('✅ Статус оновлено');
        showNotification('✅ Статус змінено', 'success');
        
        await loadOrders();
    } catch (error) {
        console.error('❌ Помилка оновлення статусу:', error);
        showNotification('Помилка оновлення статусу', 'error');
    }
}

/**
 * Обробник видалення замовлення
 */
async function handleDeleteOrder(id) {
    if (!confirm('Ви впевнені, що хочете видалити це замовлення?')) {
        return;
    }

    try {
        console.log(`🗑️ Видалення замовлення ${id}...`);
        
        await api.deleteOrder(id);
        
        console.log('✅ Замовлення видалено');
        showNotification('✅ Замовлення видалено', 'success');
        
        await loadOrders();
    } catch (error) {
        console.error('❌ Помилка видалення замовлення:', error);
        showNotification('Помилка видалення замовлення', 'error');
    }
}

/**
 * Обробник фільтрування
 */
function handleFilter(event) {
    const filterBtn = event.target;
    const filter = filterBtn.getAttribute('data-filter');
    
    currentFilter = filter;
    
    // Оновити активну кнопку
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    filterBtn.classList.add('active');
    
    // Перезавантажити замовлення з фільтром
    loadOrders();
}

/**
 * Обробник синхронізації
 */
async function handleSync() {
    const syncBtn = document.getElementById('syncBtn');
    const syncStatus = document.getElementById('syncStatus');
    
    syncBtn.disabled = true;
    syncBtn.innerHTML = '<span class="loading"></span> Синхронізація...';
    
    try {
        const result = await api.syncWithServer();
        
        if (result.success) {
            syncStatus.textContent = result.message;
            syncStatus.classList.add('success');
            showNotification(result.message, 'success');
            await loadOrders();
        } else {
            syncStatus.textContent = result.message;
            syncStatus.classList.add('error');
            showNotification(result.message, 'error');
        }
    } catch (error) {
        console.error('❌ Помилка синхронізації:', error);
        syncStatus.textContent = 'Помилка синхронізації';
        syncStatus.classList.add('error');
        showNotification('Помилка синхронізації', 'error');
    } finally {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '🔄 Синхронізація';
        
        setTimeout(() => {
            syncStatus.textContent = '';
            syncStatus.classList.remove('success', 'error');
        }, 3000);
    }
}

/**
 * Синхронізація замовлень
 */
async function syncOrders() {
    if (!navigator.onLine) {
        console.log('📱 Офлайн режим: синхронізація пропущена');
        return;
    }

    try {
        await api.syncWithServer();
    } catch (error) {
        console.error('❌ Помилка автоматичної синхронізації:', error);
    }
}

/**
 * Відобразити замовлення
 */
async function displayOrders(orders) {
    const ordersList = document.getElementById('ordersList');
    
    // Фільтрування
    let filteredOrders = orders;
    if (currentFilter !== 'все') {
        filteredOrders = orders.filter(order => order.status === currentFilter);
    }
    
    // Сортування за датою
    filteredOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '<p class="empty-state">Немає замовлень. Додайте своє першу!</p>';
        return;
    }

    ordersList.innerHTML = filteredOrders.map(order => createOrderCard(order)).join('');
    
    // Додати обробники подій для кнопок
    document.querySelectorAll('.btn-status').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            const status = btn.getAttribute('data-status');
            handleChangeStatus(id, status);
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(btn.getAttribute('data-id'));
            handleDeleteOrder(id);
        });
    });
}

/**
 * Створити картку замовлення
 */
function createOrderCard(order) {
    const statusClass = order.status
        .replace('нове', 'new')
        .replace('в дорозі', 'in-progress')
        .replace('доставлено', 'completed')
        .replace('скасовано', 'cancelled');

    const statusEmoji = {
        'нове': '🆕',
        'в дорозі': '🚗',
        'доставлено': '✅',
        'скасовано': '❌'
    }[order.status] || '📦';

    const date = new Date(order.date).toLocaleDateString('uk-UA');

    return `
        <div class="order-card ${statusClass}">
            <div class="order-content">
                <div class="order-id">ID: #${order.id}</div>
                <div class="order-address">${escapeHtml(order.address)}</div>
                <div>
                    <span class="order-status ${statusClass}">
                        ${statusEmoji} ${order.status}
                    </span>
                </div>
                <div class="order-date">📅 ${date}</div>
            </div>
            <div class="order-actions">
                <button class="btn btn-status btn-small" data-id="${order.id}" data-status="${order.status}">
                    ✏️ Змінити статус
                </button>
                <button class="btn btn-delete btn-small" data-id="${order.id}">
                    🗑️ Видалити
                </button>
            </div>
        </div>
    `;
}

/**
 * Екранування HTML
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Показати повідомлення (сповіщення)
 */
function showNotification(message, type = 'info') {
    // Створити елемент повідомлення
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background-color: ${
            type === 'success' ? '#28a745' :
            type === 'error' ? '#dc3545' :
            '#17a2b8'
        };
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Видалити через 3 секунди
    setTimeout(() => {
        notification.remove();
    }, 3000);
}
