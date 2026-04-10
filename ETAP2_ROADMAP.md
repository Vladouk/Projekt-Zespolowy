# 📅 ETAP 2 - Roadmap и Timeline

## 🗓️ Общий план на 4 недели

```
НЕДЕЛЯ 1: Backend (Models + Algorithms)    [HIGH PRIORITY] ⭐⭐⭐
НЕДЕЛЯ 2: Frontend Client (Order Creation) [HIGH PRIORITY] ⭐⭐⭐
НЕДЕЛЯ 3: Frontend Courier (Tracking)      [HIGH PRIORITY] ⭐⭐⭐
НЕДЕЛЯ 4: Admin + Testing + Optimization   [MEDIUM PRIORITY] ⭐⭐
```

---

## 📋 НЕДЕЛЯ 1: Backend структура

### День 1-2: Database Schema и Models

```python
# backend/models.py

class Courier(db.Model):
    """Модель курьера"""
    __tablename__ = 'couriers'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True)
    
    phone = db.Column(db.String(20), nullable=False)
    vehicle = db.Column(db.String(20), default='walking')  # walking, bike, car, motorcycle
    
    current_lat = db.Column(db.Float)
    current_lon = db.Column(db.Float)
    
    status = db.Column(db.String(20), default='offline')  # online, offline, on_delivery
    
    avg_rating = db.Column(db.Float, default=5.0)
    total_deliveries = db.Column(db.Integer, default=0)
    total_earnings = db.Column(db.Float, default=0)
    
    is_verified = db.Column(db.Boolean, default=False)
    documents_verified_at = db.Column(db.DateTime)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Order(db.Model):
    """Модель заказа (расширенная)"""
    __tablename__ = 'orders'
    
    id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    courier_id = db.Column(db.Integer, db.ForeignKey('couriers.id'))
    
    status = db.Column(db.String(20), default='new')  # new, assigned, in_transit, delivered, cancelled, problem
    
    # Delivery location
    delivery_address = db.Column(db.String(255), nullable=False)
    delivery_lat = db.Column(db.Float)
    delivery_lon = db.Column(db.Float)
    
    # Product info
    product_description = db.Column(db.String(255), nullable=False)
    product_category = db.Column(db.String(50), default='other')
    product_quantity = db.Column(db.Integer, default=1)
    product_weight_kg = db.Column(db.Float)
    
    # Pricing & distance
    distance_km = db.Column(db.Float)
    estimated_delivery_time_min = db.Column(db.Integer)
    base_delivery_price = db.Column(db.Float)
    suggested_delivery_price = db.Column(db.Float)
    actual_delivery_price = db.Column(db.Float)
    total_price = db.Column(db.Float)
    
    # Metadata
    is_urgent = db.Column(db.Boolean, default=False)
    notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    assigned_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)


class Review(db.Model):
    """Модель отзыва"""
    __tablename__ = 'reviews'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'), nullable=False)
    client_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    courier_id = db.Column(db.Integer, db.ForeignKey('couriers.id'), nullable=False)
    
    rating = db.Column(db.Integer, nullable=False)  # 1-5
    comment = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class CourierLocation(db.Model):
    """История GPS позиций курьера"""
    __tablename__ = 'courier_locations'
    
    id = db.Column(db.Integer, primary_key=True)
    courier_id = db.Column(db.Integer, db.ForeignKey('couriers.id'), nullable=False)
    order_id = db.Column(db.Integer, db.ForeignKey('orders.id'))
    
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    accuracy = db.Column(db.Float)
    
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
```

**Checklist:**
- [ ] Создать все 4 модели
- [ ] Создать миграции БД
- [ ] Протестировать создание таблиц

---

### День 3: Utility функции

