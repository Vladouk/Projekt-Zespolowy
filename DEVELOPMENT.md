# Delivery Manager - Development Guide

## 🚀 Швидкий старт

### Вимоги
- Python 3.8+
- Node.js (опціонально, для деяких інструментів)
- Git
- Docker + Docker Compose (опціонально)

### Backend (Flask)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend запуститься на `http://localhost:5000`

**Доступні endpoints:**
- `GET /api/health` - перевірка здоров'я API
- `GET /api/orders` - список замовлень
- `POST /api/orders` - додати замовлення
- `PUT /api/orders/<id>` - оновити замовлення
- `DELETE /api/orders/<id>` - видалити замовлення
- `GET /api/stats` - статистика

### Frontend (Static)

```bash
cd frontend
python -m http.server 8000
```

Frontend буде доступний на `http://localhost:8000`

## 🐳 Docker

```bash
# Запустити з Docker Compose
docker-compose up

# Зупинити
docker-compose down
```

Додаток буде доступний на `http://localhost`

## 📝 Структура коду

### Frontend
- `index.html` - основна сторінка HTML
- `styles/style.css` - стилі
- `js/app.js` - головна логіка
- `js/api.js` - API клієнт
- `js/offline.js` - офлайн функціональність (IndexedDB)
- `sw.js` - Service Worker
- `manifest.json` - PWA конфігурація

### Backend
- `app.py` - Flask додаток з API маршрутами
- `database.db` - SQLite база даних (створюється автоматично)

## 🧪 Тестування API

### Curl примери

```bash
# Отримати всі замовлення
curl http://localhost:5000/api/orders

# Додати замовлення
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"address":"вул. Пушкіна, 10","status":"нове"}'

# Оновити замовлення
curl -X PUT http://localhost:5000/api/orders/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"в дорозі"}'

# Видалити замовлення
curl -X DELETE http://localhost:5000/api/orders/1

# Статистика
curl http://localhost:5000/api/stats
```

### Postman

Імпортуйте колекцію:

```json
{
  "info": {
    "name": "Delivery Manager API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Orders",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/api/orders"
      }
    },
    {
      "name": "Create Order",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/orders",
        "body": {
          "raw": "{\"address\":\"вул. Пушкіна, 10\",\"status\":\"нове\"}"
        }
      }
    }
  ]
}
```

## 🌐 PWA Features

### Встановлення на мобільні пристрої

1. Відкрийте додаток у браузері
2. Натисніть меню браузера (три точки)
3. Виберіть "Встановити додаток"

### Офлайн режим

- Додаток працює офлайн завдяки Service Worker
- Дані зберігаються локально в IndexedDB
- При відновленні з'єднання автоматична синхронізація

## 📊 Git Workflow

### Гілки

- `main` - стабільна версія
- `develop` - розробка
- `feature/*` - нові функції
- `bugfix/*` - виправлення помилок

### Commit messages

```
🚀 feat: Додано нову функцію
🐛 fix: Виправлено помилку
📚 docs: Оновлена документація
🎨 style: Форматування коду
♻️  refactor: Рефакторинг
🧪 test: Додані тести
🔧 chore: Конфігурація
```

## 🚢 Deployment

### Vercel (Frontend)

```bash
npm install -g vercel
vercel
```

### Heroku (Backend)

```bash
heroku login
heroku create delivery-manager-api
git push heroku main
```

## 📱 Mobile Testing

### Android
```bash
# Використовуйте Chrome DevTools
chrome://inspect
```

### iOS
```bash
# Використовуйте Safari Developer Tools
Develop → <Device> → <App>
```

## 🐛 Debugging

### Browser Console
```javascript
// Перевірити Service Worker
navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => console.log(sw)))

// Перевірити IndexedDB
indexedDB.databases().then(dbs => console.log(dbs))

// Отримати всі замовлення з IndexedDB
getOrdersFromDB().then(orders => console.table(orders))
```

### Network Tab
Перевірте запити API таCache від Service Worker

## 📞 Support

Для запитань та проблем:
- Відкрийте Issue на GitHub
- Напишіть в Discord чат команди

## 📖 Додаткові ресурси

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Flask Documentation](https://flask.palletsprojects.com/)
