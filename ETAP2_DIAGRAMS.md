# 🏗️ ETAP 2 - Архитектура системы (Диаграммы)

## 1. Общая архитектура системы

```
┌─────────────────────────────────────────────────────────────────────┐
│                          DELIVERY MANAGER                           │
│                   Progressive Web App (PWA)                         │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────┬──────────────────┬──────────────────┬────────────────┐
│                │                  │                  │                │
│  👤 CLIENT     │  🚗 COURIER      │  👨‍💼 ADMIN       │  📱 DEVICE     │
│  APP           │  APP             │  DASHBOARD       │  STORAGE       │
│                │                  │                  │                │
│ • Order        │ • Available      │ • All Orders     │ • IndexedDB    │
│   creation     │   orders         │ • All Couriers   │ • LocalStorage │
│ • Track        │ • Accept orders  │ • Statistics     │ • Service      │
│   delivery     │ • GPS tracking   │ • Courier map    │   Worker      │
│ • Reviews      │ • History        │ • Edit orders    │                │
│                │ • Ratings        │ • User mgmt      │                │
│                │                  │ • Activity logs  │                │
└────────────────┴──────────────────┴──────────────────┴────────────────┘
         │                 │                │                  │
         └─────────────────┼────────────────┴──────────────────┘
                           │
                    ┌──────▼──────┐
                    │  FETCH API  │
                    │ with JWT    │
                    │  Bearer     │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
    ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
    │ Login   │      │ /api/   │      │ WebSocket│
    │ /Auth   │      │ orders  │      │ for      │
    │         │      │         │      │ live     │
    │ • JWT   │      │ • GET   │      │ updates  │
    │ • Role  │      │ • POST  │      │ (future) │
    │   mgmt  │      │ • PUT   │      │          │
    │         │      │ • DEL   │      │          │
    └────┬────┘      └────┬────┘      └────┬────┘
         │                │                │
         └────────────────┼────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │       FLASK BACKEND             │
         │    (Python + SQLAlchemy)        │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │  BLUEPRINT ROUTES:              │
         ├────────────────────────────────┤
         │  • auth_routes (JWT)           │
         │  • client_routes               │
         │  • courier_routes              │
         │  • admin_routes                │
         │  • order_routes                │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │   BUSINESS LOGIC LAYER:        │
         ├────────────────────────────────┤
         │  • haversine_distance()        │
         │  • find_nearby_couriers()      │
         │  • calculate_delivery_price()  │
         │  • geolocation_service         │
         │  • notification_service        │
         └────────────────┬────────────────┘
                          │
         ┌────────────────▼────────────────┐
         │       SQLite DATABASE           │
         ├────────────────────────────────┤
         │  • users                       │
         │  • couriers                    │
         │  • orders                      │
         │  • reviews                     │
         │  • courier_locations           │
         │  • activity_logs               │
         └────────────────────────────────┘
```

---

## 2. Поток создания заказа (Client)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CLIENT CREATES ORDER                            │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  CLIENT APP      │
│  (frontend)      │
└────────┬─────────┘
         │
         │ 1. User Input:
         │    - Delivery address
         │    - Product description
         │    - Category
         │
         ▼
┌──────────────────────────────────────────┐
│ Get Current Location (GPS)              │
│ navigator.geolocation.getCurrentPosition│
└────────────┬─────────────────────────────┘
             │
             │ 2. Client coordinates:
             │    lat: 50.4501
             │    lon: 30.5234
             │
             ▼
┌──────────────────────────────────────────┐
│ POST /api/orders/create                 │
│ + JWT Token (Bearer)                    │
│ + Client coordinates                    │
│ + Delivery address                      │
└────────────┬─────────────────────────────┘
             │
             │ HTTP Request
             │
             ▼
┌──────────────────────────────────────────┐
│      FLASK BACKEND                      │
│  create_order() endpoint                │
└────────────┬─────────────────────────────┘
             │
             │ 3. Verify JWT Token
             │
             ▼
┌──────────────────────────────────────────┐
│ Extract client_id from JWT              │
│ Extract user_id = 2 (Ivan Client)       │
└────────────┬─────────────────────────────┘
             │
             │ 4. Geocode address
             │ "ул. Шевченко, 20" → coordinates
             │
             ▼
┌──────────────────────────────────────────┐
│ Lookup delivery address on map          │
│ delivery_lat: 50.4650                   │
│ delivery_lon: 30.5300                   │
└────────────┬─────────────────────────────┘
             │
             │ 5. Calculate distance
             │ Using Haversine formula
             │
             ▼
