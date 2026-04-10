"""
🚀 DELIVERY MANAGER - PRODUCTION BACKEND
Полнофункциональная система управління доставками
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity, get_jwt, create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
import json
from datetime import datetime, timedelta
import os
import math
import uuid
from functools import wraps

# ============================================================
# INITIALIZATION
# ============================================================

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
DATABASE = 'database.db'
JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'super-secret-key-change-in-production-12345')
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

jwt = JWTManager(app)

# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with all tables"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            is_active BOOLEAN DEFAULT 1,
            avatar_url TEXT,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Couriers table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS couriers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            phone TEXT NOT NULL,
            vehicle TEXT DEFAULT 'walking',
            current_lat FLOAT,
            current_lon FLOAT,
            status TEXT DEFAULT 'offline',
            avg_rating FLOAT DEFAULT 5.0,
            total_deliveries INTEGER DEFAULT 0,
            total_earnings FLOAT DEFAULT 0,
            is_verified BOOLEAN DEFAULT 0,
            verified_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # Orders table (EXTENDED)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id INTEGER NOT NULL,
            courier_id INTEGER,
            status TEXT DEFAULT 'new',
            delivery_address TEXT NOT NULL,
            delivery_lat FLOAT,
            delivery_lon FLOAT,
            product_description TEXT NOT NULL,
            product_category TEXT DEFAULT 'other',
            product_quantity INTEGER DEFAULT 1,
            distance_km FLOAT,
            base_price FLOAT,
            suggested_price FLOAT,
            actual_price FLOAT,
            is_urgent BOOLEAN DEFAULT 0,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            assigned_at TIMESTAMP,
            completed_at TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES users(id),
            FOREIGN KEY (courier_id) REFERENCES couriers(id)
        )
    ''')
    
    # Reviews table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            client_id INTEGER NOT NULL,
            courier_id INTEGER NOT NULL,
            rating INTEGER CHECK(rating BETWEEN 1 AND 5),
            comment TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES orders(id),
            FOREIGN KEY (client_id) REFERENCES users(id),
            FOREIGN KEY (courier_id) REFERENCES couriers(id)
        )
    ''')
    
    # Courier locations history
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS courier_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            courier_id INTEGER NOT NULL,
            order_id INTEGER,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL,
            accuracy FLOAT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (courier_id) REFERENCES couriers(id),
            FOREIGN KEY (order_id) REFERENCES orders(id)
        )
    ''')
    
    # Activity logs
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            resource TEXT,
            details TEXT,
            ip_address TEXT,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    conn.commit()
    
    # Create default admin user if not exists
    cursor.execute('SELECT id FROM users WHERE username = ?', ('admin',))
    if not cursor.fetchone():
        admin_hash = generate_password_hash('admin123')
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role, is_active)
            VALUES (?, ?, ?, ?, ?)
        ''', ('admin', 'admin@delivery-manager.com', admin_hash, 'admin', 1))
        conn.commit()
        print('✅ Admin user created: admin / admin123')
    
    conn.close()

# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates in km"""
    R = 6371
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

def calculate_delivery_price(distance, category='other', is_urgent=False):
    """Calculate delivery price"""
    BASE_PRICE = 15
    
    CATEGORY_COEF = {
        'beverages': 1.0,
        'food': 1.5,
        'electronics': 2.0,
        'documents': 0.8,
        'other': 1.2
    }
    
    category_coef = CATEGORY_COEF.get(category, 1.2)
    urgency_coef = 2.0 if is_urgent else 1.0
    
    price = BASE_PRICE * distance * category_coef * urgency_coef
    return round(price * 2) / 2

def log_activity(user_id, action, resource=None, details=None):
    """Log user activity"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO activity_logs (user_id, action, resource, details)
        VALUES (?, ?, ?, ?)
    ''', (user_id, action, resource, json.dumps(details) if details else None))
    conn.commit()
    conn.close()

def dict_from_row(row):
    """Convert sqlite3.Row to dict"""
    if row is None:
        return None
    return dict(row)

# ============================================================
# AUTH ENDPOINTS
# ============================================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register new user"""
    data = request.json
    
    if not data.get('username') or not data.get('password') or not data.get('email'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        password_hash = generate_password_hash(data['password'])
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, role, is_active)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['username'], data['email'], password_hash, data.get('role', 'user'), 1))
        conn.commit()
        
        user_id = cursor.lastrowid
        log_activity(user_id, 'register', 'user', {'username': data['username']})
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': user_id,
            'username': data['username']
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email already exists'}), 409
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    data = request.json
    
    if not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Missing credentials'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM users WHERE username = ?', (data['username'],))
    user = cursor.fetchone()
    conn.close()
    
    if not user or not check_password_hash(user['password_hash'], data['password']):
        log_activity(None, 'login_failed', 'user', {'username': data['username']})
        return jsonify({'error': 'Invalid credentials'}), 401
    
    if not user['is_active']:
        return jsonify({'error': 'User account is disabled'}), 403
    
    # Create JWT token
    access_token = create_access_token(
        identity=user['id'],
        additional_claims={
            'username': user['username'],
            'role': user['role'],
            'email': user['email']
        }
    )
    
    log_activity(user['id'], 'login', 'user', {'username': user['username']})
    
    return jsonify({
        'message': 'Login successful',
        'access_token': access_token,
        'user': {
            'id': user['id'],
            'username': user['username'],
            'email': user['email'],
            'role': user['role']
        }
    }), 200

