# CHANGELOG

Всі зміни в цьому проекті документуються у цьому файлі.

Формат базується на [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
та цей проект дотримується [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-10

### Додано

#### Frontend
- ✅ PWA структура з Service Worker
- ✅ HTML5 інтерфейс з адаптивним дизайном
- ✅ CSS3 стилі з анімаціями
- ✅ JavaScript логіка управління замовленнями
- ✅ API клієнт для комунікації з backend
- ✅ IndexedDB для офлайн зберігання даних
- ✅ Service Worker для кешування та offline support
- ✅ Web App Manifest для встановлення як додатку
- ✅ Синхронізація даних при відновленні з'єднання
- ✅ Фільтрування замовлень за статусом
- ✅ Форма додавання/редагування замовлень

#### Backend
- ✅ Flask API сервер
- ✅ SQLite база даних
- ✅ CORS для cross-origin запитів
- ✅ RESTful API endpoints:
  - `GET /api/health` - перевірка здоров'я
  - `GET /api/orders` - список замовлень
  - `GET /api/orders/<id>` - одне замовлення
  - `POST /api/orders` - створення замовлення
  - `PUT /api/orders/<id>` - оновлення замовлення
  - `DELETE /api/orders/<id>` - видалення замовлення
  - `GET /api/stats` - статистика

#### DevOps
- ✅ Docker конфігурація для backend
- ✅ Docker Compose для повного stack'у
- ✅ Nginx конфігурація з PWA support
- ✅ .gitignore для Python і Node проектів

#### Документація
- ✅ README.md з описом проекту
- ✅ DEVELOPMENT.md з гайдом для розробників
- ✅ Коментарі в коді

### Технологічний стек

**Frontend:**
- HTML5 / CSS3 / JavaScript (Vanilla)
- Progressive Web App (PWA)
- Service Workers
- IndexedDB

**Backend:**
- Python 3.8+
- Flask 2.3.3
- Flask-CORS
- SQLite 3

**DevOps:**
- Docker
- Docker Compose
- Nginx

### Структура проекту

```
delivery-manager/
├── frontend/
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   ├── styles/
│   │   └── style.css
│   └── js/
│       ├── app.js
│       ├── api.js
│       └── offline.js
├── backend/
│   ├── app.py
│   ├── Dockerfile
│   └── requirements.txt
├── docker-compose.yml
├── nginx.conf
├── setup.sh
├── README.md
├── DEVELOPMENT.md
├── CHANGELOG.md
└── .gitignore
```

## [Не випущено]

### Плаповано
- [ ] Аутентифікація користувачів
- [ ] Мультимовна підтримка
- [ ] Push повідомлення
- [ ] Геолокація і маршрути
- [ ] QR коди для замовлень
- [ ] Інтеграція з платіжними системами
- [ ] Статистика та аналітика
- [ ] Мобільний клієнт (React Native)
- [ ] Юніт-тести
- [ ] Інтеграційні тести
- [ ] E2E тести

---

## Як взяти участь

1. Fork репозиторій
2. Створіть feature гілку (`git checkout -b feature/новаФункція`)
3. Зробіть commit (`git commit -am 'Додано нову функцію'`)
4. Push до гілки (`git push origin feature/новаФункція`)
5. Відкрийте Pull Request

## Ліцензія

MIT License

## Контакти

- **Лідер проекту**: Vladyslav Khanchych (96011)
- **Email**: 0986228770v@gmail.com
- **GitHub**: [@Vladouk](https://github.com/Vladouk)
- **Repository**: [Projekt-Zespolowy](https://github.com/Vladouk/Projekt-Zespolowy)