┌──────────────────────────────────────────┐
│ distance = haversine_distance(          │
│   50.4501, 30.5234,  (client)          │
│   50.4650, 30.5300   (delivery)        │
│ )                                        │
│ Result: 2.5 km                          │
└────────────┬─────────────────────────────┘
             │
             │ 6. Calculate price
             │ price = 15 * 2.5 * 1.0 * 1.0
             │
             ▼
┌──────────────────────────────────────────┐
│ Suggested Price = 37.50 грн             │
└────────────┬─────────────────────────────┘
             │
             │ 7. Create Order in DB
             │
             ▼
┌──────────────────────────────────────────┐
│ INSERT INTO orders:                     │
│ • client_id: 2                          │
│ • status: 'new'                         │
│ • delivery_address: 'ул. Шевченко, 20' │
│ • delivery_lat: 50.4650                │
│ • delivery_lon: 30.5300                │
│ • distance_km: 2.5                     │
│ • suggested_price: 37.50               │
│ • created_at: NOW()                    │
│                                         │
│ RESULT: order_id = 1                   │
└────────────┬─────────────────────────────┘
             │
             │ 8. IMPORTANT: Find nearby couriers!
             │
             ▼
┌──────────────────────────────────────────┐
│ find_and_notify_nearby_couriers(1)      │
│                                         │
│ SELECT all online couriers              │
│ WHERE status IN ('online',              │
│                  'on_delivery')         │
└────────────┬─────────────────────────────┘
             │
             │ 9. Check each courier's distance
             │
             ▼
┌──────────────────────────────────────────┐
│ For each courier:                       │
│   distance = haversine(                 │
│     courier_lat, courier_lon,           │
│     50.4650, 30.5300                   │
│   )                                      │
│                                         │
│ Courier #1: 1.2 km ✅ (< 5km)          │
│ Courier #2: 2.5 km ✅ (< 5km)          │
│ Courier #3: 3.7 km ✅ (< 5km)          │
│ Courier #4: 4.2 km ✅ (< 5km)          │
│ Courier #5: 4.9 km ✅ (< 5km)          │
│ Courier #6: 6.1 km ❌ (> 5km)          │
│ Courier #7: 7.3 km ❌ (> 5km)          │
└────────────┬─────────────────────────────┘
             │
             │ 10. Sort by distance (closest first)
             │     Send notifications to top 5
             │
             ▼
┌──────────────────────────────────────────┐
│ Send WebSocket/Push notifications:      │
│                                         │
│ → Courier #1 (1.2 km)  Priority: 0     │
│ → Courier #2 (2.5 km)  Priority: 1     │
│ → Courier #3 (3.7 km)  Priority: 2     │
│ → Courier #4 (4.2 km)  Priority: 3     │
│ → Courier #5 (4.9 km)  Priority: 4     │
└────────────┬─────────────────────────────┘
             │
             │ 11. Return response to client
             │
             ▼
┌──────────────────────────────────────────┐
│ Return JSON:                            │
│ {                                       │
│   "order_id": 1,                       │
│   "price": 37.50,                      │
│   "distance": 2.5,                     │
│   "status": "new"                      │
│ }                                       │
└────────────┬─────────────────────────────┘
             │
             │ HTTP Response
             │
             ▼
