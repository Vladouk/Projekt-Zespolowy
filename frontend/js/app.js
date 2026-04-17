let currentUser = null;

// ====================================
// INITIALIZATION
// ====================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing Delivery Manager App...');
    
    // Check if logged in
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('current_user');
    
    if (!token || !userStr) {
        console.log('❌ Not authenticated, redirecting to login...');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        currentUser = JSON.parse(userStr);
        console.log('✅ User authenticated:', currentUser.username, `(${currentUser.role})`);
        
        initializeUI();
        loadDashboardData();
    } catch (err) {
        console.error('❌ Error parsing user:', err);
        window.location.href = 'login.html';
    }
});

function initializeUI() {
    // Show user info
    displayUserInfo();
    
    // Setup navigation
    setupNavigation();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show appropriate dashboard based on role
    if (currentUser.role === 'admin') {
        showAdminDashboard();
    } else if (currentUser.role === 'courier') {
        showCourierDashboard();
    } else {
        showClientDashboard();
    }
}

// ====================================
// UI DISPLAY FUNCTIONS
// ====================================

function displayUserInfo() {
    const userInfo = document.getElementById('userInfo');
    const usernameSpan = document.getElementById('username');
    const roleSpan = document.getElementById('userRole');
    
    if (userInfo && usernameSpan && roleSpan) {
        usernameSpan.textContent = currentUser.username;
        roleSpan.textContent = currentUser.role.toUpperCase();
        roleSpan.className = `badge badge-${currentUser.role}`;
        
        // Make it visible
        userInfo.style.display = 'flex';
        
        console.log('✅ User info displayed');
    } else {
        console.warn('⚠️ User info elements not found');
    }
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const view = link.dataset.view;
            switchView(view);
        });
    });
}

function switchView(view) {
    console.log(`🔄 Switching to view: ${view}`);
    console.log(`👤 Current user role: ${currentUser ? currentUser.role : 'unknown'}`);
    console.log(`🔌 API initialized: ${api ? 'YES' : 'NO'}`);
    
    // Hide all panels and views
    const allPanels = document.querySelectorAll('[data-view]');
    allPanels.forEach(panel => {
        panel.style.display = 'none';
    });
    console.log(`✅ Hidden ${allPanels.length} panels`);
    
    // Show the appropriate view based on user role and selected view
    if (currentUser.role === 'admin') {
        if (view === 'dashboard') {
            console.log('📋 Showing admin dashboard');
            showAdminDashboard();
        } else if (view === 'orders') {
            console.log('📦 Showing admin orders');
            showAdminOrders();
        } else if (view === 'settings') {
            console.log('⚙️ Showing admin settings');
            showAdminSettings();
        }
    } else if (currentUser.role === 'courier') {
        if (view === 'dashboard') {
            console.log('📋 Showing courier dashboard');
            showCourierDashboard();
        } else if (view === 'orders') {
            console.log('📦 Showing courier orders');
            showCourierOrders();
        } else if (view === 'settings') {
            console.log('⚙️ Showing courier settings');
            showCourierSettings();
        }
    } else if (currentUser.role === 'client') {
        if (view === 'dashboard') {
            console.log('📋 Showing client dashboard');
            showClientDashboard();
        } else if (view === 'orders') {
            console.log('📦 Showing client orders');
            showClientOrders();
        } else if (view === 'settings') {
            console.log('⚙️ Showing client settings');
            showClientSettings();
        }
    }
    
    console.log(`✅ View switched to: ${view}`);
}

// ====================================
// ADMIN DASHBOARD
// ====================================

async function showAdminDashboard() {
    console.log('👨‍💼 Loading Admin Dashboard...');
    
    if (!api) {
        console.error('❌ API not initialized');
        alert('Error: API client not initialized');
        return;
    }
    
    // Load stats
    const statsResult = await api.getAdminStats();
    if (statsResult.success) {
        displayAdminStats(statsResult.data);
    } else {
        console.error('❌ Failed to load stats:', statsResult.error);
    }
    
    // Load users
    const usersResult = await api.getAllUsers();
    if (usersResult.success) {
        displayUsersList(usersResult.data);
    } else {
        console.error('❌ Failed to load users:', usersResult.error);
    }
    
    // Show admin panel
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'block';
        console.log('✅ Admin panel displayed');
    } else {
        console.warn('⚠️ Admin panel element not found');
    }
}

