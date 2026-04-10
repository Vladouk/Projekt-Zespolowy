# 📚 Примеры использования ETAP 2 - 3 роли

## 👤 Сценарий 1: CLIENT создает заказ

### Шаг 1: Клиент логинится

```javascript
// frontend/js/client.js
async function clientLogin() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'ivan.client@mail.com',
      password: 'clientpass123'
    })
  });
  
  const data = await response.json();
  localStorage.setItem('auth_token', data.access_token);
  window.location.href = 'client-dashboard.html';
}
```

### Шаг 2: Клиент создает заказ

```javascript
// frontend/client-dashboard.html
async function createDeliveryOrder() {
  // Получаем текущее местоположение
  const position = await new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(resolve);
  });
  
  const order = {
    delivery_address: document.getElementById('address').value,  // "ул. Шевченко, 20"
    product_description: document.getElementById('product').value,  // "Пиво 2 бутылки"
    product_category: 'beverages',
    client_lat: position.coords.latitude,
    client_lon: position.coords.longitude,
    is_urgent: document.getElementById('urgent').checked
  };
  
  const response = await fetch('/api/orders/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    },
    body: JSON.stringify(order)
  });
  
  const result = await response.json();
  
  // UI обновление
  showNotification(`✅ Заказ создан! ID: ${result.order_id}`);
  showPriceEstimate(result.price);  // Показываем 37.50 грн
  
  // Начинаем отслеживание
  trackOrderStatus(result.order_id);
}
```

### Шаг 3: Клиент видит что "Курьер найден"

```html
<!-- frontend/client-dashboard.html -->
<div id="orderStatus" class="order-status-card">
  <h2>Ваш заказ #1</h2>
  
  <div class="status-badge">
    ⏳ Ищем курьера...
  </div>
  
  <!-- После того как курьер принял -->
  <div class="courier-card">
    <div class="courier-header">
      ✅ КУРЬЕР НАЙДЕН!
    </div>
    
    <div class="courier-info">
      <img src="courier-photo.jpg" alt="Courier">
      
      <div class="courier-details">
        <h3>🚗 Иван Петров</h3>
        <p>⭐ 4.8 / 5.0 (120 отзывов)</p>
        <p>📱 +38-095-123-4567</p>
        <p>🚙 Автомобиль, номер АА 1234 КК</p>
      </div>
    </div>
    
    <div class="status-timeline">
      <div class="status-item active">
        <span>✅ Заказ создан</span>
        <time>14:30</time>
      </div>
      <div class="status-item active">
        <span>✅ Курьер найден</span>
        <time>14:32</time>
      </div>
      <div class="status-item">
        <span>⏳ В пути к вам</span>
        <time>~14:47</time>
      </div>
      <div class="status-item">
        <span>⏳ Доставлено</span>
        <time>TBD</time>
      </div>
    </div>
    
    <button class="btn-call">📞 ЗВОНИТЬ КУРЬЕРУ</button>
    <button class="btn-message">💬 НАПИСАТЬ СООБЩЕНИЕ</button>
  </div>
</div>
```

### Шаг 4: Клиент оставляет отзыв

```javascript
// frontend/js/client.js
async function submitReview(orderId) {
  const review = {
    rating: document.getElementById('rating-input').value,  // 1-5
    comment: document.getElementById('comment-input').value
  };
  
  const response = await fetch(`/api/reviews/${orderId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    },
    body: JSON.stringify(review)
  });
  
  if (response.ok) {
    showNotification('✅ Спасибо за отзыв!');
  }
}
```

---

## 🚗 Сценарий 2: COURIER принимает заказ

### Шаг 1: Курьер логинится

```javascript
// frontend/js/courier.js
async function courierLogin() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'petrov.courier@mail.com',
      password: 'courierpass123'
    })
  });
  
  const data = await response.json();
  localStorage.setItem('auth_token', data.access_token);
  
  // Запускаем GPS трекинг
  startGPSTracking();
  
  window.location.href = 'courier-dashboard.html';
}
```

### Шаг 2: Курьер видит доступные заказы

```javascript
// frontend/js/courier.js
async function loadAvailableOrders() {
  const response = await fetch('/api/courier/available', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });
  
  const orders = await response.json();
  
  // Backend вернет только заказы в радиусе 5км
  // [
  //   {
  //     "id": 1,
  //     "product": "Пиво 2 бутылки",
  //     "delivery_address": "ул. Шевченко, 20",
  //     "distance_km": 2.5,
  //     "suggested_price": 37.50,
  //     "client_rating": 4.9,
  //     "estimated_time": 15
  //   },
  //   ...
  // ]
  
  displayAvailableOrders(orders);
}

