# 🚀 Delivery Manager - ИНСТРУКЦИЯ ДЛЯ ПОЛЬЗОВАТЕЛЯ

## ✅ Статус системы

**Система полностью функциональна и готова к использованию!**

- ✅ Backend API запущен на порту 5000
- ✅ Frontend готов на порту 8000
- ✅ База данных инициализирована
- ✅ JWT аутентификация работает
- ✅ Все три роли поддерживаются

---

## 🎯 НАЧАЛО РАБОТЫ

### 1️⃣ Запустите Backend (если еще не запущен)

```bash
cd backend
python app.py
```

Вы должны увидеть:
```
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

### 2️⃣ Запустите Frontend

В **отдельном терминале**:

```bash
cd frontend
python -m http.server 8000
```

Вы должны увидеть:
```
Serving HTTP on 0.0.0.0 port 8000 ...
```

### 3️⃣ Откройте браузер

**Перейдите на:**
```
http://localhost:8000/login.html
```

---

## 🔑 Вход в систему

### Демо-аккаунты для тестирования:

| Роль | Пользователь | Пароль |
|------|-------------|---------|
| **Admin** | admin | admin123 |
| **Courier** | courier1 | pass123 |
| **Client** | client1 | pass123 |

**Попробуйте:** admin / admin123

---

## 🧭 Навигация после входа

После входа вы увидите главную страницу с меню:

- 📊 **Dashboard** - Главная страница (выбирается автоматически по роли)
- 📦 **Orders** - Управление заказами
- ⚙️ **Settings** - Настройки профиля
- 🚪 **Logout** - Выход из системы

---

## 👨‍💼 ДЛЯ АДМИНИСТРАТОРА (Admin)

### Возможности:
1. **Просмотр пользователей** - Список всех пользователей в системе
2. **Статистика** - Количество заказов, доставок, активных курьеров
3. **Управление заказами** - Просмотр всех заказов
4. **Профиль** - Информация об аккаунте

### Как использовать:
1. Войдите с аккаунтом: `admin` / `admin123`
2. Вы будете перенаправлены на Admin Dashboard
3. Смотрите статистику в верхней части
4. Управляйте пользователями в таблице

---

## 🚴 ДЛЯ КУРЬЕРА (Courier)

### Возможности:
1. **Доступные заказы** - Список заказов, ждущих курьера
2. **Текущая доставка** - Активный заказ, если есть
3. **История доставок** - Завершенные доставки
4. **Рейтинг** - Ваш рейтинг и статистика

### Как использовать:
1. Войдите с аккаунтом: `courier1` / `pass123`
2. Вы будете перенаправлены на Courier Dashboard
3. Нажмите на заказ из "Available Orders"
4. Примите заказ и начните доставку
5. Завершите доставку после прибытия

---

## 👤 ДЛЯ КЛИЕНТА (Client)

### Возможности:
1. **Создание заказа** - Новая доставка
2. **История заказов** - Ваши заказы
3. **Отзывы** - Оценка доставок
4. **Профиль** - Настройки профиля

### Как использовать:
1. Войдите с аккаунтом: `client1` / `pass123`
2. Нажмите **"Create New Order"**
3. Заполните форму:
   - Адрес доставки
   - Описание товара
   - Категория
   - Расстояние
4. Нажмите "Create Order"
5. Отслеживайте доставку в истории

---

## 🧪 ТЕСТИРОВАНИЕ

### Проверка, что все работает:

#### Способ 1: Отладочная консоль

1. Откройте http://localhost:8000/debug.html
2. Нажимайте кнопки и смотрите логи
3. Все должно быть зелено ✅

#### Способ 2: DevTools браузера

1. Откройте http://localhost:8000/login.html
2. Нажмите **F12** на клавиатуре
3. Перейдите на вкладку **Console**
4. Логинитесь
5. Смотрите логи в консоли

#### Способ 3: PowerShell

Проверьте API напрямую:

```powershell
$headers = @{"Content-Type"="application/json"}
$body = '{"username":"admin","password":"admin123"}'
$response = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -Headers $headers -Body $body -UseBasicParsing
$response.Content | ConvertFrom-Json | Select-Object access_token, user
```

Должны получить токен и информацию о пользователе.

---

## 🔧 РЕШЕНИЕ ПРОБЛЕМ

### ❌ Проблема: "Кнопки не работают"

**Решение:**
1. Откройте DevTools (F12)
2. Перейдите на Console
3. Проверьте ошибки
4. Очистите кэш: Ctrl+Shift+Delete

### ❌ Проблема: "Cannot connect to server"

**Решение:**
1. Проверьте, запущен ли backend:
   ```powershell
   netstat -ano | Select-String "5000"
   ```
2. Если нет - запустите `python app.py` в папке `backend`

### ❌ Проблема: "Login failed"

**Решение:**
1. Проверьте учетные данные (используйте admin/admin123)
2. Откройте DevTools и смотрите Network tab
3. Проверьте, есть ли ошибка в ответе API

### ❌ Проблема: "CSS не загружается"

**Решение:**
1. Проверьте, что файл `styles/style.css` существует
2. В DevTools → Network tab найдите style.css
3. Если статус 404 - проверьте пути в index.html

### ❌ Проблема: "localStorage error"

**Решение:**
```javascript
// В консоли (F12):
localStorage.clear()
sessionStorage.clear()
location.reload()
```

---

## 📁 СТРУКТУРА ФАЙЛОВ

```
📦 Project/
├── 🔧 backend/
│   ├── app.py                 ← Главный API
│   ├── requirements.txt       ← Python пакеты
│   └── delivery.db           ← База данных
│
├── 🎨 frontend/
│   ├── login.html             ← Страница входа
│   ├── index.html             ← Главная страница
│   ├── debug.html             ← Отладочная консоль
│   ├── styles/
│   │   └── style.css          ← Стили
│   └── js/
│       ├── api.js             ← HTTP клиент
│       └── app.js             ← Логика приложения
│
└── 📚 docs/                   ← Полная документация
```

---

## 📊 API ENDPOINTS

Основные endpoints для разработки:

```
POST   /api/auth/login              ← Вход
POST   /api/auth/logout             ← Выход
GET    /api/user/profile            ← Профиль
GET    /api/admin/users             ← Пользователи (admin)
GET    /api/admin/stats             ← Статистика (admin)
POST   /api/orders                  ← Создать заказ (client)
GET    /api/orders                  ← Мои заказы
GET    /api/courier/available       ← Доступные заказы (courier)
POST   /api/reviews                 ← Оставить отзыв
GET    /api/health                  ← Проверка статуса
```

---

## 💾 ДАННЫЕ ХРАНЯТСЯ

- **localStorage** - Токен (auth_token)
- **localStorage** - Профиль пользователя (current_user)
- **SQLite** - Все данные в backend/delivery.db

Очистить локальные данные:
```javascript
localStorage.clear()
```

---

## 🌐 URLS ДЛЯ БЫСТРОГО ДОСТУПА

| Страница | URL |
|---------|-----|
| 🔐 **Логин** | http://localhost:8000/login.html |
| 🏠 **Главная** | http://localhost:8000/index.html |
| 🧪 **Отладка** | http://localhost:8000/debug.html |
| 📱 **PWA** | http://localhost:8000/manifest.json |
| ⚙️ **API Status** | http://localhost:5000/api/health |

---

## ✨ ОСНОВНЫЕ ВОЗМОЖНОСТИ

✅ **Полностью функциональная система управления доставками**
✅ **Три роли: Admin, Courier, Client**
✅ **JWT аутентификация**
✅ **Responsive дизайн**
✅ **PWA (Progressive Web App)**
✅ **Offline mode**
✅ **Service Workers**
✅ **20+ API endpoints**
✅ **SQLite база данных**
✅ **Production-ready код**
✅ **Полная документация**

---

## 📞 НУЖНА ПОМОЩЬ?

1. Проверьте файлы в папке `/docs` - там полная документация
2. Откройте DevTools (F12) и посмотрите Console
3. Посетите http://localhost:8000/debug.html для диагностики
4. Проверьте логи backend в терминале

---

**Система готова к использованию! Enjoy! 🎉**

Вопросы? Посмотрите документацию в `/docs/ETAP2_TROUBLESHOOTING.md`