┌──────────────────────────────────────────┐
│  CLIENT APP receives response            │
│                                         │
│  1. Show price: "37.50 грн"            │
│  2. Show status: "Ищем курьера..."     │
│  3. Start polling for updates           │
│  4. Poll every 3 seconds:              │
│     GET /api/orders/1                  │
└──────────────────────────────────────────┘
```

---

## 3. Поток принятия заказа (Courier)

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COURIER ACCEPTS ORDER                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────┐
│   COURIER APP (frontend)             │
│                                      │
│ Displays available orders list:     │
│ • Заказ #1: "Пиво 2 бут"           │
│   📏 2.5 км  💰 37.50 грн           │
│   ⭐ 4.9 (50 отзывов)              │
│                                      │
│   [ПРИНЯТЬ] [ПРОПУСТИТЬ]           │
└────────┬─────────────────────────────┘
         │
         │ User clicks [ПРИНЯТЬ]
         │
         ▼
┌──────────────────────────────────────┐
│ POST /api/courier/accept/1           │
│ + JWT Token (Courier)                │
│ + Current location (from GPS)        │
└────────┬─────────────────────────────┘
         │
         │ HTTP Request
         │
         ▼
┌──────────────────────────────────────┐
│    FLASK BACKEND                     │
│ accept_order(order_id=1) endpoint    │
└────────┬─────────────────────────────┘
         │
         │ 1. Verify JWT
         │    Extract courier_id from token
         │
         ▼
┌──────────────────────────────────────┐
│ Get Courier info:                   │
│ courier_id = 3 (Петров)             │
│ current_lat = 50.4400               │
│ current_lon = 30.5100               │
└────────┬─────────────────────────────┘
         │
         │ 2. Get Order
         │
         ▼
┌──────────────────────────────────────┐
│ SELECT order WHERE id = 1            │
│ delivery_lat: 50.4650               │
│ delivery_lon: 30.5300               │
│ status: 'new' ✅ (not assigned yet) │
│ courier_id: NULL ✅                 │
└────────┬─────────────────────────────┘
         │
         │ 3. Check distance again (security)
         │
         ▼
┌──────────────────────────────────────┐
│ distance = haversine(               │
│   50.4400, 30.5100,  (courier)     │
│   50.4650, 30.5300   (delivery)    │
│ )                                    │
│ Result: 2.5 km ✅                   │
│                                     │
│ if distance > 5 km: return error   │
└────────┬─────────────────────────────┘
         │
         │ 4. Assign courier to order
         │
         ▼
┌──────────────────────────────────────┐
│ UPDATE orders SET:                  │
│   courier_id = 3                    │
│   status = 'assigned'               │
│   assigned_at = NOW()               │
│ WHERE id = 1                        │
└────────┬─────────────────────────────┘
         │
         │ 5. Notify client
         │
         ▼
┌──────────────────────────────────────┐
│ send_notification(                  │
│   user_id=2,  # client             │
│   message="Курьер найден!"         │
│   order_id=1                       │
│ )                                   │
└────────┬─────────────────────────────┘
         │
         │ 6. Start GPS tracking
         │
         ▼
┌──────────────────────────────────────┐
│ Courier app starts:                │
│ setInterval(every 30 sec):         │
│   POST /api/courier/location       │
│   with lat, lon, accuracy          │
└────────┬─────────────────────────────┘
         │
         │ 7. Return response
         │
         ▼
┌──────────────────────────────────────┐
│ Return JSON:                        │
│ {                                   │
│   "message": "Order accepted",     │
│   "order_id": 1,                   │
│   "status": "assigned"             │
│ }                                   │
└────────┬─────────────────────────────┘
         │
         │ HTTP Response
         │
         ▼
┌──────────────────────────────────────┐
│  COURIER APP UI updates:            │
│                                     │
│  1. Order removed from list        │
│  2. Show "Активная доставка:"      │
│  3. Start real-time GPS tracking   │
│  4. Show "В пути к клиенту"       │
│  5. Show buttons:                  │
│     [ПРИБЫЛ] [ПРОБЛЕМА]           │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  CLIENT APP UI updates:             │
│                                     │
│  1. Poll response changes status   │
│  2. Show "Курьер найден! ✅"       │
│  3. Display courier info:          │
│     - Name: "Петров"               │
│     - Rating: 4.8                  │
│     - Phone: +38-095-123-4567     │
│  4. Show courier on map            │
│  5. Show "[📞 ЗВОНИТЬ]"            │
└──────────────────────────────────────┘
```

---

## 4. Система GPS Tracking

```
┌─────────────────────────────────────────────────────────────────────┐
│                      GPS TRACKING FLOW                              │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│  COURIER APP         │
│  (frontend)          │
│                      │
│ Every 30 seconds:    │
│ navigator.           │
│ geolocation.         │
│ getCurrentPosition() │
└──────────┬───────────┘
           │
           │ lat: 50.4420
           │ lon: 30.5150
           │ accuracy: 8.5m
           │
           ▼
┌──────────────────────┐
│ POST /api/courier/   │
│ location             │
│                      │
│ {                    │
│   latitude: 50.4420, │
│   longitude: 30.5150,│
│   accuracy: 8.5,     │
│   order_id: 1        │
│ }                    │
└──────────┬───────────┘
           │
           │ HTTP Request (every 30 sec)
           │
           ▼
┌──────────────────────────┐
│   FLASK BACKEND          │
│                          │
│ INSERT courier_locations:│
│ • courier_id: 3         │
│ • order_id: 1           │
│ • lat: 50.4420          │
│ • lon: 30.5150          │
│ • timestamp: NOW()      │
│                          │
│ UPDATE couriers SET:     │
│ • current_lat: 50.4420  │
│ • current_lon: 30.5150  │
│ • last_update: NOW()    │
└──────────┬───────────────┘
           │
           │ Response: {"message": "OK"}
           │
           ▼
┌──────────────────────────┐
│  CLIENT APP              │
│  (polling every 3 sec)   │
│                          │
│ GET /api/orders/1        │
│                          │
│ Response includes:       │
│ • courier_lat: 50.4420   │
│ • courier_lon: 30.5150   │
│ • status: "in_transit"   │
│                          │
│ Update map:              │
│ 🚗 Position on map      │
│ 📍 Direction to delivery│
└──────────────────────────┘
```

