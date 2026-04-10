# 🧪 ETAP 2 - Тестирование API (curl примеры)

## 🔐 Подготовка: Получить токены

### 1. Логин Admin

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }' | jq

# Ответ:
# {
#   "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
#   "user": {
#     "id": 1,
#     "username": "admin",
#     "role": "admin"
#   }
# }

# Сохраняем токен:
ADMIN_TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')
```

### 2. Создать тестового CLIENT

```bash
# Регистрируем клиента
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "client_ivan",
    "email": "ivan@example.com",
    "password": "client123"
  }' | jq

# Логинимся как клиент
CLIENT_TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"client_ivan","password":"client123"}' \
  | jq -r '.access_token')

echo "CLIENT_TOKEN=$CLIENT_TOKEN"
```

### 3. Создать тестового COURIER

```bash
# Регистрируем курьера
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "courier_petrov",
    "email": "petrov@delivery.com",
    "password": "courier123"
  }' | jq

# Admin меняет роль на "courier"
curl -X PUT http://localhost:5000/api/auth/users/3/role \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"role": "courier"}' | jq

# Логинимся как курьер
COURIER_TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"courier_petrov","password":"courier123"}' \
  | jq -r '.access_token')

echo "COURIER_TOKEN=$COURIER_TOKEN"
```

---

## 📦 CLIENT ENDPOINTS

### 1. Создать заказ

```bash
curl -X POST http://localhost:5000/api/orders/create \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "delivery_address": "ул. Шевченко, 20, Киев",
    "product_description": "Пиво 2 бутылки",
    "product_category": "beverages",
    "client_lat": 50.4501,
    "client_lon": 30.5234,
    "is_urgent": false
  }' | jq

# Ответ:
# {
#   "order_id": 1,
#   "price": 37.50,
#   "distance": 2.5,
#   "status": "new"
# }

# Сохраняем ID заказа
ORDER_ID=1
```

### 2. Получить свои заказы

```bash
curl -X GET http://localhost:5000/api/orders/my \
  -H "Authorization: Bearer $CLIENT_TOKEN" | jq

# Ответ:
# [
#   {
#     "id": 1,
#     "product_description": "Пиво 2 бутылки",
#     "delivery_address": "ул. Шевченко, 20",
#     "status": "new",
#     "suggested_price": 37.50,
#     "created_at": "2026-04-10T14:30:00"
#   }
# ]
```

### 3. Получить детали конкретного заказа

```bash
curl -X GET http://localhost:5000/api/orders/$ORDER_ID \
  -H "Authorization: Bearer $CLIENT_TOKEN" | jq

# Ответ:
# {
#   "id": 1,
#   "client_id": 2,
#   "courier_id": null,
#   "product_description": "Пиво 2 бутылки",
#   "delivery_address": "ул. Шевченко, 20",
#   "distance_km": 2.5,
#   "suggested_price": 37.50,
#   "status": "new",
#   "created_at": "2026-04-10T14:30:00"
# }
```

### 4. Отменить заказ (если еще не принят)

```bash
curl -X DELETE http://localhost:5000/api/orders/$ORDER_ID/cancel \
  -H "Authorization: Bearer $CLIENT_TOKEN" | jq

# Ответ:
# {
#   "message": "Order cancelled",
#   "order_id": 1
# }
```

### 5. Получить оценку цены доставки

```bash
curl -X GET "http://localhost:5000/api/pricing/estimate?distance=2.5&category=beverages&is_urgent=false" \
  -H "Authorization: Bearer $CLIENT_TOKEN" | jq

# Ответ:
# {
#   "distance": 2.5,
#   "category": "beverages",
#   "base_price": 15,
#   "estimated_price": 37.50
# }
```

### 6. Оставить отзыв (после доставки)

```bash
curl -X POST http://localhost:5000/api/reviews/$ORDER_ID \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Отличная доставка! Быстро и аккуратно"
  }' | jq

# Ответ:
# {
#   "message": "Review submitted",
#   "review_id": 1,
#   "rating": 5
# }
```

---

## 🚗 COURIER ENDPOINTS

### 1. Получить доступные заказы

```bash
# Courier должен сначала обновить свою локацию
# Предположим он находится в Киеве

curl -X GET http://localhost:5000/api/courier/available \
  -H "Authorization: Bearer $COURIER_TOKEN" | jq

