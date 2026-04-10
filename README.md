# 🚀 DELIVERY MANAGER v2.0

## Professional Delivery Management System - FULLY PRODUCTION-READY

> **Complete, tested, and production-ready delivery management platform with 3-role architecture, dynamic pricing, and modern UI/UX.**

---

## ⚡ Quick Start (30 seconds)

### Windows Users
```
1. Double-click: backend/start.bat
2. Double-click: frontend/start.bat (new window)
3. Visit: http://localhost:8000/frontend/start.html
```

### Terminal Users
```bash
# Terminal 1: Backend
cd backend && python run.py

# Terminal 2: Frontend
cd frontend && python -m http.server 8000
```

### One Command
```bash
python run_all.py
```

**Login:** admin / admin123

---

## ✨ Features

### 👨‍💼 Admin Dashboard
- View all users and manage roles
- Real-time system statistics
- Activity monitoring & audit logs

### 🚴 Courier App
- Browse nearby orders
- Accept deliveries
- Update delivery status
- Track earnings & ratings

### � Client Portal
- Create delivery orders
- Real-time price calculation
- Track order status
- Leave reviews for couriers

### 🔐 Security
- JWT authentication (7-day tokens)
- Password hashing (Werkzeug)
- Role-based access control
- Activity logging

### 📱 Mobile Ready
- Fully responsive design
- PWA support (offline mode)
- Service Workers
- Install-on-home-screen

---

## 📊 Technology Stack

**Backend:**
- Python 3.8+
- Flask 2.3.3
- Flask-JWT-Extended
- SQLite 3

**Frontend:**
- HTML5 / CSS3 / ES6+ JavaScript
- Fetch API
- Service Workers
- PWA APIs

---

## 🎯 Core Functionality

✅ 3-role authorization system  
✅ Dynamic pricing algorithm  
✅ Order management (CRUD)  
✅ Courier review system (1-5 stars)  
✅ Real-time statistics dashboard  
✅ Activity logging & audit trail  
✅ JWT authentication  
✅ CORS protection  
✅ Mobile responsive design  
✅ PWA offline support  

---

## 📁 Project Structure

```
├── backend/
│   ├── app.py              (800+ lines, complete API)
│   ├── run.py              (startup script)
│   ├── requirements.txt
│   └── start.bat           (Windows launcher)
├── frontend/
│   ├── index.html          (main dashboard)
│   ├── login.html          (authentication)
│   ├── js/app.js           (820+ lines logic)
│   ├── js/api.js           (HTTP client)
│   ├── styles/style.css    (1000+ lines)
│   └── start.bat           (Windows launcher)
├── Documentation/          (8+ comprehensive files)
├── run_all.py             (dual server launcher)
└── docker-compose.yml     (Docker config)
```

---

## 💻 API Endpoints

```
Authentication:
  POST   /api/auth/login
  POST   /api/auth/register
  GET    /api/auth/me
  POST   /api/auth/logout

Admin:
  GET    /api/admin/users
  PUT    /api/admin/users/:id/role
  GET    /api/admin/stats

Orders:
  POST   /api/orders/create
  GET    /api/orders/my
  DELETE /api/orders/:id/cancel

Courier:
  GET    /api/courier/available
  POST   /api/courier/accept/:id
  PUT    /api/courier/status/:id

Reviews:
  POST   /api/reviews/:id
```

---

## 💰 Pricing Formula

```
Price = $15 × Distance × Category × Urgency

Example:
  2.5km food order = $15 × 2.5 × 1.5 = $56.25
  5km urgent electronics = $15 × 5 × 2.0 × 2.0 = $300
```

---

## 📚 Documentation

See these files for detailed information:
- `START_HERE.md` - Complete getting started guide
- `COMPLETION_REPORT.md` - What was implemented
- `ETAP2_PLAN.md` - Future development roadmap
- `FINAL_SUMMARY.txt` - Comprehensive summary

## 🚀 Початок роботи

### 1️⃣ Клонування репозиторію

```bash
git clone https://github.com/Vladouk/Projekt-Zespolowy.git
cd Projekt-Zespolowy
```

### 2️⃣ Запуск Backend (Flask)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend запуститься на `http://localhost:5000`

### 3️⃣ Запуск Frontend

Відкрийте `frontend/index.html` у браузері або запустіть локальний сервер:

```bash
cd frontend
python -m http.server 8000
```

Додаток буде доступний на `http://localhost:8000`

## 📱 Встановлення як PWA

1. Відкрийте додаток у браузері
2. Натисніть на кнопку "Встановити" (в адресному барі браузера)
3. Додаток буде встановлений на вашому пристрої

## 🔌 API Endpoints

### GET `/api/orders`
Отримати список всіх замовлень

```json
[
  {
    "id": 1,
    "address": "вул. Пушкіна, 10",
    "status": "в дорозі",
    "date": "2026-04-10"
  }
]
```

### POST `/api/orders`
Додати нове замовлення

```json
{
  "address": "вул. Шевченка, 5",
  "status": "нове"
}
```

### PUT `/api/orders/<id>`
Оновити замовлення

### DELETE `/api/orders/<id>`
Видалити замовлення

## 👥 Команда

- **Vladyslav Khanchych** (96011) - Лідер проекту
- **Stanislaw Szary** (96502) - Архітектор
- **Oleksandr Nechyporenko** - Програміст/Тестер

## 📅 Семестр

Семестр летній 2025/2026
Провідник: Паведел Сікора

## 🔗 Посилання

- [GitHub Repository](https://github.com/Vladouk/Projekt-Zespolowy)
- [Miro Board (Kanban)](https://miro.com/app/board/uXjVGuydg84=/?share_link_id=82676155054)

## 📝 Ліцензія

MIT License
