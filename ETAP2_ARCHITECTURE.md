# 🚀 ETAP 2 - Полнофункциональная система управления доставками

## 🎯 Основная идея

Система состоит из **трех взаимодействующих ролей**:

```
┌─────────────────────────────────────────────────────────┐
│                    DELIVERY MANAGER                      │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  👤 CLIENT           🚗 COURIER          👨‍💼 ADMIN         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐│
│  │ 📱 App       │    │ 📱 App       │    │ 🖥️ Dashboard ││
│  │              │    │              │    │              ││
│  │ Создает      │    │ Видит        │    │ Видит ВСЕ    ││
│  │ заказ        │ ◄─►│ доступные    │ ◄──┤              ││
│  │              │    │ заказы       │    │ Может менять ││
│  │ Пиво 2 бут  │    │              │    │ всё          ││
│  │ на ул. Шев. │    │ Принимает    │    │              ││
│  │ Цена: 37.50 │    │ заказ        │    │ На карте     ││
│  │              │    │              │    │ видно всех   ││
│  │ ⭐ Отзыв    │    │ ⭐ Рейтинг   │    │ курьеров     ││
│  └──────────────┘    └──────────────┘    └──────────────┘│
│         │                   │                    │        │
│         └───────────────────┴────────────────────┘        │
│                                                           │
│                   BACKEND (Flask + SQLite)               │
│              с алгоритмом умной маршрутизации           │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 Основной поток работы

### 1️⃣ Клиент создает заказ

```
CLIENT ДЕЙСТВИЯ:
┌─────────────────────────────┐
│ 1. Открыть APP              │
│ 2. Кнопка "➕ Новый заказ"  │
│ 3. Ввести адрес доставки:   │
│    ул. Шевченко, 20, Киев   │
│ 4. Описание товара:         │
│    "Пиво 2 бутылки"         │
│ 5. Система рассчитывает:    │
│    📏 2.5 км                │
│    💰 37.50 грн             │
│    ⏱️  ~15 мин              │
│ 6. Кнопка "ЗАКАЗАТЬ"        │
└─────────────────────────────┘
         │
         ↓
SERVER ОБРАБОТКА:
  • Создает Order (статус: "new")
  • Запрашивает GPS клиента
  • Находит адрес доставки на карте
  • Рассчитывает расстояние
  • Вычисляет рекомендуемую цену
         │
         ↓
ПОИСК КУРЬЕРОВ:
  • SELECT courriers WHERE distance < 5km
  • Сортирует по расстоянию
  • Отправляет уведомление 3-5 ближайшим
```

### 2️⃣ Курьеры видят заказ

```
COURIER ВИДИТ В APP:
┌───────────────────────────────┐
│ 🔴 3 НОВЫХ ЗАКАЗА             │
├───────────────────────────────┤
│                               │
│ 📦 ЗАКАЗ #1                   │
│ ═══════════════════════════   │
│ 🛍️  Пиво 2 бутылки            │
│ 📍 ул. Шевченко, 20           │
│ 📏 2.5 км от вас              │
│ ⏱️  ~15 минут в пути          │
│ 💰 37.50 грн (рекомендация)   │
│ ⭐ Клиент: 4.9 (50 отзывов)  │
│ [ПРИНЯТЬ]  [ОТКЛОНИТЬ]       │
│                               │
│ 📦 ЗАКАЗ #2                   │
│ ... и т.д.                    │
└───────────────────────────────┘
```

### 3️⃣ Курьер принимает заказ

```
COURIER НАЖИМАЕТ "ПРИНЯТЬ"
         │
         ↓
SERVER:
  • Order.courier_id = courier_id
  • Order.status = "assigned"
  • Удаляет заказ из списка других курьеров
  • Отправляет УВЕДОМЛЕНИЕ клиенту
         │
         ↓
CLIENT ВИДИТ:
┌─────────────────────────────┐
│ ✅ КУРЬЕР НАЙДЕН!           │
│                             │
│ 🚗 Иван Петров              │
│ ⭐ 4.8 (120 отзывов)        │
│ 📱 +38-095-123-4567         │
│ 📍 В пути к вам             │
│ ⏱️  Прибудет за 15 минут    │
│                             │
│ [📞 ЗВОНИТЬ]  [💬 НАПИСАТЬ]│
└─────────────────────────────┘
```

### 4️⃣ Доставка выполняется

```
COURIER ОТСЛЕЖИВАЕТ:
┌─────────────────────────────┐
│ 🚗 ДОСТАВКА #1              │
├─────────────────────────────┤
│                             │
│ Status: ПО ПУТИ К КЛИЕНТУ  │
│                             │
│ 📍 Текущая позиция:         │
│    ул. Пушкина, 15         │
│ 📍 Пункт назначения:        │
│    ул. Шевченко, 20        │
│                             │
│ 📏 Осталось: 0.8 км        │
│ ⏱️  Примерно: 5 мин        │
│                             │
│ [ПРИБЫЛ] [ПРОБЛЕМА]        │
└─────────────────────────────┘

