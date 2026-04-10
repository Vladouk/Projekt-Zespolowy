# Delivery Manager - PWA

Веб-додаток для управління доставками курйерів. Працює як Progressive Web App (PWA) - можна встановити на мобільні пристрої та комп'ютери.

## 🚀 Функціональність

- ✅ Список замовлень
- ✅ Додавання нових замовлень
- ✅ Зміна статусу доставки
- ✅ Видалення замовлень
- ✅ Офлайн режим (PWA)
- ✅ Встановлення на мобільні пристрої

## 🛠️ Технологічний стек

**Frontend:**
- HTML5 / CSS3 / JavaScript (Vanilla)
- Progressive Web App (PWA)
- Service Workers
- IndexedDB (для офлайн синхронізації)

**Backend:**
- Python Flask
- SQLite
- Flask-CORS

## 📁 Структура проекту

```
delivery-manager/
├── frontend/
│   ├── index.html              # Головна сторінка
│   ├── styles/
│   │   └── style.css           # Стилі
│   ├── js/
│   │   ├── app.js              # Основна логіка
│   │   ├── api.js              # API запити
│   │   └── offline.js          # Офлайн синхронізація
│   ├── sw.js                   # Service Worker
│   ├── manifest.json           # PWA маніфест
│   └── icons/                  # Іконки для PWA
├── backend/
│   ├── app.py                  # Flask додаток
│   ├── requirements.txt        # Залежності Python
│   └── database.db             # SQLite БД
├── .gitignore
├── README.md                   # Цей файл
└── docker-compose.yml          # Docker (опціонально)
```

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