```python
# backend/utils.py

import math

def haversine_distance(lat1, lon1, lat2, lon2):
    """Расстояние между двумя точками на Земле в км"""
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
    
    # Round to 0.50
    return round(price * 2) / 2


def find_nearby_couriers(delivery_lat, delivery_lon, radius_km=5.0):
    """Поиск курьеров в радиусе"""
    couriers = Courier.query.filter(
        Courier.status.in_(['online', 'on_delivery'])
    ).all()
    
    nearby = []
    
    for courier in couriers:
        if courier.current_lat is None or courier.current_lon is None:
            continue
        
        distance = haversine_distance(
            courier.current_lat, courier.current_lon,
            delivery_lat, delivery_lon
        )
        
        if distance <= radius_km:
            nearby.append({
                'courier': courier,
                'distance': distance
            })
    
    # Sort by distance
    nearby.sort(key=lambda x: x['distance'])
    
    return nearby
```

**Checklist:**
- [ ] Реализовать haversine_distance()
- [ ] Реализовать calculate_delivery_price()
- [ ] Реализовать find_nearby_couriers()
- [ ] Протестировать все функции

---

### День 4-5: API Endpoints

```python
# backend/routes/client_routes.py

@app.route('/api/orders/create', methods=['POST'])
@jwt_required()
def create_order():
    """Create new delivery order"""
    client_id = get_jwt()['user_id']
    data = request.json
    
    # Validate
    if not data.get('delivery_address'):
        return jsonify({'error': 'Address required'}), 400
    
    # Geocode address
    delivery_lat, delivery_lon = geocode_address(data['delivery_address'])
    
    # Calculate distance
    distance = haversine_distance(
        data['client_lat'], data['client_lon'],
        delivery_lat, delivery_lon
    )
    
    # Calculate price
    suggested_price = calculate_delivery_price(
        distance,
        data.get('product_category', 'other'),
        data.get('is_urgent', False)
    )
    
    # Create order
    order = Order(
        client_id=client_id,
        delivery_address=data['delivery_address'],
        delivery_lat=delivery_lat,
        delivery_lon=delivery_lon,
        product_description=data['product_description'],
        product_category=data.get('product_category', 'other'),
        distance_km=distance,
        suggested_delivery_price=suggested_price,
        status='new'
    )
    
    db.session.add(order)
    db.session.commit()
    
    # Find and notify nearby couriers
    nearby = find_nearby_couriers(delivery_lat, delivery_lon)
    for i, item in enumerate(nearby[:5]):
        send_notification(
            user_id=item['courier'].user_id,
            order_id=order.id,
            distance=item['distance'],
            priority=i
        )
    
    return jsonify({
        'order_id': order.id,
        'price': suggested_price,
        'distance': distance
    }), 201


# backend/routes/courier_routes.py

@app.route('/api/courier/available', methods=['GET'])
@jwt_required()
def get_available_orders():
    """Get available orders near courier"""
    user_id = get_jwt()['user_id']
    courier = Courier.query.filter_by(user_id=user_id).first()
    
    if not courier:
        return jsonify({'error': 'Not a courier'}), 403
    
    # Find all new orders
    new_orders = Order.query.filter_by(status='new').all()
    
    available = []
    for order in new_orders:
        distance = haversine_distance(
            courier.current_lat, courier.current_lon,
            order.delivery_lat, order.delivery_lon
        )
        
        if distance <= 5.0:
            available.append({
                'id': order.id,
                'product': order.product_description,
                'distance_km': round(distance, 1),
                'suggested_price': order.suggested_delivery_price,
                'client_rating': 4.9  # TODO: calculate from reviews
            })
    
    return jsonify(available)


@app.route('/api/courier/accept/<int:order_id>', methods=['POST'])
@jwt_required()
def accept_order(order_id):
    """Courier accepts order"""
    user_id = get_jwt()['user_id']
    courier = Courier.query.filter_by(user_id=user_id).first()
    
    if not courier:
        return jsonify({'error': 'Not a courier'}), 403
    
    order = Order.query.get(order_id)
    
    if order.courier_id is not None:
        return jsonify({'error': 'Already assigned'}), 409
    
    # Check distance
    distance = haversine_distance(
        courier.current_lat, courier.current_lon,
        order.delivery_lat, order.delivery_lon
    )
    
    if distance > 5.0:
        return jsonify({'error': f'Too far: {distance:.1f}km'}), 400
    
    # Assign
    order.courier_id = courier.id
    order.status = 'assigned'
    order.assigned_at = datetime.utcnow()
    
    db.session.commit()
    
    # Notify client
    send_notification_to_client(
        order.client_id,
        f"Courier found: {courier.user.username}"
    )
    
    return jsonify({'message': 'Accepted', 'order_id': order_id})
```