function displayAvailableOrders(orders) {
  const container = document.getElementById('available-orders');
  
  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">Заказ #${order.id}</span>
        <span class="distance">📏 ${order.distance_km} км</span>
      </div>
      
      <div class="order-product">
        📦 ${order.product}
      </div>
      
      <div class="order-location">
        📍 ${order.delivery_address}
      </div>
      
      <div class="order-pricing">
        💰 ${order.suggested_price} грн
        (рекомендация)
      </div>
      
      <div class="order-client-info">
        ⭐ Клиент: ${order.client_rating} (50 отзывов)
      </div>
      
      <div class="order-eta">
        ⏱️ Примерно ${order.estimated_time} мин
      </div>
      
      <button class="btn-accept" onclick="acceptOrder(${order.id})">
        ✅ ПРИНЯТЬ
      </button>
      <button class="btn-skip">
        ❌ ПРОПУСТИТЬ
      </button>
    </div>
  `).join('');
}
```

### Шаг 3: Курьер принимает заказ

```javascript
// frontend/js/courier.js
async function acceptOrder(orderId) {
  const response = await fetch(`/api/courier/accept/${orderId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });
  
  const result = await response.json();
  
  if (response.ok) {
    showNotification('✅ Вы приняли заказ!');
    
    // Переходим на детали доставки
    showDeliveryDetails(orderId);
    
    // Начинаем отправлять GPS каждые 30 сек
    startLocationTracking(orderId);
  } else {
    showError(`❌ ${result.error}`);
  }
}
```

### Шаг 4: Курьер отслеживает доставку

```javascript
// frontend/js/courier.js
async function startLocationTracking(orderId) {
  setInterval(async () => {
    const position = await getPosition();
    
    // Отправляем текущую локацию на сервер
    await fetch('/api/courier/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        order_id: orderId
      })
    });
  }, 30000);  // Каждые 30 секунд
}