function displayAdminStats(stats) {
    const statsContainer = document.getElementById('adminStats');
    if (!statsContainer) return;
    
    const html = `
        <div class="stats-grid">
            <div class="stat-card">
                <h3>Total Orders</h3>
                <p class="stat-value">${stats.total_orders}</p>
                <p class="stat-label">Today: ${stats.orders_today}</p>
            </div>
            <div class="stat-card">
                <h3>Couriers Online</h3>
                <p class="stat-value">${stats.active_couriers}/${stats.total_couriers}</p>
                <p class="stat-label">Available</p>
            </div>
            <div class="stat-card">
                <h3>Total Revenue</h3>
                <p class="stat-value">$${stats.total_revenue.toFixed(2)}</p>
                <p class="stat-label">All time</p>
            </div>
            <div class="stat-card">
                <h3>Average Rating</h3>
                <p class="stat-value">⭐ ${stats.avg_rating.toFixed(1)}</p>
                <p class="stat-label">From reviews</p>
            </div>
        </div>
    `;
    
    statsContainer.innerHTML = html;
    console.log('✅ Admin stats displayed');
}

async function displayUsersList(users) {
    const usersList = document.getElementById('usersList');
    if (!usersList) return;
    
    const html = users.map(user => `
        <div class="user-card">
            <div class="user-info">
                <strong>${user.username}</strong>
                <p>${user.email}</p>
            </div>
            <div class="user-role">
                <select onchange="changeRole(${user.id}, this.value)" class="role-select">
                    <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
                    <option value="courier" ${user.role === 'courier' ? 'selected' : ''}>Courier</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </div>
            <div class="user-status">
                ${user.is_active ? '✅ Active' : '❌ Inactive'}
            </div>
        </div>
    `).join('');
    
    usersList.innerHTML = html;
    console.log('✅ Users list displayed');
}

async function changeRole(userId, newRole) {
    const result = await api.changeUserRole(userId, newRole);
    if (result.success) {
        console.log(`✅ Role updated for user ${userId}`);
        // Refresh users list
        const usersResult = await api.getAllUsers();
        if (usersResult.success) {
            displayUsersList(usersResult.data);
        }
    } else {
        alert('Failed to change role: ' + result.error);
    }
}

// ====================================
// COURIER DASHBOARD
// ====================================

async function showCourierDashboard() {
    console.log('🚴 Loading Courier Dashboard...');
    
    if (!api) {
        console.error('❌ API not initialized');
        return;
    }
    
    // Load available orders
    const result = await api.getAvailableOrders();
    if (result.success) {
        displayAvailableOrders(result.data);
    } else {
        console.error('❌ Failed to load available orders:', result.error);
    }
    
    const courierPanel = document.getElementById('courierPanel');
    if (courierPanel) {
        courierPanel.style.display = 'block';
    }
}

function displayAvailableOrders(orders) {
    const container = document.getElementById('availableOrdersList');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="no-data">No available orders nearby</p>';
        return;
    }
    
    const html = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <strong>${order.product}</strong>
                <span class="order-distance">${order.distance_km}km</span>
            </div>
            <p class="order-address">📍 ${order.address}</p>
            <p class="order-category">${order.category}</p>
            <div class="order-footer">
                <span class="order-price">💰 $${order.suggested_price.toFixed(2)}</span>
                <button onclick="acceptOrder(${order.id})" class="btn btn-primary">Accept</button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
    console.log('✅ Available orders displayed');
}

async function acceptOrder(orderId) {
    const result = await api.acceptOrder(orderId);
    if (result.success) {
        console.log(`✅ Order accepted: ${orderId}`);
        alert('Order accepted! You can now start delivery.');
        // Refresh list
        showCourierDashboard();
    } else {
        alert('Failed to accept order: ' + result.error);
    }
}

// ====================================
// CLIENT DASHBOARD
// ====================================

async function showClientDashboard() {
    console.log('👤 Loading Client Dashboard...');
    
    if (!api) {
        console.error('❌ API not initialized');
        return;
    }
    
    // Load user's orders
    const result = await api.getMyOrders();
    if (result.success) {
        displayClientOrders(result.data);
    }
    
    const clientPanel = document.getElementById('clientPanel');
    if (clientPanel) {
        clientPanel.style.display = 'block';
    }
}

