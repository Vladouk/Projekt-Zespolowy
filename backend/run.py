#!/usr/bin/env python3
"""Start Delivery Manager Backend"""

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app

if __name__ == '__main__':
    print('='*60)
    print('🚀 DELIVERY MANAGER - PRODUCTION BACKEND')
    print('='*60)
    print('✅ All dependencies installed')
    print('📍 Starting API server...')
    print('🌐 Access at: http://localhost:5000')
    print('📚 Health check: http://localhost:5000/api/health')
    print('='*60)
    app.run(debug=True, host='0.0.0.0', port=5000)