@app.route('/api/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    user_id = get_jwt_identity()
    claims = get_jwt()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'id': user['id'],
        'username': user['username'],
        'email': user['email'],
        'role': user['role'],
        'is_active': user['is_active'],
        'created_at': user['created_at']
    }), 200

@app.route('/api/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user"""
    user_id = get_jwt_identity()
    log_activity(user_id, 'logout', 'user')
    return jsonify({'message': 'Logged out successfully'}), 200

# ============================================================
# ADMIN ENDPOINTS
# ============================================================

@app.route('/api/admin/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users (admin only)"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, username, email, role, is_active, created_at FROM users')
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(users), 200

@app.route('/api/admin/users/<int:user_id>/role', methods=['PUT'])
@jwt_required()
def change_user_role(user_id):
    """Change user role (admin only)"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.json
    if not data.get('role'):
        return jsonify({'error': 'Role required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET role = ? WHERE id = ?', (data['role'], user_id))
    conn.commit()
    conn.close()
    
    log_activity(claims.get('sub'), 'change_role', 'user', {'user_id': user_id, 'role': data['role']})
    
    return jsonify({'message': 'Role updated', 'user_id': user_id, 'role': data['role']}), 200

@app.route('/api/admin/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    """Get system statistics (admin only)"""
    claims = get_jwt()
    if claims.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get stats
    cursor.execute('SELECT COUNT(*) as count FROM orders')
    total_orders = cursor.fetchone()['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = DATE("now")')
    orders_today = cursor.fetchone()['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM couriers WHERE status = "online"')
    active_couriers = cursor.fetchone()['count']
    
    cursor.execute('SELECT COUNT(*) as count FROM couriers')
    total_couriers = cursor.fetchone()['count']
    
    cursor.execute('SELECT SUM(actual_price) as total FROM orders WHERE status = "delivered"')
    total_revenue = cursor.fetchone()['total'] or 0
    
    cursor.execute('SELECT AVG(rating) as avg FROM reviews')
    avg_rating = cursor.fetchone()['avg'] or 0
    
    conn.close()
    
    return jsonify({
        'total_orders': total_orders,
        'orders_today': orders_today,
        'active_couriers': active_couriers,
        'total_couriers': total_couriers,
        'total_revenue': round(total_revenue, 2),
        'avg_rating': round(avg_rating, 2)
    }), 200

# ============================================================
# ORDER ENDPOINTS (CLIENT)
# ============================================================

@app.route('/api/orders/create', methods=['POST'])
@jwt_required()
def create_order():
    """Create new delivery order"""
    user_id = get_jwt_identity()
    data = request.json
    
    if not data.get('delivery_address') or not data.get('product_description'):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Calculate distance (mock - in real app use geolocation)
    distance = data.get('distance_km', 2.5)
    
    # Calculate price
    suggested_price = calculate_delivery_price(
        distance,
        data.get('product_category', 'other'),
        data.get('is_urgent', False)
    )
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO orders (
            client_id, delivery_address, product_description,
            product_category, distance_km, suggested_price, is_urgent
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        data['delivery_address'],
        data['product_description'],
        data.get('product_category', 'other'),
        distance,
        suggested_price,
        data.get('is_urgent', False)
    ))
    
    conn.commit()
    order_id = cursor.lastrowid
    conn.close()
    
    log_activity(user_id, 'create_order', 'order', {'order_id': order_id})
    
    return jsonify({
        'order_id': order_id,
        'price': suggested_price,
        'distance': distance,
        'status': 'new'
    }), 201

@app.route('/api/orders/my', methods=['GET'])
@jwt_required()
def get_my_orders():
    """Get user's orders"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM orders WHERE client_id = ? ORDER BY created_at DESC
    ''', (user_id,))
    orders = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(orders), 200

@app.route('/api/orders/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Get order details"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    order = dict(cursor.fetchone()) if cursor.fetchone() else None
    
    if order and order.get('courier_id'):
        cursor.execute('SELECT username FROM users WHERE id = (SELECT user_id FROM couriers WHERE id = ?)', (order['courier_id'],))
        courier = cursor.fetchone()
        if courier:
            order['courier_name'] = courier['username']
    
    conn.close()
    
    if not order:
        return jsonify({'error': 'Order not found'}), 404
    
    return jsonify(order), 200

@app.route('/api/orders/<int:order_id>/cancel', methods=['DELETE'])
@jwt_required()
def cancel_order(order_id):
    """Cancel order"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    order = cursor.fetchone()
    
    if not order or order['client_id'] != user_id:
        return jsonify({'error': 'Not authorized'}), 403
    
    if order['status'] != 'new':
        return jsonify({'error': 'Cannot cancel order in this status'}), 400
    
    cursor.execute('UPDATE orders SET status = ? WHERE id = ?', ('cancelled', order_id))
    conn.commit()
    conn.close()
    
    log_activity(user_id, 'cancel_order', 'order', {'order_id': order_id})
    
    return jsonify({'message': 'Order cancelled', 'order_id': order_id}), 200

# ============================================================
# COURIER ENDPOINTS
# ============================================================

@app.route('/api/courier/available', methods=['GET'])
@jwt_required()
def get_available_orders():
    """Get available orders near courier"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get courier info
    cursor.execute('SELECT * FROM couriers WHERE user_id = ?', (user_id,))
    courier = cursor.fetchone()
    
    if not courier:
        return jsonify({'error': 'Not a courier'}), 403
    
    # Get new orders
    cursor.execute('SELECT * FROM orders WHERE status = "new" AND courier_id IS NULL')
    orders = cursor.fetchall()
    conn.close()
    
    available = []
    for order in orders:
        # Mock distance calculation
        distance = order['distance_km'] or 2.5
        
        if distance <= 5.0:  # Within 5km radius
            available.append({
                'id': order['id'],
                'product': order['product_description'],
                'address': order['delivery_address'],
                'distance_km': distance,
                'suggested_price': order['suggested_price'],
                'category': order['product_category']
            })
    
    return jsonify(available), 200

@app.route('/api/courier/accept/<int:order_id>', methods=['POST'])
@jwt_required()
def accept_order(order_id):
    """Courier accepts order"""
    user_id = get_jwt_identity()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # Get courier
    cursor.execute('SELECT id FROM couriers WHERE user_id = ?', (user_id,))
    courier = cursor.fetchone()
    
    if not courier:
        conn.close()
        return jsonify({'error': 'Not a courier'}), 403
    
    # Get order
    cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        return jsonify({'error': 'Order not found'}), 404
    
    if order['courier_id'] is not None:
        conn.close()
        return jsonify({'error': 'Order already assigned'}), 409
    
    # Assign order
    cursor.execute('''
        UPDATE orders SET courier_id = ?, status = ?, assigned_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (courier['id'], 'assigned', order_id))
    
    conn.commit()
    conn.close()
    
    log_activity(user_id, 'accept_order', 'order', {'order_id': order_id})
    
    return jsonify({'message': 'Order accepted', 'order_id': order_id}), 200