# Ответ:
# [
#   {
#     "id": 1,
#     "product": "Пиво 2 бутылки",
#     "delivery_address": "ул. Шевченко, 20",
#     "distance_km": 2.5,
#     "suggested_price": 37.50,
#     "client_rating": 4.9,
#     "estimated_time": 15
#   },
#   ...
# ]
```

### 2. Принять заказ

```bash
curl -X POST http://localhost:5000/api/courier/accept/$ORDER_ID \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq

# Ответ:
# {
#   "message": "Order accepted",
#   "order_id": 1
# }

# Теперь заказ в статусе "assigned"
```

### 3. Отправить GPS координаты

```bash
# Courier в пути отправляет свою локацию каждые 30 сек

curl -X POST http://localhost:5000/api/courier/location \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 50.4550,
    "longitude": 30.5250,
    "accuracy": 10.5,
    "order_id": 1
  }' | jq

# Ответ:
# {
#   "message": "Location updated",
#   "courier_id": 3,
#   "latitude": 50.4550,
#   "longitude": 50.5250
# }
```

### 4. Обновить статус доставки

```bash
# Статус: "in_transit" (в пути)
curl -X PUT http://localhost:5000/api/courier/status/$ORDER_ID \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_transit"}' | jq

# Ответ:
# {
#   "message": "Status updated",
#   "order_id": 1,
#   "status": "in_transit"
# }

# Статус: "delivered" (доставлено)
curl -X PUT http://localhost:5000/api/courier/status/$ORDER_ID \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "delivered"}' | jq

# Ответ:
# {
#   "message": "Status updated",
#   "order_id": 1,
#   "status": "delivered"
# }
```

### 5. Получить активные доставки

```bash
curl -X GET http://localhost:5000/api/courier/active \
  -H "Authorization: Bearer $COURIER_TOKEN" | jq

# Ответ:
# [
#   {
#     "id": 1,
#     "product": "Пиво 2 бутылки",
#     "status": "in_transit",
#     "delivery_address": "ул. Шевченко, 20",
#     "client_name": "Иван",
#     "client_phone": "+38-095-123-4567"
#   }
# ]
```

### 6. История доставок

```bash
curl -X GET http://localhost:5000/api/courier/history \
  -H "Authorization: Bearer $COURIER_TOKEN" | jq

# Ответ:
# [
#   {
#     "id": 1,
#     "product": "Пиво 2 бутылки",
#     "status": "delivered",
#     "actual_price": 37.50,
#     "client_rating": 5,
#     "completed_at": "2026-04-10T14:47:00"
#   },
#   ...
# ]
```

### 7. Моя статистика

```bash
curl -X GET http://localhost:5000/api/courier/stats \
  -H "Authorization: Bearer $COURIER_TOKEN" | jq

# Ответ:
# {
#   "total_deliveries": 25,
#   "completed_today": 3,
#   "avg_rating": 4.85,
#   "total_earnings": 924.50
# }
```

---

## 👨‍💼 ADMIN ENDPOINTS

### 1. Получить все заказы

```bash
curl -X GET http://localhost:5000/api/admin/orders \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Ответ:
# [
#   {
#     "id": 1,
#     "client_name": "Иван",
#     "courier_name": "Петров",
#     "status": "delivered",
#     "total_price": 37.50,
#     "created_at": "2026-04-10T14:30:00"
#   },
#   ...
# ]
```

### 2. Получить всех курьеров

```bash
curl -X GET http://localhost:5000/api/admin/couriers \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Ответ:
# [
#   {
#     "id": 3,
#     "username": "courier_petrov",
#     "phone": "+38-095-123-4567",
#     "status": "online",
#     "avg_rating": 4.85,
#     "total_deliveries": 25,
#     "current_lat": 50.4550,
#     "current_lon": 30.5250
#   },
#   ...
# ]
```

### 3. Получить статистику системы

```bash
curl -X GET http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Ответ:
# {
#   "total_orders": 156,
#   "orders_today": 24,
#   "active_couriers": 7,
#   "total_couriers": 12,
#   "total_revenue": 15420.50,
#   "avg_rating": 4.82,
#   "completed_today": 20
# }
```

### 4. Получить всех курьеров на карте

```bash
curl -X GET http://localhost:5000/api/admin/map \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Ответ:
# [
#   {
#     "id": 3,
#     "name": "Петров",
#     "latitude": 50.4550,
#     "longitude": 30.5250,
#     "status": "on_delivery",
#     "current_order": 1
#   },
#   {
#     "id": 4,
#     "name": "Сидоров",
#     "latitude": 50.4601,
#     "longitude": 30.5300,
#     "status": "online",
#     "current_order": null
#   },
#   ...
# ]
```

### 5. Редактировать заказ

```bash
curl -X PUT http://localhost:5000/api/admin/order/$ORDER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "actual_delivery_price": 40.00,
    "status": "delivered"
  }' | jq

