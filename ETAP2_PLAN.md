# 📋 ETAP 2 - Полнофункциональная система доставки с 3 ролями

## 🎯 Цель ETAP 2

Создать многоролевую систему управления доставками с интеллектуальной маршрутизацией:
- **Admin** - управляет системой, видит всё
- **Client** - заказывает доставку товаров
- **Courier** - доставляет товары, видит назначенные заказы

---

## 👥 Роли и права доступа

### 1. 👨‍💼 ADMIN (Администратор)
```
✅ Может делать:
  • Просматривать ВСЕ заказы системы
  • Редактировать любой заказ
  • Видеть всех клиентов и курьеров
  • Менять статусы заказов
  • Видеть всех курьеров на карте
  • Подтверждать/отклонять заказы
  • Просматривать финансовые отчеты
  • Управлять пользователями (create/delete/ban)
  • Видеть логи активности

❌ Ограничения: Нет
```

### 2. 👤 CLIENT (Клиент)
```
✅ Может делать:
  • Создать новый заказ (адрес доставки, описание товара, кол-во)
  • Просмотреть свои заказы (текущие и историю)
  • Отменить заказ (если ещё не принял курьер)
  • Видеть статус своих заказов
  • Видеть оценку стоимости доставки
  • Оставить отзыв курьеру после доставки

❌ Не может:
  • Видеть заказы других клиентов
  • Видеть данные курьеров
  • Редактировать чужие заказы
  • Видеть всех курьеров
```

### 3. 🚗 COURIER (Курьер)
```
✅ Может делать:
  • Просмотреть список активных заказов рядом (в радиусе)
  • Принять заказ (когда находится рядом)
  • Видеть адрес доставки и данные клиента
  • Видеть рекомендуемую цену за доставку
  • Обновить статус доставки (в пути, доставлен, проблема)
  • Видеть свои заказы (текущие и выполненные)
  • Видеть рейтинг и отзывы

❌ Не может:
  • Видеть заказы далеко (>5км)
  • Видеть чужие заказы
  • Менять цену доставки
  • Видеть другого курьеров
  • Редактировать заказ
```

---

## 📦 Структура заказа (новая)

```json
{
  "id": 1,
  "client_id": 5,
  "courier_id": null,
  
  "status": "new",  // new | assigned | in_transit | delivered | cancelled | problem
  
  "delivery": {
    "pickup_address": "вул. Пушкіна, 10, м. Київ",
    "delivery_address": "вул. Шевченко, 20, м. Київ",
    "distance_km": 2.5,
    "estimated_delivery_time_min": 15
  },
  
  "product": {
    "description": "Пиво - 2 бутылки",
    "category": "beverages",
    "quantity": 2,
    "weight_kg": 1.2
  },
  
  "pricing": {
    "base_price": 50.00,  // Базовая цена за км
    "suggested_delivery_price": 37.50,  // Рекомендация системы
    "actual_delivery_price": null,  // То что согласовали
    "total_price": null
  },
  
  "timestamps": {
    "created_at": "2026-04-10T14:30:00",
    "assigned_at": null,
    "completed_at": null
  },
  
  "location": {
    "client_lat": 50.4501,
    "client_lon": 30.5234,
    "delivery_lat": 50.4650,
    "delivery_lon": 30.5300
  }
}
```

---

## 🗺️ Алгоритм умной маршрутизации

### Шаг 1: Клиент создает заказ
```
Client App:
  1. Вводит адрес (вручную или GPS)
  2. Описание товара ("Пиво 2 бутылки")
  3. Нажимает "Заказать"
  
Сервер создает заказ со статусом "new"
```

### Шаг 2: Система находит ближайших курьеров
```
Backend Algorithm:
  1. Получает адрес доставки (координаты)
  2. Ищет курьеров в радиусе 5км
  3. Сортирует по расстоянию
  4. Отправляет уведомление 3-5 ближайшим курьерам
  
Courier App:
  - Видит новый заказ в списке
  - Может принять или отклонить
```