CLIENT ВИДИТ:
┌─────────────────────────────┐
│ 🗺️ ОТСЛЕЖИВАНИЕ ДОСТАВКИ   │
├─────────────────────────────┤
│                             │
│   [Курьер на карте 🚗]      │
│   [Идет к вам 👈]          │
│                             │
│ Все в порядке! Курьер      │
│ находится в пути.          │
│ Прибудет за ~5 минут       │
│                             │
└─────────────────────────────┘
```

### 5️⃣ Доставка завершена

```
COURIER:
  • Прибыл на место
  • Отдал товар клиенту
  • Изменил статус: "ДОСТАВЛЕНО"
  • Взял подпись/фото

CLIENT ПОЛУЧИЛ:
┌─────────────────────────────┐
│ ✅ ДОСТАВЛЕНО!              │
│                             │
│ Благодарим за заказ!       │
│                             │
│ 🚗 Курьер: Иван Петров     │
│ 📦 Товар: Пиво 2 бутылки   │
│ 💰 Сумма: 37.50 грн        │
│                             │
│ [⭐ ОСТАВИТЬ ОТЗЫВ]        │
│ [🙏 СПАСИБО]               │
└─────────────────────────────┘

ADMIN ВИДИТ:
  • Заказ завершен ✅
  • Статус: DELIVERED
  • Курьер получил 37.50 грн
  • Рейтинг: +1 для курьера
```

---

## 🗺️ Алгоритм "Умной Маршрутизации"

### Шаг 1: Получение заказа

```python
@app.route('/api/orders/create', methods=['POST'])
@jwt_required()
def create_order():
    data = request.json
    client_id = get_jwt()['user_id']
    
    # Получаем адрес доставки и конвертируем в координаты
    delivery_lat, delivery_lon = geocode_address(data['address'])
    
    # Получаем координаты клиента (его текущее местоположение)
    client_lat = data.get('client_lat')
    client_lon = data.get('client_lon')
    
    # Рассчитываем расстояние
    distance_km = haversine_distance(
        client_lat, client_lon,
        delivery_lat, delivery_lon
    )
    
    # Рассчитываем рекомендуемую цену
    suggested_price = calculate_delivery_price(
        distance_km,
        data['product_category'],
        data.get('is_urgent')
    )
    
    # Создаем заказ в БД
    order = Order(
        client_id=client_id,
        delivery_address=data['address'],
        delivery_lat=delivery_lat,
        delivery_lon=delivery_lon,
        product_description=data['product_description'],
        product_category=data['product_category'],
        distance_km=distance_km,
        suggested_delivery_price=suggested_price,
        status='new'
    )
    db.session.add(order)
    db.session.commit()
    
    # ВАЖНО: Ищем ближайших курьеров
    find_and_notify_nearby_couriers(order)
    
    return jsonify({'order_id': order.id, 'price': suggested_price})
```

### Шаг 2: Поиск ближайших курьеров

```python
def find_and_notify_nearby_couriers(order):
    """Находит ближайших курьеров в радиусе 5км"""
    
    # Берем все активных курьеров
    couriers = Courier.query.filter_by(status='online').all()
    
    # Для каждого курьера рассчитываем расстояние
    nearby_couriers = []
    
    for courier in couriers:
        distance = haversine_distance(
            courier.current_lat,
            courier.current_lon,
            order.delivery_lat,
            order.delivery_lon
        )
        
        # Если в радиусе 5км - добавляем
        if distance <= 5.0:
            nearby_couriers.append({
                'courier_id': courier.id,
                'distance': distance,
                'user_id': courier.user_id
            })
    
    # Сортируем по расстоянию (ближайшие первыми)
    nearby_couriers.sort(key=lambda x: x['distance'])
    
    # Отправляем уведомления первым 5 курьерам
    for i, courier_info in enumerate(nearby_couriers[:5]):
        send_notification_to_courier(
            user_id=courier_info['user_id'],
            order_id=order.id,
            distance=courier_info['distance'],
            priority=i  # 0 = самый близкий, 4 = 5-й по близости
        )

