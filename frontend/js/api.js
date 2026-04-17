class DeliveryAPI {
    constructor() {
        this.apiBase = 'http://localhost:5000/api';
        this.token = localStorage.getItem('auth_token');
    }

    // ====================================
    // AUTHENTICATION METHODS
    // ====================================

    async register(username, email, password, role = 'user') {
        try {
            const response = await fetch(`${this.apiBase}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, role })
            });
            const data = await response.json();
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async login(username, password) {
        try {
            const response = await fetch(`${this.apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            
            if (response.ok) {
                this.token = data.access_token;
                localStorage.setItem('auth_token', data.access_token);
                localStorage.setItem('current_user', JSON.stringify(data.user));
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getCurrentUser() {
        try {
            const response = await fetch(`${this.apiBase}/auth/me`, {
                method: 'GET',
                headers: this._getAuthHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('current_user', JSON.stringify(data));
                return { success: true, data };
            } else if (response.status === 401) {
                this.logout();
                return { success: false, error: 'Token expired' };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async logout() {
        try {
            await fetch(`${this.apiBase}/auth/logout`, {
                method: 'POST',
                headers: this._getAuthHeaders()
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        localStorage.removeItem('auth_token');
        localStorage.removeItem('current_user');
        this.token = null;
        window.location.href = 'login.html';
    }

    // ====================================
    // ADMIN METHODS
    // ====================================

    async getAllUsers() {
        try {
            const response = await fetch(`${this.apiBase}/admin/users`, {
                headers: this._getAuthHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async changeUserRole(userId, role) {
        try {
            const response = await fetch(`${this.apiBase}/admin/users/${userId}/role`, {
                method: 'PUT',
                headers: this._getAuthHeaders(),
                body: JSON.stringify({ role })
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getAdminStats() {
        try {
            const response = await fetch(`${this.apiBase}/admin/stats`, {
                headers: this._getAuthHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getAllOrders() {
        try {
            const response = await fetch(`${this.apiBase}/admin/orders`, {
                headers: this._getAuthHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ====================================
    // ORDER METHODS (CLIENT)
    // ====================================

    async createOrder(deliveryAddress, productDescription, options = {}) {
        try {
            const response = await fetch(`${this.apiBase}/orders/create`, {
                method: 'POST',
                headers: this._getAuthHeaders(),
                body: JSON.stringify({
                    delivery_address: deliveryAddress,
                    product_description: productDescription,
                    product_category: options.category || 'other',
                    is_urgent: options.urgent || false,
                    distance_km: options.distance || 2.5
                })
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getMyOrders() {
        try {
            const response = await fetch(`${this.apiBase}/orders/my`, {
                headers: this._getAuthHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getOrder(orderId) {
        try {
            const response = await fetch(`${this.apiBase}/orders/${orderId}`, {
                headers: this._getAuthHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async cancelOrder(orderId) {
        try {
            const response = await fetch(`${this.apiBase}/orders/${orderId}/cancel`, {
                method: 'DELETE',
                headers: this._getAuthHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ====================================
    // COURIER METHODS
    // ====================================

    async getAvailableOrders() {
        try {
            const response = await fetch(`${this.apiBase}/courier/available`, {
                headers: this._getAuthHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getCourierOrders() {
        try {
            const response = await fetch(`${this.apiBase}/courier/my-orders`, {
                headers: this._getAuthHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async acceptOrder(orderId) {
        try {
            const response = await fetch(`${this.apiBase}/courier/accept/${orderId}`, {
                method: 'POST',
                headers: this._getAuthHeaders()
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateOrderStatus(orderId, status) {
        try {
            const response = await fetch(`${this.apiBase}/courier/status/${orderId}`, {
                method: 'PUT',
                headers: this._getAuthHeaders(),
                body: JSON.stringify({ status })
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ====================================
    // REVIEW METHODS
    // ====================================

    async submitReview(orderId, rating, comment = '') {
        try {
            const response = await fetch(`${this.apiBase}/reviews/${orderId}`, {
                method: 'POST',
                headers: this._getAuthHeaders(),
                body: JSON.stringify({ rating, comment })
            });
            const data = await response.json();
            
            if (response.ok) {
                return { success: true, data };
            }
            return { success: false, error: data.error };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ====================================
    // UTILITY METHODS
    // ====================================

    _getAuthHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    isAuthenticated() {
        return !!this.token;
    }

    getCurrentUserFromStorage() {
        const user = localStorage.getItem('current_user');
        return user ? JSON.parse(user) : null;
    }

    updateToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }
}

// Export for use
const api = new DeliveryAPI();