@app.route('/api/courier/status/<int:order_id>', methods=['PUT'])
@jwt_required()
def update_order_status(order_id):
    """Update order delivery status"""
    user_id = get_jwt_identity()
    data = request.json
    
    if not data.get('status'):
        return jsonify({'error': 'Status required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        return jsonify({'error': 'Order not found'}), 404
    
    cursor.execute('SELECT id FROM couriers WHERE user_id = ?', (user_id,))
    courier = cursor.fetchone()
    
    if not courier or order['courier_id'] != courier['id']:
        conn.close()
        return jsonify({'error': 'Not authorized'}), 403
    
    new_status = data['status']
    
    if new_status == 'delivered':
        cursor.execute('''
            UPDATE orders SET status = ?, completed_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (new_status, order_id))
    else:
        cursor.execute('UPDATE orders SET status = ? WHERE id = ?', (new_status, order_id))
    
    conn.commit()
    conn.close()
    
    log_activity(user_id, 'update_order_status', 'order', {'order_id': order_id, 'status': new_status})
    
    return jsonify({'message': 'Status updated', 'order_id': order_id, 'status': new_status}), 200

# ============================================================
# REVIEW ENDPOINTS
# ============================================================

@app.route('/api/reviews/<int:order_id>', methods=['POST'])
@jwt_required()
def submit_review(order_id):
    """Submit review for order"""
    user_id = get_jwt_identity()
    data = request.json
    
    if not data.get('rating'):
        return jsonify({'error': 'Rating required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM orders WHERE id = ? AND client_id = ?', (order_id, user_id))
    order = cursor.fetchone()
    
    if not order:
        conn.close()
        return jsonify({'error': 'Order not found'}), 404
    
    if not order['courier_id']:
        conn.close()
        return jsonify({'error': 'No courier assigned'}), 400
    
    cursor.execute('''
        INSERT INTO reviews (order_id, client_id, courier_id, rating, comment)
        VALUES (?, ?, ?, ?, ?)
    ''', (order_id, user_id, order['courier_id'], data['rating'], data.get('comment', '')))
    
    conn.commit()
    conn.close()
    
    log_activity(user_id, 'submit_review', 'order', {'order_id': order_id, 'rating': data['rating']})
    
    return jsonify({'message': 'Review submitted'}), 201

# ============================================================
# HEALTH ENDPOINTS
# ============================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': '🚀 Delivery Manager API is running',
        'version': '2.0.0',
        'auth_enabled': True,
        'timestamp': datetime.now().isoformat()
    }), 200

# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    init_db()
    print('✅ Database initialized')
    print('🚀 Starting Delivery Manager API...')
    print('📍 API running at http://localhost:5000')
    print('📚 API Docs at http://localhost:5000/api/health')
    app.run(debug=True, host='0.0.0.0', port=5000)
