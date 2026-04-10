/**
 * API Client for Delivery Manager
 * Обробка всіх запитів до сервера
 */

class DeliveryAPI {
    constructor(baseURL = 'http://localhost:5000/api') {
        this.baseURL = baseURL;
        this.isOnline = navigator.onLine;
        
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('✅ З\'єднання відновлено');
            updateConnectionStatus(true);
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('❌ З\'єднання втрачено');
            updateConnectionStatus(false);
        });
    }

    /**
     * Отримати всі замовлення
     */
    async getOrders() {
        try {
            if (!this.isOnline) {
                console.log('📱 Режим офлайну: завантаження з IndexedDB');
                return await getOrdersFromDB();
            }

            const response = await fetch(`${this.baseURL}/orders`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const orders = await response.json();
            
            // Зберегти в IndexedDB для офлайн доступу
            await saveOrdersToDB(orders);
            
            return orders;
        } catch (error) {
            console.error('❌ Помилка отримання замовлень:', error);
            // Спробувати отримати з IndexedDB як fallback
            return await getOrdersFromDB();
        }
    }

    /**
     * Додати нове замовлення
     */
    async addOrder(address, status = 'нове') {
        try {
            if (!this.isOnline) {
                // Зберегти локально і позначити для синхронізації
                const order = await addOrderLocally(address, status);
                console.log('📱 Замовлення збережено локально для синхронізації');
                return order;
            }

            const response = await fetch(`${this.baseURL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: address,
                    status: status
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const order = await response.json();
            
            // Оновити IndexedDB
            await addOrderToDB(order);
            
            return order;
        } catch (error) {
            console.error('❌ Помилка додавання замовлення:', error);
            // Зберегти локально
            return await addOrderLocally(address, status);
        }
    }

    /**
     * Оновити замовлення
     */
    async updateOrder(id, address, status) {
        try {
            if (!this.isOnline) {
                // Зберегти локально
                const order = await updateOrderLocally(id, address, status);
                console.log('📱 Замовлення оновлено локально для синхронізації');
                return order;
            }

            const response = await fetch(`${this.baseURL}/orders/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    address: address,
                    status: status
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const order = await response.json();
            
            // Оновити IndexedDB
            await updateOrderInDB(order);
            
            return order;
        } catch (error) {
            console.error('❌ Помилка оновлення замовлення:', error);
            // Зберегти локально
            return await updateOrderLocally(id, address, status);
        }
    }

    /**
     * Видалити замовлення
     */
    async deleteOrder(id) {
        try {
            if (!this.isOnline) {
                // Видалити локально
                await deleteOrderLocally(id);
                console.log('📱 Замовлення видалено локально для синхронізації');
                return { success: true };
            }

            const response = await fetch(`${this.baseURL}/orders/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Видалити з IndexedDB
            await deleteOrderFromDB(id);
            
            return { success: true };
        } catch (error) {
            console.error('❌ Помилка видалення замовлення:', error);
            // Видалити локально
            await deleteOrderLocally(id);
            return { success: true };
        }
    }

    /**
     * Синхронізувати локальні зміни з сервером
     */
    async syncWithServer() {
        if (!this.isOnline) {
            console.log('⚠️  Немає з\'єднання для синхронізації');
            return { success: false, message: 'Немає з\'єднання' };
        }

        try {
            const pendingChanges = await getPendingChanges();
            
            if (pendingChanges.length === 0) {
                return { success: true, message: 'Немає змін для синхронізації' };
            }

            console.log(`🔄 Синхронізація ${pendingChanges.length} змін...`);
            
            for (const change of pendingChanges) {
                try {
                    if (change.action === 'add') {
                        const response = await fetch(`${this.baseURL}/orders`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                address: change.data.address,
                                status: change.data.status
                            })
                        });
                        const order = await response.json();
                        await markChangeAsSynced(change.id, order.id);
                    } else if (change.action === 'update') {
                        await fetch(`${this.baseURL}/orders/${change.data.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                address: change.data.address,
                                status: change.data.status
                            })
                        });
                        await markChangeAsSynced(change.id);
                    } else if (change.action === 'delete') {
                        await fetch(`${this.baseURL}/orders/${change.data.id}`, {
                            method: 'DELETE'
                        });
                        await markChangeAsSynced(change.id);
                    }
                } catch (error) {
                    console.error('❌ Помилка синхронізації зміни:', error);
                }
            }

            // Оновити локальний список
            const orders = await this.getOrders();
            await saveOrdersToDB(orders);
            
            return { 
                success: true, 
                message: `✅ Синхронізовано ${pendingChanges.length} змін` 
            };
        } catch (error) {
            console.error('❌ Помилка синхронізації:', error);
            return { success: false, message: 'Помилка синхронізації' };
        }
    }
}

// Глобальний екземпляр API
const api = new DeliveryAPI();

/**
 * Оновити статус з\'єднання в UI
 */
function updateConnectionStatus(isOnline) {
    const statusDot = document.getElementById('connectionStatus');
    const statusText = document.getElementById('statusText');
    
    if (isOnline) {
        statusDot.classList.remove('offline');
        statusDot.classList.add('online');
        statusText.textContent = 'Онлайн';
    } else {
        statusDot.classList.remove('online');
        statusDot.classList.add('offline');
        statusText.textContent = 'Офлайн (дані збережені локально)';
    }
}
