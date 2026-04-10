/**
 * Offline Storage Manager
 * Управління локальним зберіганням даних за допомогою IndexedDB
 */

const DB_NAME = 'DeliveryManagerDB';
const DB_VERSION = 1;
const ORDERS_STORE = 'orders';
const PENDING_CHANGES_STORE = 'pendingChanges';

let db = null;

/**
 * Ініціалізація IndexedDB
 */
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('❌ Помилка відкриття БД:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            db = request.result;
            console.log('✅ IndexedDB ініціалізована');
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // Створити Object Store для замовлень
            if (!db.objectStoreNames.contains(ORDERS_STORE)) {
                const ordersStore = db.createObjectStore(ORDERS_STORE, { keyPath: 'id' });
                ordersStore.createIndex('status', 'status', { unique: false });
                ordersStore.createIndex('date', 'date', { unique: false });
            }

            // Створити Object Store для очікуючих змін
            if (!db.objectStoreNames.contains(PENDING_CHANGES_STORE)) {
                db.createObjectStore(PENDING_CHANGES_STORE, { keyPath: 'id', autoIncrement: true });
            }

            console.log('✅ Object Stores створені');
        };
    });
}

/**
 * Отримати всі замовлення з БД
 */
async function getOrdersFromDB() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(ORDERS_STORE, 'readonly');
        const store = transaction.objectStore(ORDERS_STORE);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

/**
 * Зберегти замовлення в БД
 */
async function addOrderToDB(order) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(ORDERS_STORE, 'readwrite');
        const store = transaction.objectStore(ORDERS_STORE);
        const request = store.add(order);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log('✅ Замовлення збережено локально');
            resolve(request.result);
        };
    });
}

/**
 * Оновити замовлення в БД
 */
async function updateOrderInDB(order) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(ORDERS_STORE, 'readwrite');
        const store = transaction.objectStore(ORDERS_STORE);
        const request = store.put(order);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log('✅ Замовлення оновлено локально');
            resolve(request.result);
        };
    });
}

/**
 * Видалити замовлення з БД
 */
async function deleteOrderFromDB(id) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(ORDERS_STORE, 'readwrite');
        const store = transaction.objectStore(ORDERS_STORE);
        const request = store.delete(id);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log('✅ Замовлення видалено локально');
            resolve();
        };
    });
}

/**
 * Зберегти всі замовлення (перезаписати)
 */
async function saveOrdersToDB(orders) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(ORDERS_STORE, 'readwrite');
        const store = transaction.objectStore(ORDERS_STORE);
        const request = store.clear();

        request.onsuccess = () => {
            orders.forEach(order => {
                store.add(order);
            });
            console.log(`✅ ${orders.length} замовлень збережено локально`);
            resolve();
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Додати замовлення локально (для офлайн режиму)
 */
async function addOrderLocally(address, status = 'нове') {
    const order = {
        id: Date.now(), // Тимчасовий ID
        address: address,
        status: status,
        date: new Date().toISOString(),
        synced: false
    };

    await addOrderToDB(order);
    await addPendingChange('add', order);
    
    return order;
}

/**
 * Оновити замовлення локально (для офлайн режиму)
 */
async function updateOrderLocally(id, address, status) {
    const order = {
        id: id,
        address: address,
        status: status,
        date: new Date().toISOString(),
        synced: false
    };

    await updateOrderInDB(order);
    await addPendingChange('update', order);
    
    return order;
}

/**
 * Видалити замовлення локально (для офлайн режиму)
 */
async function deleteOrderLocally(id) {
    await deleteOrderFromDB(id);
    await addPendingChange('delete', { id: id });
}

/**
 * Додати зміну до списку очікуючих (для синхронізації)
 */
async function addPendingChange(action, data) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PENDING_CHANGES_STORE, 'readwrite');
        const store = transaction.objectStore(PENDING_CHANGES_STORE);
        const request = store.add({
            action: action,
            data: data,
            timestamp: new Date().toISOString(),
            synced: false
        });

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            console.log(`📝 Зміна "${action}" додана до очікування`);
            resolve(request.result);
        };
    });
}

/**
 * Отримати очікуючі зміни
 */
async function getPendingChanges() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PENDING_CHANGES_STORE, 'readonly');
        const store = transaction.objectStore(PENDING_CHANGES_STORE);
        const request = store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const unsynced = request.result.filter(change => !change.synced);
            console.log(`📝 ${unsynced.length} очікуючих змін`);
            resolve(unsynced);
        };
    });
}

/**
 * Позначити зміну як синхронізовану
 */
async function markChangeAsSynced(changeId, serverId = null) {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PENDING_CHANGES_STORE, 'readwrite');
        const store = transaction.objectStore(PENDING_CHANGES_STORE);
        const request = store.get(changeId);

        request.onsuccess = () => {
            const change = request.result;
            if (change) {
                change.synced = true;
                change.serverId = serverId;
                const updateRequest = store.put(change);
                
                updateRequest.onsuccess = () => {
                    console.log('✅ Зміна позначена як синхронізована');
                    resolve();
                };
                
                updateRequest.onerror = () => reject(updateRequest.error);
            }
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Очистити всі синхронізовані зміни
 */
async function clearSyncedChanges() {
    if (!db) await initDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(PENDING_CHANGES_STORE, 'readwrite');
        const store = transaction.objectStore(PENDING_CHANGES_STORE);
        
        const request = store.openCursor();
        
        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                if (cursor.value.synced) {
                    cursor.delete();
                }
                cursor.continue();
            } else {
                console.log('✅ Синхронізовані зміни видалені');
                resolve();
            }
        };

        request.onerror = () => reject(request.error);
    });
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initDB();
    } catch (error) {
        console.error('❌ Помилка ініціалізації IndexedDB:', error);
    }
});