**Checklist:**
- [ ] POST /api/orders/create
- [ ] GET /api/courier/available
- [ ] POST /api/courier/accept/<id>
- [ ] PUT /api/courier/status/<id>
- [ ] POST /api/courier/location
- [ ] Протестировать все endpoints

---

## 📱 НЕДЕЛЯ 2: Frontend CLIENT

### День 1-2: HTML структура

```html
<!-- frontend/client-dashboard.html -->

<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Delivery Manager - Client</title>
    <link rel="stylesheet" href="css/client.css">
</head>
<body>
    <div class="container">
        <!-- Header с пользователем -->
        <header class="header">
            <h1>🚚 Delivery Manager</h1>
            <div id="user-info">
                <span id="username"></span>
                <button onclick="logout()" class="btn-logout">Выход</button>
            </div>
        </header>
        
        <!-- Форма создания заказа -->
        <section class="create-order-section">
            <h2>➕ Создать новый заказ</h2>
            
            <form id="order-form" class="order-form">
                <div class="form-group">
                    <label>📍 Адрес доставки</label>
                    <input type="text" id="delivery-address" required placeholder="ул. Шевченко, 20">
                </div>
                
                <div class="form-group">
                    <label>🛍️ Что заказать?</label>
                    <input type="text" id="product-description" required placeholder="Пиво 2 бутылки">
                </div>
                
                <div class="form-group">
                    <label>📦 Категория</label>
                    <select id="product-category">
                        <option value="beverages">🍺 Напитки</option>
                        <option value="food">🍕 Еда</option>
                        <option value="electronics">🖥️ Техника</option>
                        <option value="documents">📄 Документы</option>
                        <option value="other">📦 Другое</option>
                    </select>
                </div>
                
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="is-urgent">
                        ⚡ Срочно (доставка < 30 мин)
                    </label>
                </div>
                
                <div class="price-estimate">
                    <span>💰 Примерная цена:</span>
                    <span id="estimated-price">-</span>
                </div>
                
                <button type="submit" class="btn-submit">ЗАКАЗАТЬ</button>
            </form>
        </section>
        
        <!-- Статус текущего заказа -->
        <section id="order-status-section" class="order-status-section" style="display:none">
            <h2>Статус вашего заказа</h2>
            
            <div id="order-card" class="order-card">
                <div class="order-header">
                    <span>Заказ #<span id="order-number"></span></span>
                    <span id="order-status-badge" class="status-badge"></span>
                </div>
                
                <div id="courier-info" class="courier-info" style="display:none">
                    <h3>✅ Курьер найден!</h3>
                    <div class="courier-details">
                        <p>🚗 <strong id="courier-name"></strong></p>
                        <p>⭐ <span id="courier-rating"></span></p>
                        <p>📱 <span id="courier-phone"></span></p>
                    </div>
                </div>
                
                <div class="timeline">
                    <div class="timeline-item active">
                        <span>✅ Заказ создан</span>
                        <time id="created-time"></time>
                    </div>
                    <div id="timeline-assigned" class="timeline-item">
                        <span>⏳ Курьер найден</span>
                        <time id="assigned-time"></time>
                    </div>
                    <div id="timeline-transit" class="timeline-item">
                        <span>⏳ В пути</span>
                        <time id="transit-time"></time>
                    </div>
                    <div id="timeline-delivered" class="timeline-item">
                        <span>⏳ Доставлено</span>
                        <time id="delivered-time"></time>
                    </div>
                </div>
                
                <div id="review-section" class="review-section" style="display:none">
                    <h3>⭐ Оставить отзыв</h3>
                    <div class="rating-input">
                        <input type="radio" name="rating" value="5"> ⭐⭐⭐⭐⭐
                        <input type="radio" name="rating" value="4"> ⭐⭐⭐⭐
                        <input type="radio" name="rating" value="3"> ⭐⭐⭐
                        <input type="radio" name="rating" value="2"> ⭐⭐
                        <input type="radio" name="rating" value="1"> ⭐
                    </div>
                    <textarea id="review-comment" placeholder="Оставить комментарий..."></textarea>
                    <button onclick="submitReview()" class="btn-submit">Отправить отзыв</button>
                </div>
            </div>
        </section>
        
        <!-- История заказов -->
        <section class="orders-history">
            <h2>📋 История заказов</h2>
            <div id="orders-list"></div>
        </section>
    </div>
    
    <script src="js/api.js"></script>
    <script src="js/client.js"></script>
</body>
</html>
```

