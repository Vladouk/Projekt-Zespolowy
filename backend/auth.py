"""
Delivery Manager - Authentication & Authorization System
Система авторизації з JWT токенами та ролями (Admin, User)
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, get_jwt
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from datetime import datetime, timedelta
import os

# Створити blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

DATABASE = 'database.db'
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')

# ============================================================
# Database Functions
# ============================================================

def get_db_connection():
    """Отримати з'єднання до БД"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_auth_db():
    """Ініціалізувати таблиці для авторизації"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Таблиця користувачів
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Таблиця для логування активності
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            resource TEXT,
            details TEXT,
            ip_address TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Auth таблиці ініціалізовані")

def create_admin_user():
    """Створити адміна за замовчуванням"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    admin_username = "admin"
    admin_email = "admin@delivery-manager.com"
    admin_password = "admin123"  # ЗМІНІТЬ У PRODUCTION!
    
    try:
        cursor.execute('SELECT id FROM users WHERE username = ?', (admin_username,))
        if cursor.fetchone():
            print("ℹ️  Admin користувач уже існує")
            return
        
        password_hash = generate_password_hash(admin_password)
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role, is_active)
            VALUES (?, ?, ?, ?, 1)
        ''', (admin_username, admin_email, password_hash, 'admin'))
        
        conn.commit()
        print(f"✅ Admin користувач створено")
        print(f"   📧 Email: {admin_email}")
        print(f"   🔑 Password: {admin_password}")
        print(f"   ⚠️  ЗМІНІТЬ ПАРОЛЬ ПІСЛЯ ЛОГІНУ!")
    
    except sqlite3.IntegrityError as e:
        print(f"ℹ️  Admin користувач вже існує")
    finally:
        conn.close()

# ============================================================
# Authentication Routes
# ============================================================

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    POST /api/auth/register
    Реєстрація нового користувача
    
    Body:
    {
        "username": "john_doe",
        "email": "john@example.com",
        "password": "securepassword123"
    }
    """
    try:
        data = request.get_json()
        
        # Валідація
        if not data or not all(k in data for k in ['username', 'email', 'password']):
            return jsonify({'error': 'Потрібні поля: username, email, password'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip()
        password = data['password']
        
        # Перевірки
        if len(username) < 3:
            return jsonify({'error': 'Ім\'я користувача повинно містити щонайменше 3 символи'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Пароль повинен містити щонайменше 6 символів'}), 400
        
        if '@' not in email:
            return jsonify({'error': 'Невірна email адреса'}), 400
        
        # Хешування пароля
        password_hash = generate_password_hash(password)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute('''
                INSERT INTO users (username, email, password_hash, role)
                VALUES (?, ?, ?, 'user')
            ''', (username, email, password_hash))
            
            user_id = cursor.lastrowid
            conn.commit()
            
            # Логування
            log_activity(user_id, 'register', 'user', 'Нова реєстрація')
            
            print(f"✅ Новий користувач зареєстрований: {username}")
            
            return jsonify({
                'message': 'Користувач успішно зареєстрований',
                'user_id': user_id,
                'username': username
            }), 201
        
        except sqlite3.IntegrityError:
            conn.close()
            return jsonify({'error': 'Ім\'я користувача або email вже зайняті'}), 409
    
    except Exception as e:
        print(f"❌ Помилка реєстрації: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    POST /api/auth/login
    Логін користувача
    
    Body:
    {
        "username": "john_doe",
        "password": "securepassword123"
    }
    """
    try:
        data = request.get_json()
        
        if not data or not all(k in data for k in ['username', 'password']):
            return jsonify({'error': 'Потрібні поля: username, password'}), 400
        
        username = data['username']
        password = data['password']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Знайти користувача
        cursor.execute('''
            SELECT id, username, email, password_hash, role, is_active 
            FROM users 
            WHERE username = ?
        ''', (username,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'Невірне ім\'я користувача або пароль'}), 401
        
        if not user['is_active']:
            return jsonify({'error': 'Акаунт деактивований'}), 403
        
        # Перевірити пароль
        if not check_password_hash(user['password_hash'], password):
            return jsonify({'error': 'Невірне ім\'я користувача або пароль'}), 401
        
        # Створити JWT токен
        access_token = create_access_token(
            identity=user['id'],
            additional_claims={
                'username': user['username'],
                'role': user['role'],
                'email': user['email']
            },
            expires_delta=timedelta(days=7)
        )
        
        # Логування
        log_activity(user['id'], 'login', 'auth', 'Успішний логін')
        
        print(f"✅ Користувач залогінився: {username}")
        
        return jsonify({
            'message': 'Успішна авторизація',
            'access_token': access_token,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role']
            }
        }), 200
    
    except Exception as e:
        print(f"❌ Помилка логіну: {str(e)}")
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """
    GET /api/auth/me
    Отримати інформацію про поточного користувача
    """
    try:
        user_id = get_jwt_identity()
        claims = get_jwt()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, email, role, is_active, created_at
            FROM users
            WHERE id = ?
        ''', (user_id,))
        
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'Користувач не знайдено'}), 404
        
        return jsonify({
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role'],
            'is_active': user['is_active'],
            'created_at': user['created_at']
        }), 200
    
    except Exception as e:
        print(f"❌ Помилка отримання користувача: {str(e)}")
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """
    GET /api/auth/users
    Отримати список всіх користувачів (тільки для admin)
    """
    try:
        claims = get_jwt()
        
        # Перевірити роль
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Доступ заборонено. Потрібна роль admin'}), 403
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, email, role, is_active, created_at
            FROM users
            ORDER BY created_at DESC
        ''')
        
        users = cursor.fetchall()
        conn.close()
        
        users_list = []
        for user in users:
            users_list.append({
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'role': user['role'],
                'is_active': user['is_active'],
                'created_at': user['created_at']
            })
        
        return jsonify(users_list), 200
    
    except Exception as e:
        print(f"❌ Помилка отримання користувачів: {str(e)}")
        return jsonify({'error': str(e)}), 500

@auth_bp.route('/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def update_user_role(user_id):
    """
    PUT /api/auth/users/<id>/role
    Змінити роль користувача (тільки для admin)
    
    Body:
    {
        "role": "admin"  // або "user"
    }
    """
    try:
        claims = get_jwt()
        
        # Перевірити роль
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Доступ заборонено. Потрібна роль admin'}), 403
        
        data = request.get_json()
        
        if not data or 'role' not in data:
            return jsonify({'error': 'Потрібне поле: role'}), 400
        
        new_role = data['role']
        
        if new_role not in ['admin', 'user']:
            return jsonify({'error': 'Невірна роль. Допустимі: admin, user'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users
            SET role = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (new_role, user_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Користувач не знайдено'}), 404
        
        conn.commit()
        
        # Логування
        admin_id = get_jwt_identity()
        log_activity(admin_id, 'update_user_role', f'user:{user_id}', f'Роль змінена на {new_role}')
        
        print(f"✅ Роль користувача {user_id} змінена на {new_role}")
        
        return jsonify({'message': 'Роль успішно змінена'}), 200
    
    except Exception as e:
        print(f"❌ Помилка зміни ролі: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/users/<int:user_id>/status', methods=['PUT'])
@jwt_required()
def update_user_status(user_id):
    """
    PUT /api/auth/users/<id>/status
    Активувати/деактивувати користувача (тільки для admin)
    
    Body:
    {
        "is_active": true
    }
    """
    try:
        claims = get_jwt()
        
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Доступ заборонено. Потрібна роль admin'}), 403
        
        data = request.get_json()
        
        if not data or 'is_active' not in data:
            return jsonify({'error': 'Потрібне поле: is_active'}), 400
        
        is_active = data['is_active']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users
            SET is_active = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (is_active, user_id))
        
        if cursor.rowcount == 0:
            conn.close()
            return jsonify({'error': 'Користувач не знайдено'}), 404
        
        conn.commit()
        
        # Логування
        admin_id = get_jwt_identity()
        status = 'активован' if is_active else 'деактивован'
        log_activity(admin_id, 'update_user_status', f'user:{user_id}', f'Статус: {status}')
        
        print(f"✅ Статус користувача {user_id} змінен на {is_active}")
        
        return jsonify({'message': 'Статус успішно змінен'}), 200
    
    except Exception as e:
        print(f"❌ Помилка зміни статусу: {str(e)}")
        return jsonify({'error': str(e)}), 500
    finally:
        if conn:
            conn.close()

# ============================================================
# Activity Logging
# ============================================================

def log_activity(user_id, action, resource, details):
    """Залогувати активність користувача"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO activity_logs (user_id, action, resource, details, ip_address)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, action, resource, details, request.remote_addr))
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"⚠️  Не вдалось залогувати активність: {e}")

@auth_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_activity_logs():
    """
    GET /api/auth/logs
    Отримати логи активності (тільки для admin)
    """
    try:
        claims = get_jwt()
        
        if claims.get('role') != 'admin':
            return jsonify({'error': 'Доступ заборонено. Потрібна роль admin'}), 403
        
        limit = request.args.get('limit', 100, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT al.id, al.user_id, u.username, al.action, al.resource, 
                   al.details, al.ip_address, al.timestamp
            FROM activity_logs al
            JOIN users u ON al.user_id = u.id
            ORDER BY al.timestamp DESC
            LIMIT ?
        ''', (limit,))
        
        logs = cursor.fetchall()
        conn.close()
        
        logs_list = []
        for log in logs:
            logs_list.append({
                'id': log['id'],
                'user_id': log['user_id'],
                'username': log['username'],
                'action': log['action'],
                'resource': log['resource'],
                'details': log['details'],
                'ip_address': log['ip_address'],
                'timestamp': log['timestamp']
            })
        
        return jsonify(logs_list), 200
    
    except Exception as e:
        print(f"❌ Помилка отримання логів: {str(e)}")
        return jsonify({'error': str(e)}), 500