### Шаг 3: Курьер принимает заказ
```
Courier нажимает "Принять"
  → Заказ присваивается курьеру (courier_id заполняется)
  → Другим курьерам заказ исчезает из списка
  → Клиент видит "Курьер найден" + рейтинг курьера
```

### Шаг 4: Доставка
```
Courier:
  • Приехал к клиенту → "Прибыл"
  • Забрал товар → "В пути"
  • Доставил → "Доставлено" + фото подтверждение
  
Client:
  • Видит статус обновления в реальном времени
  • Может оставить отзыв
```

---

## 💰 Расчет стоимости доставки

### Формула:
```
Suggested Price = Base Price × Distance (км) × Category Factor × Weather Factor

Где:
- Base Price = 15 грн/км
- Category Factor = 1.0 (напитки) | 1.5 (еда) | 2.0 (техника)
- Weather Factor = 1.0 (нормально) | 1.3 (дождь/снег) | 1.5 (грозовое предупреждение)

Пример:
- Расстояние: 2.5 км
- Категория: Напитки (1.0)
- Погода: Нормальная (1.0)
- Цена = 15 × 2.5 × 1.0 × 1.0 = 37.50 грн
```

---

## 🗄️ Новые таблицы БД

### 1. `couriers` таблица
```sql
CREATE TABLE couriers (
  id INTEGER PRIMARY KEY,
  user_id INTEGER UNIQUE,
  phone TEXT NOT NULL,
  vehicle TEXT,  -- car, bike, motorcycle, walking
  current_lat FLOAT,
  current_lon FLOAT,
  status TEXT DEFAULT 'offline',  -- online, offline, on_delivery
  avg_rating FLOAT DEFAULT 5.0,
  total_deliveries INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT 0,
  documents_verified_at TIMESTAMP,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
```

