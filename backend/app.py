"""
Delivery Manager - Flask Backend
API для управління замовленнями доставки
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
from datetime import datetime
import os

# Ініціалізація Flask
app = Flask(__name__)
CORS(app)

# Конфігурація
DATABASE = 'database.db'

# ============================================================
# Database Functions
# ============================================================

def get_db_connection():
    """Отримати з'єднання до БД"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Ініціалізувати БД"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            address TEXT NOT NULL,
            status TEXT NOT NULL,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ База даних ініціалізована")

# ============================================================
# API Routes
# ============================================================

@app.route('/api/health', methods=['GET'])
def health():
    """Перевірка здоров'я API"""
    return jsonify({
        'status': 'ok',
        'message': 'Delivery Manager API is running',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/orders', methods=['GET'])
def get_orders():
    """
    GET /api/orders
    Отримати список всіх замовлень
    
    Query Parameters:
        - status: фільтрування за статусом (опціонально)
    """
    try:
        status_filter = request.args.get('status')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if status_filter:
            cursor.execute('''
                SELECT * FROM orders 
                WHERE status = ? 
                ORDER BY date DESC
            ''', (status_filter,))
        else:
            cursor.execute('SELECT * FROM orders ORDER BY date DESC')
        
        orders = cursor.fetchall()
        conn.close()
        
        # Перетворити в JSON
        orders_list = []
        for order in orders:
            orders_list.append({
                'id': order['id'],
                'address': order['address'],
                'status': order['status'],
                'date': order['date'],
                'created_at': order['created_at'],
                'updated_at': order['updated_at']
            })
        
        return jsonify(orders_list), 200
    
    except Exception as e:
        print(f"❌ Помилка отримання замовлень: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """
    GET /api/orders/<id>
    Отримати конкретне замовлення
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        conn.close()
        
        if not order:
            return jsonify({'error': 'Order not found'}), 404
        
        return jsonify({
            'id': order['id'],
            'address': order['address'],
            'status': order['status'],
            'date': order['date'],
            'created_at': order['created_at'],
            'updated_at': order['updated_at']
        }), 200
    
    except Exception as e:
        print(f"❌ Помилка отримання замовлення: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['POST'])
def create_order():
    """
    POST /api/orders
    Додати нове замовлення
    
    Body:
    {
        "address": "адреса доставки",
        "status": "нове"
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'address' not in data:
            return jsonify({'error': 'Address is required'}), 400
        
        address = data.get('address')
        status = data.get('status', 'нове')
        
        # Валідація статусу
        valid_statuses = ['нове', 'в дорозі', 'доставлено', 'скасовано']
        if status not in valid_statuses:
            return jsonify({'error': 'Invalid status'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO orders (address, status)
            VALUES (?, ?)
        ''', (address, status))
        
        order_id = cursor.lastrowid
        conn.commit()
        
        # Отримати новостворене замовлення
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        conn.close()
        
        print(f"✅ Замовлення #{order_id} створено: {address}")
        
        return jsonify({
            'id': order['id'],
            'address': order['address'],
            'status': order['status'],
            'date': order['date'],
            'created_at': order['created_at'],
            'updated_at': order['updated_at']
        }), 201
    
    except Exception as e:
        print(f"❌ Помилка створення замовлення: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    """
    PUT /api/orders/<id>
    Оновити замовлення
    
    Body:
    {
        "address": "нова адреса",
        "status": "в дорозі"
    }
    """
    try:
        data = request.get_json()
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Перевірити існування замовлення
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        
        if not order:
            conn.close()
            return jsonify({'error': 'Order not found'}), 404
        
        # Оновити поля якщо вони надійшли
        address = data.get('address', order['address'])
        status = data.get('status', order['status'])
        
        # Валідація статусу
        valid_statuses = ['нове', 'в дорозі', 'доставлено', 'скасовано']
        if status not in valid_statuses:
            conn.close()
            return jsonify({'error': 'Invalid status'}), 400
        
        cursor.execute('''
            UPDATE orders 
            SET address = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (address, status, order_id))
        
        conn.commit()
        
        # Отримати оновлене замовлення
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        updated_order = cursor.fetchone()
        conn.close()
        
        print(f"✅ Замовлення #{order_id} оновлено")
        
        return jsonify({
            'id': updated_order['id'],
            'address': updated_order['address'],
            'status': updated_order['status'],
            'date': updated_order['date'],
            'created_at': updated_order['created_at'],
            'updated_at': updated_order['updated_at']
        }), 200
    
    except Exception as e:
        print(f"❌ Помилка оновлення замовлення: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    """
    DELETE /api/orders/<id>
    Видалити замовлення
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Перевірити існування замовлення
        cursor.execute('SELECT * FROM orders WHERE id = ?', (order_id,))
        order = cursor.fetchone()
        
        if not order:
            conn.close()
            return jsonify({'error': 'Order not found'}), 404
        
        # Видалити замовлення
        cursor.execute('DELETE FROM orders WHERE id = ?', (order_id,))
        conn.commit()
        conn.close()
        
        print(f"✅ Замовлення #{order_id} видалено")
        
        return jsonify({'message': 'Order deleted successfully'}), 200
    
    except Exception as e:
        print(f"❌ Помилка видалення замовлення: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/orders', methods=['DELETE'])
def delete_all_orders():
    """
    DELETE /api/orders
    Видалити всі замовлення (НЕБЕЗПЕЧНО!)
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM orders')
        conn.commit()
        conn.close()
        
        print("⚠️  Всі замовлення видалені")
        
        return jsonify({'message': 'All orders deleted'}), 200
    
    except Exception as e:
        print(f"❌ Помилка видалення всіх замовлень: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """
    GET /api/stats
    Отримати статистику замовлень
    """
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Отримати кількість за статусами
        cursor.execute('''
            SELECT status, COUNT(*) as count 
            FROM orders 
            GROUP BY status
        ''')
        
        stats = {}
        total = 0
        for row in cursor.fetchall():
            stats[row['status']] = row['count']
            total += row['count']
        
        conn.close()
        
        return jsonify({
            'total': total,
            'by_status': stats,
            'timestamp': datetime.now().isoformat()
        }), 200
    
    except Exception as e:
        print(f"❌ Помилка отримання статистики: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ============================================================
# Error Handlers
# ============================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================================
# Main
# ============================================================

if __name__ == '__main__':
    # Ініціалізувати БД
    init_db()
    
    # Запустити сервер
    print("\n" + "="*50)
    print("🚀 Delivery Manager API")
    print("="*50)
    print("📍 http://localhost:5000")
    print("📚 API: http://localhost:5000/api")
    print("❤️  Health: http://localhost:5000/api/health")
    print("="*50 + "\n")
    
    # Режим development
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        use_reloader=True
    )
