#!/usr/bin/env python3
"""
🚀 DELIVERY MANAGER - DUAL SERVER LAUNCHER
Starts both backend and frontend in one go
"""

import subprocess
import sys
import time
import os
import webbrowser
from threading import Thread

def start_backend():
    """Start Flask backend server"""
    print("\n" + "="*60)
    print("🔵 STARTING BACKEND SERVER...")
    print("="*60)
    
    backend_path = os.path.join(os.path.dirname(__file__), 'backend', 'run.py')
    
    try:
        subprocess.run([sys.executable, backend_path])
    except KeyboardInterrupt:
        print("\n❌ Backend stopped")
    except Exception as e:
        print(f"❌ Backend error: {e}")

def start_frontend():
    """Start HTTP server for frontend"""
    print("\n" + "="*60)
    print("🟢 STARTING FRONTEND SERVER...")
    print("="*60)
    
    frontend_path = os.path.join(os.path.dirname(__file__), 'frontend')
    os.chdir(frontend_path)
    
    try:
        subprocess.run([sys.executable, '-m', 'http.server', '8000'])
    except KeyboardInterrupt:
        print("\n❌ Frontend stopped")
    except Exception as e:
        print(f"❌ Frontend error: {e}")

def main():
    print("\n")
    print("╔" + "="*58 + "╗")
    print("║" + " "*58 + "║")
    print("║" + "  🚀 DELIVERY MANAGER v2.0 - PRODUCTION SYSTEM  ".center(58) + "║")
    print("║" + " "*58 + "║")
    print("╚" + "="*58 + "╝")
    print()
    
    print("📍 Backend:  http://localhost:5000")
    print("📍 Frontend: http://localhost:8000")
    print()
    print("🔑 Login with: admin / admin123")
    print()
    print("Press Ctrl+C to stop all servers")
    print()
    
    # Start servers in separate threads
    backend_thread = Thread(target=start_backend, daemon=True)
    frontend_thread = Thread(target=start_frontend, daemon=True)
    
    backend_thread.start()
    time.sleep(2)  # Wait for backend to start
    
    frontend_thread.start()
    time.sleep(2)  # Wait for frontend to start
    
    # Open browser after a delay
    time.sleep(2)
    print("\n🌐 Opening browser...")
    try:
        webbrowser.open('http://localhost:8000')
    except:
        pass
    
    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("🛑 SHUTTING DOWN...")
        print("="*60)
        print("✅ All servers stopped")
        print("="*60)
        sys.exit(0)

if __name__ == '__main__':
    main()