def haversine_distance(lat1, lon1, lat2, lon2):
    """Расстояние между двумя точками на земле в км"""
    import math
    
    R = 6371  # Радиус Земли в км
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = (math.sin(delta_lat/2)**2 + 
         math.cos(lat1_rad) * math.cos(lat2_rad) * 
         math.sin(delta_lon/2)**2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c
```

### Шаг 3: Курьер принимает заказ

```python
@app.route('/api/courier/accept/<int:order_id>', methods=['POST'])
@jwt_required()
def accept_order(order_id):
    courier_id = get_jwt()['user_id']
    
    # Получаем курьера
    courier = Courier.query.filter_by(user_id=courier_id).first()
    
    # Получаем заказ
    order = Order.query.get(order_id)
    
    # Проверяем что заказ еще не принят
    if order.courier_id is not None:
        return jsonify({'error': 'Order already assigned'}), 409
    
    # ВАЖНО: Проверяем что курьер в радиусе 5км
    distance = haversine_distance(
        courier.current_lat, courier.current_lon,
        order.delivery_lat, order.delivery_lon
    )
    
    if distance > 5.0:
        return jsonify({
            'error': f'You are {distance:.1f}km away (max 5km)'
        }), 400
    
    # Назначаем курьера
    order.courier_id = courier.id
    order.status = 'assigned'
    order.assigned_at = datetime.utcnow()
    
    db.session.commit()
    
    # Отправляем уведомление клиенту
    send_notification_to_client(
        user_id=order.client_id,
        message=f"Courier found! {courier.user.username} will deliver"
    )
    
    return jsonify({'message': 'Order accepted', 'order_id': order.id})
```

---

## 💰 Расчет стоимости доставки

### Формула

```
ЦЕНА = БАЗОВАЯ_ЦЕНА × РАССТОЯНИЕ × КОЭФФИЦИЕНТ_КАТЕГОРИИ × КОЭФФИЦИЕНТ_СРОЧНОСТИ

где:
  БАЗОВАЯ_ЦЕНА = 15 грн/км
  КОЭФФИЦИЕНТ_КАТЕГОРИИ:
    - Напитки (beverages): 1.0
    - Еда (food): 1.5
    - Техника (electronics): 2.0
    - Документы (documents): 0.8
  
  КОЭФФИЦИЕНТ_СРОЧНОСТИ:
    - Обычный: 1.0
    - Срочный (< 30 мин): 2.0
    - Очень срочный (< 15 мин): 3.0
```

### Примеры расчета

```
ПРИМЕР 1: Пиво 2 бутылки
  - Расстояние: 2.5 км
  - Категория: Напитки (1.0)
  - Срочность: Обычная (1.0)
  - Цена = 15 × 2.5 × 1.0 × 1.0 = 37.50 грн ✅

ПРИМЕР 2: Срочная доставка еды
  - Расстояние: 1.2 км
  - Категория: Еда (1.5)
  - Срочность: Срочная (2.0)
  - Цена = 15 × 1.2 × 1.5 × 2.0 = 54.00 грн ✅

ПРИМЕР 3: Документ на другой конец города
  - Расстояние: 8.5 км
  - Категория: Документы (0.8)
  - Срочность: Обычная (1.0)
  - Цена = 15 × 8.5 × 0.8 × 1.0 = 102.00 грн ✅
```

### Реализация

```python
def calculate_delivery_price(distance_km, category='beverages', is_urgent=False):
    """Расчет рекомендуемой цены доставки"""
    
    BASE_PRICE = 15  # грн/км
    
    CATEGORY_COEF = {
        'beverages': 1.0,
        'food': 1.5,
        'electronics': 2.0,
        'documents': 0.8,
        'other': 1.2
    }
    
    # Получаем коэффициент категории
    category_coef = CATEGORY_COEF.get(category, 1.2)
    
    # Коэффициент срочности
    urgency_coef = 2.0 if is_urgent else 1.0
    
    # Рассчитываем цену
    price = BASE_PRICE * distance_km * category_coef * urgency_coef
    
    # Округляем до 50 копеек
    price = round(price * 2) / 2
    
    return price
```

---

## 📊 Структура данных (новые таблицы)

### Таблица `couriers`

```sql
CREATE TABLE couriers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  vehicle TEXT DEFAULT 'walking',  -- walking, bike, car, motorcycle
  
  current_lat FLOAT,
  current_lon FLOAT,
  last_location_update TIMESTAMP,
  
  status TEXT DEFAULT 'offline',  -- offline, online, on_delivery
  
  avg_rating FLOAT DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  total_earnings FLOAT DEFAULT 0,
  
  is_verified BOOLEAN DEFAULT 0,
  documents_verified_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Таблица `orders` (обновленная)

```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  courier_id INTEGER,
  
  -- Адреса
  pickup_address TEXT,
  delivery_address TEXT,
  delivery_lat FLOAT,
  delivery_lon FLOAT,
  
  -- Товар
  product_description TEXT NOT NULL,
  product_category TEXT DEFAULT 'other',
  product_quantity INTEGER DEFAULT 1,
  product_weight_kg FLOAT,
  
  -- Расстояние и время
  distance_km FLOAT,
  estimated_delivery_time_min INTEGER,
  
  -- Цены
  base_delivery_price FLOAT,
  suggested_delivery_price FLOAT,
  actual_delivery_price FLOAT,
  total_price FLOAT,
  
  -- Статус
  status TEXT DEFAULT 'new',  
  -- new | assigned | in_transit | delivered | cancelled | problem
  
  notes TEXT,
  is_urgent BOOLEAN DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (courier_id) REFERENCES couriers(id)
);
```

### Таблица `reviews`

```sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  courier_id INTEGER NOT NULL,
  
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (courier_id) REFERENCES couriers(id)
);
```

### Таблица `courier_locations` (для истории)

```sql
CREATE TABLE courier_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  courier_id INTEGER NOT NULL,
  order_id INTEGER,
  
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  accuracy FLOAT,
  
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (courier_id) REFERENCES couriers(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

---

## 🔌 Основные API endpoints

### Для CLIENT

```
POST   /api/orders/create
GET    /api/orders/my
GET    /api/orders/:id
DELETE /api/orders/:id/cancel
POST   /api/reviews/:order_id
GET    /api/pricing/estimate
```

### Для COURIER

```
GET    /api/courier/available       -- Доступные заказы
POST   /api/courier/accept/:id      -- Принять заказ
PUT    /api/courier/status/:id      -- Обновить статус (in_transit, delivered, problem)
GET    /api/courier/active          -- Мои текущие доставки
GET    /api/courier/history         -- История доставок
POST   /api/courier/location        -- Отправить GPS
```

### Для ADMIN

```
GET    /api/admin/orders            -- Все заказы
GET    /api/admin/couriers          -- Все курьеры
GET    /api/admin/stats             -- Статистика
GET    /api/admin/map               -- Карта всех курьеров
PUT    /api/admin/order/:id         -- Редактировать заказ
```

---

## 🧪 Полный тестовый сценарий

### 1. Подготовка (Admin)

```bash
# Админ создает пару курьеров
curl -X POST http://localhost:5000/api/auth/register \
  -d '{
    "username": "courier1",
    "email": "courier1@delivery.com",
    "password": "pass123"
  }'