async function updateDeliveryStatus(orderId, status) {
  // status может быть: "in_transit", "delivered", "problem"
  
  const response = await fetch(`/api/courier/status/${orderId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    },
    body: JSON.stringify({
      status: status
    })
  });
  
  if (response.ok) {
    showNotification(`✅ Статус обновлен: ${status}`);
  }
}
```

---

## 👨‍💼 Сценарий 3: ADMIN видит всё

### Шаг 1: Admin логинится

```javascript
// frontend/js/admin.js
async function adminLogin() {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  
  const data = await response.json();
  localStorage.setItem('auth_token', data.access_token);
  window.location.href = 'admin-dashboard.html';
}
```

### Шаг 2: Admin видит статистику

```javascript
// frontend/admin-dashboard.html
async function loadDashboardStats() {
  const response = await fetch('/api/admin/stats', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });
  
  const stats = await response.json();
  // {
  //   "total_orders": 156,
  //   "orders_today": 24,
  //   "active_couriers": 7,
  //   "total_couriers": 12,
  //   "total_revenue": 15420.50,
  //   "avg_rating": 4.8,
  //   "completed_today": 20
  // }
  
  document.getElementById('stats-container').innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <h3>📊 Всего заказов</h3>
        <div class="stat-value">${stats.total_orders}</div>
        <div class="stat-subtext">Сегодня: ${stats.orders_today}</div>
      </div>
      
      <div class="stat-card">
        <h3>🚗 Курьеры онлайн</h3>
        <div class="stat-value">${stats.active_couriers}/${stats.total_couriers}</div>
      </div>
      
      <div class="stat-card">
        <h3>💰 Доход</h3>
        <div class="stat-value">${stats.total_revenue.toFixed(2)} грн</div>
      </div>
      
      <div class="stat-card">
        <h3>⭐ Средний рейтинг</h3>
        <div class="stat-value">${stats.avg_rating}</div>
      </div>
    </div>
  `;
}
```

### Шаг 3: Admin видит всех курьеров на карте

```javascript
// frontend/admin-dashboard.html
async function loadCourierMap() {
  const response = await fetch('/api/admin/map', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });
  
  const courierLocations = await response.json();
  // [
  //   { id: 1, name: "Иван", lat: 50.4501, lon: 30.5234, status: "on_delivery" },
  //   { id: 2, name: "Мария", lat: 50.4650, lon: 30.5300, status: "online" },
  //   ...
  // ]
  
  // Инициализируем карту (используя Leaflet или Google Maps)
  const map = L.map('courier-map').setView([50.4501, 30.5234], 12);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
  
  // Добавляем маркеры для каждого курьера
  courierLocations.forEach(courier => {
    const color = courier.status === 'on_delivery' ? 'red' : 'green';
    
    L.circleMarker([courier.lat, courier.lon], {
      radius: 8,
      fillColor: color,
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    })
    .bindPopup(`
      <strong>${courier.name}</strong><br>
      Статус: ${courier.status}<br>
      📍 ${courier.lat.toFixed(4)}, ${courier.lon.toFixed(4)}
    `)
    .addTo(map);
  });
}
```

### Шаг 4: Admin видит все заказы и может редактировать

```javascript
// frontend/admin-dashboard.html
async function loadAllOrders() {
  const response = await fetch('/api/admin/orders', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
    }
  });
  
  const orders = await response.json();
  
  const table = document.getElementById('orders-table');
  table.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Клиент</th>
          <th>Курьер</th>
          <th>Статус</th>
          <th>Цена</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        ${orders.map(order => `
          <tr>
            <td>#${order.id}</td>
            <td>${order.client_name}</td>
            <td>${order.courier_name || 'Не назначен'}</td>
            <td>
              <span class="status-badge status-${order.status}">
                ${order.status}
              </span>
            </td>
            <td>${order.total_price} грн</td>
            <td>
              <button onclick="editOrder(${order.id})">✏️ Редактировать</button>
              <button onclick="deleteOrder(${order.id})">❌ Удалить</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

async function editOrder(orderId) {
  // Admin может изменить цену, статус, назначить курьера и т.д.
  const newPrice = prompt('Новая цена:');
  
  if (newPrice) {
    const response = await fetch(`/api/admin/order/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        actual_delivery_price: parseFloat(newPrice)
      })
    });
    
    if (response.ok) {
      showNotification('✅ Заказ обновлен!');
      loadAllOrders();
    }
  }
}
```

---

## 🔌 Backend сторона (Python/Flask)

### Создание заказа (Client)

```python
# backend/app.py
from flask import request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
import math
from datetime import datetime

@app.route('/api/orders/create', methods=['POST'])
@jwt_required()
def create_order():
    """Создание заказа клиентом"""
    client_id = get_jwt()['user_id']
    data = request.json
    
    # Валидация
    if not data.get('delivery_address'):
        return jsonify({'error': 'Address required'}), 400
    
    if not data.get('product_description'):
        return jsonify({'error': 'Product description required'}), 400
    
    # Конвертируем адрес в координаты (простая реализация)
    delivery_lat, delivery_lon = geocode_address(data['delivery_address'])
    
    # Рассчитываем расстояние
    distance = haversine_distance(
        data['client_lat'], data['client_lon'],
        delivery_lat, delivery_lon
    )
    
    # Рассчитываем рекомендуемую цену
    suggested_price = calculate_delivery_price(
        distance,
        data.get('product_category', 'other'),
        data.get('is_urgent', False)
    )
    
    # Создаем заказ
    order = Order(
        client_id=client_id,
        delivery_address=data['delivery_address'],
        delivery_lat=delivery_lat,
        delivery_lon=delivery_lon,
        product_description=data['product_description'],
        product_category=data.get('product_category', 'other'),
        distance_km=distance,
        suggested_delivery_price=suggested_price,
        status='new',
        created_at=datetime.utcnow()
    )
    
    db.session.add(order)
    db.session.commit()
    
    # ВАЖНО: Ищем и отправляем уведомление ближайшим курьерам
    find_and_notify_nearby_couriers(order)
    
    return jsonify({
        'order_id': order.id,
        'price': suggested_price,
        'distance': distance,
        'status': 'new'
    }), 201