---

## 5. Data Flow (полный цикл)

```
CLIENT                  BACKEND                    DB
  │                      │                        │
  ├─ Create Order ──────→│                        │
  │                      ├─ Save Order ──────────→│
  │                      │                        │
  │                      ├─ Find Couriers ────────│
  │                      │ in 5km radius          │
  │                      │                        │
  │ ← ← Notifications ←──┤                        │
  │ (order available)    │                        │
  │                      │                        │
  └─ Poll status ──────→ ├─ Get Order ───────────→│
     every 3s            │                        │
                         ├─ Return: "new"        │
                         │                        │
COURIER                  │                        │
  │                      │                        │
  ├─ Accept Order ──────→│                        │
  │                      ├─ Update Order ───────→│
  │                      │ status: assigned       │
  │                      ├─ Save location ──────→│
  │                      │ (every 30s)            │
  │                      │                        │
  │                      ├─ Notify Client ──────│─→ (webhook)
  │                      │                        │
ADMIN                    │                        │
  │                      │                        │
  ├─ View Dashboard ────→│                        │
  │                      ├─ Get Stats ───────────→│
  │                      │ • Total orders         │
  │                      │ • Active couriers      │
  │                      │ • Revenue              │
  │                      │                        │
  │                      ├─ Get All Couriers ───→│
  │                      │ with GPS positions     │
  │                      │                        │
  │                      ├─ Return Map Data      │
  │ ← ← Courier Positions←┤                        │
```

---

## 6. Database Schema (простая версия)

```
┌─────────────────────┐     ┌──────────────────────┐
│      users          │     │     couriers         │
├─────────────────────┤     ├──────────────────────┤
│ id (PK)             │     │ id (PK)              │
│ username            │     │ user_id (FK)         │
│ email               │     │ current_lat          │
│ password_hash       │     │ current_lon          │
│ role (admin/        │     │ status (online/      │
│  user/courier)      │     │  offline/on_delivery)│
│ is_active           │     │ avg_rating           │
│ created_at          │     │ total_deliveries     │
└─────────────────────┘     └──────────────────────┘
        │                            │
        │ N:1                        │ 1:N
        │                            │
        └────────────────┬───────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌───────────────┐  ┌──────────────┐  ┌──────────────┐
│    orders     │  │   reviews    │  │courier_locs  │
├───────────────┤  ├──────────────┤  ├──────────────┤
│ id (PK)       │  │ id (PK)      │  │ id (PK)      │
│ client_id (FK)│  │ order_id (FK)│  │ courier_id   │
│ courier_id(FK)│  │ client_id(FK)│  │  (FK)        │
│ status        │  │ courier_id   │  │ latitude     │
│ address       │  │  (FK)        │  │ longitude    │
│ product_*     │  │ rating (1-5) │  │ timestamp    │
│ distance_km   │  │ comment      │  │              │
│ price         │  │ created_at   │  │              │
│ created_at    │  │              │  │              │
└───────────────┘  └──────────────┘  └──────────────┘
```

---

## 7. Алгоритм поиска ближайших курьеров (Pseudocode)

```python
def find_nearby_couriers(order):
    # 1. Get all active couriers
    active_couriers = [
        Courier(id=1, name="Иван", lat=50.4500, lon=30.5200, status="online"),
        Courier(id=2, name="Мария", lat=50.4600, lon=30.5300, status="online"),
        Courier(id=3, name="Петров", lat=50.4400, lon=30.5100, status="on_delivery"),
        # ...
    ]
    
    # 2. Calculate distances
    nearby = []
    for courier in active_couriers:
        distance = haversine_distance(
            courier.lat, courier.lon,
            order.delivery_lat, order.delivery_lon
        )
        
        # 3. Filter by radius (5km)
        if distance <= 5.0:
            nearby.append({
                'courier': courier,
                'distance': distance
            })
    
    # 4. Sort by distance
    nearby.sort(key=lambda x: x['distance'])
    
    # 5. Get top 5
    top_5 = nearby[:5]
    
    # 6. Send notifications
    for i, item in enumerate(top_5):
        send_notification(
            user_id=item['courier'].user_id,
            title="📦 Новый заказ!",
            message=f"{order.product} ({item['distance']:.1f} км)",
            order_id=order.id,
            priority=i  # Lower = higher priority
        )
    
    return top_5
```

---

Эти диаграммы помогут вам лучше понять архитектуру системы! 🎯