# Админ назначает их курьерами
curl -X PUT http://localhost:5000/api/auth/users/2/role \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"role": "courier"}'
```

### 2. Клиент создает заказ

```bash
# Клиент логинится
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -d '{"username":"client1","password":"pass123"}' \
  | jq -r '.access_token')

# Клиент создает заказ
curl -X POST http://localhost:5000/api/orders/create \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "delivery_address": "ул. Шевченко, 20, Киев",
    "product_description": "Пиво 2 бутылки",
    "product_category": "beverages",
    "client_lat": 50.4501,
    "client_lon": 30.5234,
    "is_urgent": false
  }'
```

### 3. Курьер принимает заказ

```bash
# Курьер логинится
COURIER_TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -d '{"username":"courier1","password":"pass123"}' \
  | jq -r '.access_token')

# Курьер видит доступные заказы
curl -X GET http://localhost:5000/api/courier/available \
  -H "Authorization: Bearer $COURIER_TOKEN"

# Курьер принимает заказ
curl -X POST http://localhost:5000/api/courier/accept/1 \
  -H "Authorization: Bearer $COURIER_TOKEN"
```

### 4. Доставка

```bash
# Курьер в пути
curl -X PUT http://localhost:5000/api/courier/status/1 \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -d '{"status": "in_transit"}'

# Курьер доставил
curl -X PUT http://localhost:5000/api/courier/status/1 \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -d '{"status": "delivered"}'
```

### 5. Отзыв

```bash
# Клиент оставляет отзыв
curl -X POST http://localhost:5000/api/reviews/1 \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "rating": 5,
    "comment": "Отличная доставка! Быстро и аккуратно"
  }'
```

---

## 📈 Метрики успеха ETAP 2

- ✅ 3 полноценные роли (Admin, Client, Courier) с разными правами
- ✅ Система создания заказов от клиентов
- ✅ Алгоритм поиска ближайших курьеров (radius 5km)
- ✅ Система отслеживания GPS
- ✅ Расчет стоимости доставки
- ✅ Система отзывов и рейтингов
- ✅ Admin панель со статистикой и картой
- ✅ Все работает offline и online
- ✅ Минимум 95% test coverage
- ✅ Performance < 200ms для основных операций

---

## 🚀 Начало работы

```bash
# 1. Создать новую ветку для ETAP 2
git checkout -b feature/etap2-3-roles

# 2. Запустить backend
cd backend && python app.py

# 3. В новом терминале запустить frontend
cd frontend && python -m http.server 8000

# 4. Открыть в браузере
open http://localhost:8000

# 5. Начать разработку!
```