function displayClientOrders(orders) {
    const container = document.getElementById('myOrdersList');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="no-data">No orders yet. Create one to get started!</p>';
        return;
    }
    
    const html = orders.map(order => {
        const statusColors = {
            'new': '#FFB81C',
            'assigned': '#4A90E2',
            'in_progress': '#50C878',
            'delivered': '#7B68EE',
            'cancelled': '#E74C3C'
        };
        
        return `
            <div class="order-card">
                <div class="order-header">
                    <span class="order-id">Order #${order.id}</span>
                    <span class="order-status" style="background-color: ${statusColors[order.status] || '#999'}">
                        ${order.status.toUpperCase()}
                    </span>
                </div>
                <p class="order-product">${order.product_description}</p>
                <p class="order-address">📍 ${order.delivery_address}</p>
                <div class="order-details">
                    <span>Distance: ${order.distance_km}km</span>
                    <span>Price: $${order.suggested_price.toFixed(2)}</span>
                </div>
                <div class="order-footer">
                    ${order.status === 'new' ? `
                        <button onclick="cancelClientOrder(${order.id})" class="btn btn-danger">Cancel</button>
                    ` : ''}
                    ${order.status === 'delivered' ? `
                        <button onclick="showReviewForm(${order.id})" class="btn btn-primary">Leave Review</button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    console.log('✅ Client orders displayed');
}

async function cancelClientOrder(orderId) {
    if (confirm('Cancel this order?')) {
        const result = await api.cancelOrder(orderId);
        if (result.success) {
            console.log(`✅ Order cancelled: ${orderId}`);
            showClientDashboard();
        } else {
            alert('Failed to cancel order: ' + result.error);
        }
    }
}

// ====================================
// ORDER CREATION (CLIENT)
// ====================================

function setupEventListeners() {
    const createOrderForm = document.getElementById('createOrderForm');
    if (createOrderForm) {
        createOrderForm.addEventListener('submit', handleCreateOrder);
    }
}

async function handleCreateOrder(e) {
    e.preventDefault();
    
    const address = document.getElementById('deliveryAddress').value;
    const product = document.getElementById('productDescription').value;
    const category = document.getElementById('productCategory').value;
    const isUrgent = document.getElementById('isUrgent').checked;
    const distance = parseFloat(document.getElementById('distance').value) || 2.5;
    
    const result = await api.createOrder(address, product, {
        category,
        urgent: isUrgent,
        distance
    });
    
    if (result.success) {
        console.log('✅ Order created:', result.data);
        alert(`Order created! Price: $${result.data.price.toFixed(2)}`);
        document.getElementById('createOrderForm').reset();
        showClientDashboard();
    } else {
        alert('Failed to create order: ' + result.error);
    }
}

// ====================================
// REVIEW FORM
// ====================================

function showReviewForm(orderId) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Leave a Review</h2>
            <form onsubmit="submitReview(event, ${orderId})">
                <label>Rating:</label>
                <select id="reviewRating" required>
                    <option value="">Select rating...</option>
                    <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                    <option value="4">⭐⭐⭐⭐ Good</option>
                    <option value="3">⭐⭐⭐ Average</option>
                    <option value="2">⭐⭐ Poor</option>
                    <option value="1">⭐ Terrible</option>
                </select>
                
                <label>Comment:</label>
                <textarea id="reviewComment" placeholder="Share your experience..."></textarea>
                
                <div class="modal-buttons">
                    <button type="submit" class="btn btn-primary">Submit Review</button>
                    <button type="button" onclick="this.closest('.modal').remove()" class="btn btn-secondary">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function submitReview(e, orderId) {
    e.preventDefault();
    
    const rating = parseInt(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value;
    
    const result = await api.submitReview(orderId, rating, comment);
    if (result.success) {
        console.log('✅ Review submitted');
        alert('Thank you for your review!');
        document.querySelector('.modal').remove();
        showClientDashboard();
    } else {
        alert('Failed to submit review: ' + result.error);
    }
}

// ====================================
// LOGOUT
// ====================================

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        sessionStorage.clear();
        
        // Redirect to login
        console.log('✅ Logged out successfully');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    }
}

// ====================================
// UTILITY
// ====================================

// ====================================
// ADMIN ORDERS VIEW
// ====================================
async function showAdminOrders() {
    console.log('📦 Loading Admin Orders...');
    
    if (!api) {
        console.error('❌ API not initialized');
        alert('Error: API client not initialized');
        return;
    }
    
    // Load all orders
    const result = await api.getAllOrders();
    if (result.success) {
        displayAdminOrdersList(result.data);
    } else {
        console.error('❌ Failed to load orders:', result.error);
        alert('Failed to load orders: ' + result.error);
    }
    
    // Show admin orders panel
    const adminOrdersPanel = document.getElementById('adminOrdersPanel');
    if (adminOrdersPanel) {
        adminOrdersPanel.style.display = 'block';
        console.log('✅ Admin orders panel displayed');
    } else {
        console.warn('⚠️ Admin Orders panel not found');
    }
}