def haversine_distance(lat1, lon1, lat2, lon2):
    """Расстояние между двумя точками (км)"""
    R = 6371  # Радиус Земли
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def calculate_delivery_price(distance, category, is_urgent):
    """Расчет цены доставки"""
    BASE_PRICE = 15  # грн/км
    
    CATEGORY_COEF = {
        'beverages': 1.0,
        'food': 1.5,
        'electronics': 2.0,
        'documents': 0.8,
        'other': 1.2
    }
    
    category_coef = CATEGORY_COEF.get(category, 1.2)
    urgency_coef = 2.0 if is_urgent else 1.0
    
    price = BASE_PRICE * distance * category_coef * urgency_coef
    
    return round(price * 2) / 2


def find_and_notify_nearby_couriers(order):
    """Поиск ближайших курьеров в радиусе 5км"""
    
    # Получаем всех активных курьеров
    couriers = Courier.query.filter(
        Courier.status.in_(['online', 'on_delivery'])
    ).all()
    
    nearby = []
    
    for courier in couriers:
        distance = haversine_distance(
            courier.current_lat,
            courier.current_lon,
            order.delivery_lat,
            order.delivery_lon
        )
        
        if distance <= 5.0:  # В радиусе 5км
            nearby.append({
                'courier': courier,
                'distance': distance
            })
    
    # Сортируем по расстоянию
    nearby.sort(key=lambda x: x['distance'])
    
    # Отправляем уведомления первым 5
    for i, item in enumerate(nearby[:5]):
        courier = item['courier']
        send_notification(
            user_id=courier.user_id,
            title='📦 Новый заказ!',
            message=f"{order.product_description} ({item['distance']:.1f}км)",
            order_id=order.id,
            priority=i
        )
```

### Принятие заказа (Courier)

```python
# backend/app.py
@app.route('/api/courier/accept/<int:order_id>', methods=['POST'])
@jwt_required()
def accept_order(order_id):
    """Курьер принимает заказ"""
    
    user_id = get_jwt()['user_id']
    
    # Получаем курьера
    courier = Courier.query.filter_by(user_id=user_id).first()
    if not courier:
        return jsonify({'error': 'User is not a courier'}), 403
    
    # Получаем заказ
    order = Order.query.get(order_id)
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    # Проверяем что заказ еще не принят
    if order.courier_id is not None:
        return jsonify({'error': 'Order already assigned'}), 409
    
    # Проверяем расстояние
    distance = haversine_distance(
        courier.current_lat,
        courier.current_lon,
        order.delivery_lat,
        order.delivery_lon
    )
    
    if distance > 5.0:
        return jsonify({
            'error': f'Too far: {distance:.1f}km (max 5km)'
        }), 400
    
    # Назначаем курьера
    order.courier_id = courier.id
    order.status = 'assigned'
    order.assigned_at = datetime.utcnow()
    
    db.session.commit()
    
    # Отправляем уведомление клиенту
    send_notification(
        user_id=order.client_id,
        title='✅ Курьер найден!',
        message=f"Курьер {courier.user.username} едет к вам",
        order_id=order_id
    )
    
    return jsonify({'message': 'Order accepted', 'order_id': order_id})
```

---

Это основные примеры для ETAP 2! Все три роли полностью функциональны.