### 2. `orders` таблица (обновлённая)
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  client_id INTEGER NOT NULL,
  courier_id INTEGER,
  
  status TEXT DEFAULT 'new',
  
  pickup_address TEXT,
  delivery_address TEXT,
  delivery_lat FLOAT,
  delivery_lon FLOAT,
  
  product_description TEXT,
  product_category TEXT,
  product_quantity INTEGER,
  product_weight_kg FLOAT,
  
  distance_km FLOAT,
  estimated_delivery_time_min INTEGER,
  
  base_delivery_price FLOAT,
  suggested_delivery_price FLOAT,
  actual_delivery_price FLOAT,
  total_price FLOAT,
  
  notes TEXT,
  is_urgent BOOLEAN DEFAULT 0,
  
  created_at TIMESTAMP,
  assigned_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (courier_id) REFERENCES couriers(id)
)
```

### 3. `reviews` таблица
```sql
CREATE TABLE reviews (
  id INTEGER PRIMARY KEY,
  order_id INTEGER,
  client_id INTEGER,
  courier_id INTEGER,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (client_id) REFERENCES users(id),
  FOREIGN KEY (courier_id) REFERENCES couriers(id)
)
```

### 4. `courier_locations` таблица (для истории)
```sql
CREATE TABLE courier_locations (
  id INTEGER PRIMARY KEY,
  courier_id INTEGER,
  latitude FLOAT,
  longitude FLOAT,
  accuracy FLOAT,
  timestamp TIMESTAMP,
  FOREIGN KEY (courier_id) REFERENCES couriers(id)
)
```

---

## 🎨 Интерфейсы для каждой роли

### 📲 CLIENT интерфейс (новая страница)
```
┌─────────────────────────────┐
│ 🏠 Доставки              👤 │
├─────────────────────────────┤
│                             │
│  ╔════════════════════════╗ │
│  ║ ➕ НОВЫЙ ЗАКАЗ        ║ │
│  ╠════════════════════════╣ │
│  ║ Адрес доставки:       ║ │
│  ║ [ул. Шевченко, 20]   ║ │
│  ║                       ║ │
│  ║ Что заказать?         ║ │
│  ║ [Пиво 2 бутылки]     ║ │
│  ║                       ║ │
│  ║ 💰 Примерная цена:   ║ │
│  ║    37.50 грн         ║ │
│  ║ [ЗАКАЗАТЬ]           ║ │
│  ╚════════════════════════╝ │
│                             │
│  📋 МОИ ЗАКАЗЫ              │
│  ┌───────────────────────┐ │
│  │ ✅ Заказ #1          │ │
│  │ Пиво 2 бут.          │ │
│  │ 🚗 Курьер найден ⭐5 │ │
│  │ ⏱️  Прибудет за 15 мин│ │
│  └───────────────────────┘ │
└─────────────────────────────┘
```

### 🚗 COURIER интерфейс (новая страница)
```
┌─────────────────────────────┐
│ 📍 Доступные заказы     👤  │
├─────────────────────────────┤
│  Вы находитесь: Киев        │
│                             │
│  🔴 3 НОВЫХ ЗАКАЗА          │
│                             │
│  ┌───────────────────────┐ │
│  │ 📦 Заказ #1          │ │
│  │ Пиво 2 бутылки       │ │
│  │ 📍 ул. Шевченко, 20  │ │
│  │ 📏 2.5 км            │ │
│  │ 💰 37.50 грн         │ │
│  │ ⏱️  ~15 мин в пути    │ │
│  │ [ПРИНЯТЬ]            │ │
│  └───────────────────────┘ │
│                             │
│  ✅ МОИ ДОСТАВКИ            │
│  ┌───────────────────────┐ │
│  │ 🏁 Заказ #5          │ │
│  │ Доставлено           │ │
│  │ Получено 37.50 грн   │ │
│  │ ⭐ 5.0 (10 отзывов)  │ │
│  └───────────────────────┘ │
└─────────────────────────────┘
```

### 👨‍💼 ADMIN интерфейс (расширенный)
```
┌─────────────────────────────┐
│ 📊 Админ панель         👤  │
├─────────────────────────────┤
│                             │
│  📈 СТАТИСТИКА              │
│  ┌───────────────────────┐ │
│  │ Заказов сегодня: 24  │ │
│  │ Курьеров онлайн: 7   │ │
│  │ Доход: 1,250 грн    │ │
│  │ Средний рейтинг: 4.8 │ │
│  └───────────────────────┘ │
│                             │
│  👥 УПРАВЛЕНИЕ              │
│  [👤 Клиенты] [🚗 Курьеры] │
│  [📋 Заказы]  [⚙️ Система]│
│                             │
│  🗺️ ВСЕ КУРЬЕРЫ НА КАРТЕ    │
│  ┌───────────────────────┐ │
│  │  [Карта с курьерами] │ │
│  │  🔴 🔴 🟢 🟡         │ │
│  └───────────────────────┘ │
└─────────────────────────────┘
```

---

## 🔌 Новые API endpoints

### Client endpoints
```
POST   /api/orders/create         - Создать заказ
GET    /api/orders/my             - Мои заказы
GET    /api/orders/:id            - Детали заказа
DELETE /api/orders/:id            - Отменить заказ
POST   /api/reviews/:order_id     - Оставить отзыв
GET    /api/pricing/estimate      - Расчет цены
```

### Courier endpoints
```
GET    /api/courier/available     - Доступные заказы рядом
POST   /api/courier/accept/:id    - Принять заказ
PUT    /api/courier/status/:id    - Обновить статус
GET    /api/courier/active        - Мои активные доставки
GET    /api/courier/history       - История доставок
POST   /api/courier/location      - Отправить GPS координаты
```

### Admin endpoints
```
GET    /api/admin/all-orders      - Все заказы
GET    /api/admin/all-couriers    - Все курьеры
GET    /api/admin/stats           - Статистика
GET    /api/admin/courier-map     - Все курьеры на карте
PUT    /api/admin/order/:id       - Редактировать заказ
```

---

## 🗺️ Технологии для локации

### Получение координат клиента
```javascript
// При создании заказа
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      client_lat = position.coords.latitude;
      client_lon = position.coords.longitude;
    }
  );
}
```

### Получение координат курьера
```javascript
// Каждые 30 секунд отправлять текущую локацию
setInterval(() => {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      api.sendCourierLocation(
        position.coords.latitude,
        position.coords.longitude
      );
    }
  );
}, 30000);
```

### Расчет расстояния между точками (Haversine Formula)
```python
import math