**Checklist:**
- [ ] Создать client-dashboard.html
- [ ] Форма для создания заказа
- [ ] Отображение статуса заказа
- [ ] Timeline компонент
- [ ] История заказов

---

### День 3: JavaScript логика

```javascript
// frontend/js/client.js

let currentOrder = null;

document.getElementById('order-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get current position
    const position = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(resolve);
    });
    
    const order = {
        delivery_address: document.getElementById('delivery-address').value,
        product_description: document.getElementById('product-description').value,
        product_category: document.getElementById('product-category').value,
        client_lat: position.coords.latitude,
        client_lon: position.coords.longitude,
        is_urgent: document.getElementById('is-urgent').checked
    };
    
    try {
        const response = await api.createOrder(order);
        currentOrder = response;
        
        // Show order status
        document.querySelector('.create-order-section').style.display = 'none';
        document.getElementById('order-status-section').style.display = 'block';
        
        // Update display
        updateOrderDisplay();
        
        // Start polling
        startPolling();
    } catch (error) {
        alert(`Ошибка: ${error.message}`);
    }
});

function startPolling() {
    const interval = setInterval(async () => {
        try {
            const order = await api.getOrder(currentOrder.order_id);
            currentOrder = order;
            updateOrderDisplay();
            
            // Stop polling if delivered
            if (order.status === 'delivered') {
                clearInterval(interval);
                document.getElementById('review-section').style.display = 'block';
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, 3000); // Every 3 seconds
}

function updateOrderDisplay() {
    // Update order number
    document.getElementById('order-number').textContent = currentOrder.order_id;
    
    // Update status badge
    const statusBadge = document.getElementById('order-status-badge');
    const statusText = {
        'new': '⏳ Ищем курьера',
        'assigned': '✅ Курьер найден',
        'in_transit': '🚗 В пути',
        'delivered': '✅ Доставлено'
    };
    statusBadge.textContent = statusText[currentOrder.status] || currentOrder.status;
    
    // Show courier info if assigned
    if (currentOrder.status !== 'new' && currentOrder.courier_id) {
        document.getElementById('courier-info').style.display = 'block';
        document.getElementById('courier-name').textContent = currentOrder.courier_name;
        document.getElementById('courier-rating').textContent = currentOrder.courier_rating;
    }
    
    // Update timeline
    if (currentOrder.status !== 'new') {
        document.getElementById('timeline-assigned').classList.add('active');
    }
    if (currentOrder.status === 'in_transit' || currentOrder.status === 'delivered') {
        document.getElementById('timeline-transit').classList.add('active');
    }
    if (currentOrder.status === 'delivered') {
        document.getElementById('timeline-delivered').classList.add('active');
    }
}

async function submitReview() {
    const rating = document.querySelector('input[name="rating"]:checked').value;
    const comment = document.getElementById('review-comment').value;
    
    await api.submitReview(currentOrder.order_id, {
        rating: parseInt(rating),
        comment: comment
    });
    
    alert('Спасибо за отзыв!');
}
```

