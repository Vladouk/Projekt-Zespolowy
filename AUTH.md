# AUTH.md - Система авторизації та ролей

## 🔐 Огляд

Система авторизації базується на **JWT токенах** (JSON Web Tokens) з підтримкою двох ролей:
- **Admin** - адміністратор з повним доступом
- **User** - звичайний користувач

## 👥 Ролі та дозволи

### Admin
- ✅ Додавати, редагувати, видаляти замовлення
- ✅ Переглядати всіх користувачів
- ✅ Змінювати ролі користувачів
- ✅ Активувати/деактивувати користувачів
- ✅ Переглядати логи активності
- ✅ Доступ до admin панелі

### User
- ✅ Додавати, редагувати, видаляти свої замовлення
- ✅ Переглядати власний профіль
- ❌ Не можуть переглядати інших користувачів
- ❌ Не можуть змінювати ролі
- ❌ Не мають доступу до логів

## 🔑 API Endpoints

### Авторизація

#### POST /api/auth/register
Реєстрація нового користувача

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "message": "Користувач успішно зареєстрований",
  "user_id": 1,
  "username": "john_doe"
}
```

#### POST /api/auth/login
Логін користувача та отримання JWT токена

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "securepassword123"
  }'
```

**Response:**
```json
{
  "message": "Успішна авторизація",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### GET /api/auth/me
Отримати інформацію про поточного користувача

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "user",
  "is_active": true,
  "created_at": "2026-04-10T10:30:00"
}
```

### Управління користувачами (Admin Only)

#### GET /api/auth/users
Отримати список всіх користувачів

```bash
curl http://localhost:5000/api/auth/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

#### PUT /api/auth/users/<id>/role
Змінити роль користувача

```bash
curl -X PUT http://localhost:5000/api/auth/users/2/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"role": "admin"}'
```

#### PUT /api/auth/users/<id>/status
Активувати/деактивувати користувача

```bash
curl -X PUT http://localhost:5000/api/auth/users/2/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"is_active": false}'
```

#### GET /api/auth/logs
Отримати логи активності

```bash
curl "http://localhost:5000/api/auth/logs?limit=50" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## 🔧 Користування токенами

### Збереження токена (Frontend)

```javascript
// Логін
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const data = await response.json();

// Зберегти токен
localStorage.setItem('auth_token', data.access_token);
```

### Використання токена у запитах

```javascript
const token = localStorage.getItem('auth_token');

const response = await fetch('/api/orders', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Автоматична обробка невірного токена

```javascript
if (response.status === 401) {
  // Токен невірний
  localStorage.removeItem('auth_token');
  window.location.href = 'login.html';
}
```

## 👤 Demo акаунти

### Для тестування доступні:

**Admin акаунт:**
```
Username: admin
Email: admin@delivery-manager.com
Password: admin123
Role: admin
```

**Створення нових користувачів:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test_user",
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🔒 Безпека

### Рекомендації

1. **Змініть JWT_SECRET_KEY в production:**
   ```python
   app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
   ```

2. **Використовуйте HTTPS**
   - Ніколи не відправляйте токени по незашифрованому з'єднанню

3. **Встановіть терміни дії токена**
   - JWT токени мають терміни дії
   - Реалізуйте refresh токени для довгострокових сесій

4. **Валідація паролів**
   - Мінімум 6 символів
   - Переважно 12+ символів

5. **CORS конфігурація**
   - Обмежте CORS для відомих доменів у production

## 📊 Таблиці БД

### users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',  -- 'admin' або 'user'
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### activity_logs
```sql
CREATE TABLE activity_logs (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  action TEXT,              -- 'login', 'register', 'create_order', etc.
  resource TEXT,            -- об'єкт що змінився
  details TEXT,             -- додаткові деталі
  ip_address TEXT,
  timestamp TIMESTAMP
)
```

## 🛡️ Обробка помилок

### 401 Unauthorized
```json
{
  "error": "Невірне ім'я користувача або пароль"
}
```

### 403 Forbidden
```json
{
  "error": "Доступ заборонено. Потрібна роль admin"
}
```

### 409 Conflict
```json
{
  "error": "Ім'я користувача або email вже зайняті"
}
```

## 🔄 Флу авторизації

```
┌─────────────────────────────────────────────┐
│         1. Користувач реєструється          │
│    (username, email, password) → Register   │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
         ┌─────────────────────┐
         │  2. Користувач      │
         │     логінується      │
         │  → Login API        │
         └──────────┬──────────┘
                    │
                    ↓
      ┌──────────────────────────┐
      │  3. Сервер генерує      │
      │     JWT токен           │
      │  ← Access Token         │
      └──────────┬───────────────┘
                 │
                 ↓
     ┌───────────────────────────┐
     │ 4. Клієнт зберігає       │
     │    токен (localStorage)  │
     └───────────┬───────────────┘
                 │
                 ↓
    ┌────────────────────────────┐
    │ 5. Клієнт відправляє      │
    │    токен з кожним запитом │
    │  Authorization: Bearer... │
    └────────────┬───────────────┘
                 │
                 ↓
      ┌──────────────────────────┐
      │ 6. Сервер верифікує     │
      │    токен                │
      │  ✓ Дозволити операцію  │
      │  ✗ Відхилити (401)      │
      └──────────────────────────┘
```

## 🧪 Тестування авторизації

### Curl приклади

```bash
# 1. Реєстрація
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"pass123"}'

# 2. Логін
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.access_token')

# 3. Використати токен
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 4. Отримати користувачів (як admin)
curl http://localhost:5000/api/auth/users \
  -H "Authorization: Bearer $TOKEN"
```

## 📚 Додаткові ресурси

- [JWT.io](https://jwt.io/) - інформація про JWT
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/) - документація
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