def calculate_distance(lat1, lon1, lat2, lon2):
    """Расстояние между двумя точками на Земле в км"""
    R = 6371  # Радиус Земли в км
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c  # Расстояние в км
```

---

## 📋 План реализации ETAP 2

### Неделя 1: Backend структура
- [ ] Расширить models (добавить Courier, Order, Review)
- [ ] Создать новые endpoints для заказов
- [ ] Реализовать алгоритм поиска ближайших курьеров
- [ ] Реализовать расчет цены доставки
- [ ] Добавить GPS tracking для курьеров

### Неделя 2: Frontend (Client)
- [ ] Создать страницу создания заказа
- [ ] Форма с выбором адреса и товара
- [ ] Интеграция с GPS
- [ ] Отображение статуса доставки
- [ ] Система отзывов

### Неделя 3: Frontend (Courier)
- [ ] Создать страницу доступных заказов
- [ ] Карта с доступными заказами
- [ ] Функция принятия заказа
- [ ] Отслеживание доставки
- [ ] История доставок и рейтинги

### Неделя 4: Frontend (Admin) + Тестирование
- [ ] Расширить admin панель
- [ ] Карта всех курьеров
- [ ] Статистика и отчеты
- [ ] Тестирование всех функций
- [ ] Оптимизация и багфиксы

---

## 🧪 Сценарии тестирования

### Сценарий 1: Полный цикл заказа
```
1. Клиент логинится
2. Клиент создает заказ "Пиво 2 бутылки" на адрес "ул. Шевченко, 20"
3. Система автоматически находит 3 ближайших курьеров (по GPS)
4. Курьеры видят заказ в своем приложении
5. Курьер #1 принимает заказ
6. Клиент видит "Курьер найден" + рейтинг 4.8
7. Курьер приезжает и меняет статус "Доставлено"
8. Клиент видит уведомление "Доставлено"
9. Клиент оставляет отзыв 5 звезд
✅ УСПЕШНО!
```

### Сценарий 2: Admin видит всё
```
1. Admin логинится
2. Admin видит на карте всех 10 курьеров
3. Admin видит список всех 156 заказов
4. Admin может отредактировать цену заказа
5. Admin видит статистику (доход, заказы, рейтинги)
✅ УСПЕШНО!
```

---

## 📌 Приоритеты реализации

1. **HIGH**: Создание заказа (Client) + Принятие заказа (Courier)
2. **HIGH**: GPS маршрутизация + поиск ближайших курьеров
3. **HIGH**: Расчет цены доставки
4. **MEDIUM**: Отзывы и рейтинги
5. **MEDIUM**: Admin статистика
6. **LOW**: Погодные факторы для цены
7. **LOW**: Оптимизация алгоритма маршрутизации

---

## ✅ Определение "готово"

Функция считается готовой когда:
- ✅ Backend endpoint работает и протестирован
- ✅ Frontend интегрирован и функционален
- ✅ Данные сохраняются в БД правильно
- ✅ Обработаны edge cases (ошибки, пустые данные)
- ✅ Работает offline режим (если применимо)
- ✅ Задокументирована в API docs

---

## 📚 Документы ETAP 2

- [ ] API_V2.md - полная документация API
- [ ] COURIER_GUIDE.md - гайд для курьеров
- [ ] CLIENT_GUIDE.md - гайд для клиентов
- [ ] GPS_ROUTING.md - детали алгоритма маршрутизации
- [ ] PRICING_ALGORITHM.md - формулы расчета цен