**Checklist:**
- [ ] Реализовать createOrder()
- [ ] Реализовать getOrder()
- [ ] Реализовать submitReview()
- [ ] Polling каждые 3 секунды
- [ ] Обновление UI при изменении статуса

---

### День 4-5: CSS стили и тестирование

```css
/* frontend/css/client.css */

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    color: #333;
}

.container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
}

.header {
    background: white;
    padding: 20px;
    border-radius: 8px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.order-form {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-group {
    margin-bottom: 16px;
    display: flex;
    flex-direction: column;
}

.form-group label {
    margin-bottom: 8px;
    font-weight: 600;
    color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
    padding: 12px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.3s;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
    outline: none;
    border-color: #667eea;
}

.price-estimate {
    background: #f5f5f5;
    padding: 12px;
    border-radius: 6px;
    margin-bottom: 16px;
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    color: #667eea;
}

.btn-submit {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 14px;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    width: 100%;
    transition: transform 0.2s;
}

.btn-submit:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.order-card {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.order-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 2px solid #f0f0f0;
    font-weight: 600;
}

.status-badge {
    background: #667eea;
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
}

.courier-info {
    background: #f0f7ff;
    padding: 16px;
    border-radius: 6px;
    margin-bottom: 16px;
    border-left: 4px solid #667eea;
}

.timeline {
    margin-bottom: 20px;
}

.timeline-item {
    padding: 12px 0;
    padding-left: 30px;
    position: relative;
    color: #999;
}

.timeline-item.active {
    color: #333;
    font-weight: 600;
}

.timeline-item::before {
    content: '';
    position: absolute;
    left: 0;
    top: 16px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ddd;
}

.timeline-item.active::before {
    background: #667eea;
}

.review-section {
    background: #fff9e6;
    padding: 16px;
    border-radius: 6px;
    border-left: 4px solid #ffc107;
}

.rating-input {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
}

.rating-input input[type="radio"] {
    cursor: pointer;
}

/* Responsive */
@media (max-width: 600px) {
    .header {
        flex-direction: column;
        gap: 12px;
    }
    
    .container {
        padding: 10px;
    }
}
```

**Checklist:**
- [ ] CSS для формы
- [ ] CSS для статуса заказа
- [ ] CSS для timeline
- [ ] CSS для отзывов
- [ ] Responsive дизайн
- [ ] Протестировать все компоненты

---

## 🚗 НЕДЕЛЯ 3-4: Courier + Admin + Testing

(аналогично как Client, но для курьера и админа)

---

## 📊 Метрики успеха ETAP 2

```
✅ 3 полнофункциональные роли работают
✅ Клиент может создать заказ с GPS
✅ Курьер видит только заказы в радиусе 5км
✅ Цена рассчитывается автоматически
✅ GPS трекинг в реальном времени
✅ Admin видит всех курьеров на карте
✅ Отзывы и рейтинги работают
✅ Offline режим (IndexedDB)
✅ Performance < 200ms для API
✅ 95%+ test coverage
```

---

## 🔧 Инструменты для разработки

```bash
# Backend
pip install Flask-SQLAlchemy
pip install Flask-JWT-Extended
pip install geopy  # для geocoding

# Frontend
# Используем vanilla JS + Leaflet для карты
<script src="https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js"></script>

# Testing
pip install pytest
pip install pytest-cov
npm install jest
```

---

Это план на 4 недели разработки! 🚀