function displayAdminOrdersList(orders) {
    const ordersList = document.getElementById('adminOrdersList');
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders found</p>';
        return;
    }
    
    const html = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <strong>Order #${order.id}</strong>
                <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-details">
                <p><strong>Client:</strong> ${order.client_name}</p>
                <p><strong>Delivery To:</strong> ${order.delivery_address}</p>
                <p><strong>Distance:</strong> ${order.distance} km</p>
                <p><strong>Price:</strong> $${order.price.toFixed(2)}</p>
                <p><strong>Description:</strong> ${order.product_description}</p>
            </div>
        </div>
    `).join('');
    
    ordersList.innerHTML = html;
    console.log('✅ Admin orders displayed');
}

function showAdminSettings() {
    console.log('⚙️ Loading Admin Settings...');
    
    const adminSettingsPanel = document.getElementById('adminSettingsPanel');
    if (adminSettingsPanel) {
        adminSettingsPanel.style.display = 'block';
    } else {
        alert('⚙️ Admin Settings\n\nFeatures:\n- System Configuration\n- Backup Database\n- View Logs\n\nComing in ETAP 3');
    }
}

// ====================================
// COURIER ORDERS & SETTINGS
// ====================================
async function showCourierOrders() {
    console.log('📦 Loading Courier Orders...');
    
    if (!api) {
        console.error('❌ API not initialized');
        alert('Error: API client not initialized');
        return;
    }
    
    // Load my orders
    const result = await api.getCourierOrders();
    if (result.success) {
        displayCourierOrdersList(result.data);
    } else {
        console.error('❌ Failed to load courier orders:', result.error);
        alert('Failed to load orders: ' + result.error);
    }
    
    const courierOrdersPanel = document.getElementById('courierOrdersPanel');
    if (courierOrdersPanel) {
        courierOrdersPanel.style.display = 'block';
    } else {
        console.warn('⚠️ Courier Orders panel not found');
    }
}

function displayCourierOrdersList(orders) {
    const ordersList = document.getElementById('courierOrdersList');
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders assigned</p>';
        return;
    }
    
    const html = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <strong>Order #${order.id}</strong>
                <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-details">
                <p><strong>Client:</strong> ${order.client_name}</p>
                <p><strong>Delivery To:</strong> ${order.delivery_address}</p>
                <p><strong>Distance:</strong> ${order.distance} km</p>
                <p><strong>Price:</strong> $${order.price.toFixed(2)}</p>
            </div>
        </div>
    `).join('');
    
    ordersList.innerHTML = html;
    console.log('✅ Courier orders displayed');
}

function showCourierSettings() {
    console.log('⚙️ Loading Courier Settings...');
    
    const courierSettingsPanel = document.getElementById('courierSettingsPanel');
    if (courierSettingsPanel) {
        courierSettingsPanel.style.display = 'block';
    } else {
        alert('⚙️ Courier Settings\n\nFeatures:\n- Profile Settings\n- Vehicle Information\n- Availability\n\nComing in ETAP 3');
    }
}

// ====================================
// CLIENT ORDERS & SETTINGS
// ====================================
async function showClientOrders() {
    console.log('📦 Loading Client Orders...');
    
    if (!api) {
        console.error('❌ API not initialized');
        alert('Error: API client not initialized');
        return;
    }
    
    // Load my orders
    const result = await api.getMyOrders();
    if (result.success) {
        displayClientOrdersList(result.data);
    } else {
        console.error('❌ Failed to load client orders:', result.error);
        alert('Failed to load orders: ' + result.error);
    }
    
    const clientOrdersPanel = document.getElementById('clientOrdersPanel');
    if (clientOrdersPanel) {
        clientOrdersPanel.style.display = 'block';
    } else {
        console.warn('⚠️ Client Orders panel not found');
    }
}

function displayClientOrdersList(orders) {
    const ordersList = document.getElementById('clientOrdersList');
    if (!ordersList) return;
    
    if (orders.length === 0) {
        ordersList.innerHTML = '<p>No orders created yet. Start by creating a new order!</p>';
        return;
    }
    
    const html = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <strong>Order #${order.id}</strong>
                <span class="status-badge status-${order.status}">${order.status.toUpperCase()}</span>
            </div>
            <div class="order-details">
                <p><strong>Delivery To:</strong> ${order.delivery_address}</p>
                <p><strong>Distance:</strong> ${order.distance} km</p>
                <p><strong>Price:</strong> $${order.price.toFixed(2)}</p>
                <p><strong>Item:</strong> ${order.product_description}</p>
                ${order.courier_name ? `<p><strong>Courier:</strong> ${order.courier_name}</p>` : ''}
            </div>
        </div>
    `).join('');
    
    ordersList.innerHTML = html;
    console.log('✅ Client orders displayed');
}

function showClientSettings() {
    console.log('⚙️ Loading Client Settings...');
    
    const clientSettingsPanel = document.getElementById('clientSettingsPanel');
    if (clientSettingsPanel) {
        clientSettingsPanel.style.display = 'block';
    } else {
        alert('⚙️ Client Settings\n\nFeatures:\n- Profile Information\n- Payment Methods\n- Saved Addresses\n\nComing in ETAP 3');
    }
}

async function loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    // Data will be loaded based on role
}

console.log('✅ App script loaded');