# Ответ:
# {
#   "message": "Order updated",
#   "order_id": 1,
#   "actual_price": 40.00,
#   "status": "delivered"
# }
```

### 6. Удалить заказ

```bash
curl -X DELETE http://localhost:5000/api/admin/order/$ORDER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

# Ответ:
# {
#   "message": "Order deleted",
#   "order_id": 1
# }
```

---

## 🧪 Полный сценарий тестирования

```bash
#!/bin/bash

echo "=== ETAP 2 API TEST SCENARIO ==="
echo ""

# 1. Получить токены
echo "1️⃣ Getting tokens..."
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

CLIENT_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"client_ivan","password":"client123"}' \
  | jq -r '.access_token')

COURIER_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"courier_petrov","password":"courier123"}' \
  | jq -r '.access_token')

echo "✅ Tokens obtained"
echo ""

# 2. Client создает заказ
echo "2️⃣ Client creating order..."
ORDER_ID=$(curl -s -X POST http://localhost:5000/api/orders/create \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "delivery_address": "ул. Шевченко, 20",
    "product_description": "Пиво 2 бутылки",
    "product_category": "beverages",
    "client_lat": 50.4501,
    "client_lon": 30.5234,
    "is_urgent": false
  }' \
  | jq -r '.order_id')

echo "✅ Order created: #$ORDER_ID"
echo ""

# 3. Courier принимает заказ
echo "3️⃣ Courier accepting order..."
curl -s -X POST http://localhost:5000/api/courier/accept/$ORDER_ID \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}' | jq

echo "✅ Order accepted"
echo ""

# 4. Courier отправляет GPS
echo "4️⃣ Courier sending location..."
curl -s -X POST http://localhost:5000/api/courier/location \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 50.4550,
    "longitude": 30.5250,
    "accuracy": 10.0,
    "order_id": '$ORDER_ID'
  }' | jq

echo "✅ Location sent"
echo ""

# 5. Courier обновляет статус
echo "5️⃣ Courier updating status to in_transit..."
curl -s -X PUT http://localhost:5000/api/courier/status/$ORDER_ID \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_transit"}' | jq

echo "✅ Status updated"
echo ""

# 6. Courier завершает доставку
echo "6️⃣ Courier completing delivery..."
curl -s -X PUT http://localhost:5000/api/courier/status/$ORDER_ID \
  -H "Authorization: Bearer $COURIER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "delivered"}' | jq

echo "✅ Delivery completed"
echo ""

# 7. Client оставляет отзыв
echo "7️⃣ Client leaving review..."
curl -s -X POST http://localhost:5000/api/reviews/$ORDER_ID \
  -H "Authorization: Bearer $CLIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 5,
    "comment": "Отличная доставка!"
  }' | jq

echo "✅ Review submitted"
echo ""

# 8. Admin проверяет статистику
echo "8️⃣ Admin checking stats..."
curl -s -X GET http://localhost:5000/api/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq

echo ""
echo "✅ TEST SCENARIO COMPLETED!"
```

Сохраните этот скрипт как `test_etap2.sh` и запустите:

```bash
bash test_etap2.sh
```

---

## 💡 Tips для тестирования

1. **Используйте jq для парсинга JSON**
   ```bash
   brew install jq  # macOS
   choco install jq  # Windows
   ```

2. **Сохраняйте переменные между запросами**
   ```bash
   TOKEN=$(curl ... | jq -r '.access_token')
   echo $TOKEN  # Используйте позже
   ```

3. **Проверяйте статус HTTP**
   ```bash
   curl -i http://localhost:5000/api/orders/my
   # Вернет HTTP статус в первой строке
   ```

4. **Используйте pretty-print**
   ```bash
   curl ... | jq '.'  # Красивый вывод JSON
   ```

---

Удачи в тестировании! 🚀
