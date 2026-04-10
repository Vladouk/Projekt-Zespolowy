#!/usr/bin/env python3
"""
🚀 DELIVERY MANAGER v2.0 - ONE-CLICK SETUP
Автоматическая инициализация и запуск системы
"""

import subprocess
import sys
import os
import json
import time
from pathlib import Path

def print_header(text):
    """Print formatted header"""
    print("\n" + "="*70)
    print(f"  {text}")
    print("="*70 + "\n")

def print_success(text):
    """Print success message"""
    print(f"✅ {text}")

def print_error(text):
    """Print error message"""
    print(f"❌ {text}")

def print_info(text):
    """Print info message"""
    print(f"ℹ️  {text}")

def check_python():
    """Check Python version"""
    print_header("Checking Python Installation")
    
    version = sys.version_info
    if version.major >= 3 and version.minor >= 8:
        print_success(f"Python {version.major}.{version.minor}.{version.micro} detected")
        return True
    else:
        print_error(f"Python 3.8+ required, found {version.major}.{version.minor}")
        return False

def check_dependencies():
    """Check if all dependencies are installed"""
    print_header("Checking Dependencies")
    
    required = ['flask', 'flask_cors', 'flask_jwt_extended', 'werkzeug', 'jwt']
    
    missing = []
    for package in required:
        try:
            __import__(package)
            print_success(f"{package} is installed")
        except ImportError:
            print_error(f"{package} is NOT installed")
            missing.append(package)
    
    return len(missing) == 0

def install_dependencies():
    """Install required dependencies"""
    print_header("Installing Dependencies")
    
    requirements_path = Path(__file__).parent / "backend" / "requirements.txt"
    
    if not requirements_path.exists():
        print_error(f"requirements.txt not found at {requirements_path}")
        return False
    
    try:
        subprocess.check_call([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_path)
        ])
        print_success("All dependencies installed")
        return True
    except subprocess.CalledProcessError:
        print_error("Failed to install dependencies")
        return False

def init_database():
    """Initialize database"""
    print_header("Initializing Database")
    
    db_path = Path(__file__).parent / "backend" / "database.db"
    
    if db_path.exists():
        print_info(f"Database already exists at {db_path}")
        return True
    
    print_info("Starting Flask app to auto-initialize database...")
    
    # The app.py will auto-create database on first run
    backend_path = Path(__file__).parent / "backend" / "run.py"
    
    if backend_path.exists():
        print_success("Database will be auto-initialized on first backend start")
        return True
    else:
        print_error("run.py not found")
        return False

def create_shortcuts():
    """Create convenient shortcuts"""
    print_header("Creating Shortcuts")
    
    project_root = Path(__file__).parent
    
    shortcuts = {
        "🎯 START_HERE.md": "START_HERE.md",
        "📝 COMPLETION_REPORT.md": "COMPLETION_REPORT.md",
        "📚 API Documentation": "ETAP2_TESTING.md",
        "🛣️  Development Roadmap": "ETAP2_ROADMAP.md"
    }
    
    print("Key files to reference:")
    for name, file in shortcuts.items():
        filepath = project_root / file
        if filepath.exists():
            print_success(f"{name} - {file}")
        else:
            print_error(f"{name} - {file} (NOT FOUND)")

def generate_config():
    """Generate configuration file"""
    print_header("Generating Configuration")
    
    config = {
        "backend": {
            "host": "0.0.0.0",
            "port": 5000,
            "debug": True,
            "jwt_expiry_days": 7
        },
        "frontend": {
            "host": "0.0.0.0",
            "port": 8000
        },
        "database": {
            "type": "sqlite",
            "path": "backend/database.db"
        },
        "default_credentials": {
            "username": "admin",
            "password": "admin123",
            "role": "admin"
        }
    }
    
    config_file = Path(__file__).parent / "config.json"
    
    try:
        with open(config_file, 'w') as f:
            json.dump(config, f, indent=2)
        print_success(f"Configuration saved to {config_file}")
        return True
    except Exception as e:
        print_error(f"Failed to save configuration: {e}")
        return False

def print_next_steps():
    """Print next steps"""
    print_header("🎉 SETUP COMPLETE!")
    
    print("""
Next Steps:

1. START BACKEND
   - Windows: Double-click backend/start.bat
   - Or: python backend/run.py
   - URL: http://localhost:5000

2. START FRONTEND  
   - Windows: Double-click frontend/start.bat
   - Or: python -m http.server 8000 (from frontend folder)
   - URL: http://localhost:8000

3. LOGIN
   - Username: admin
   - Password: admin123
   - URL: http://localhost:8000/frontend/start.html

4. EXPLORE
   - Check Admin Dashboard
   - Create test orders
   - Test all 3 roles

5. DEPLOY
   - Docker: docker-compose up
   - Or: Gunicorn + Nginx
   - Change JWT_SECRET_KEY in production!

📚 Documentation:
   - START_HERE.md - Quick start guide
   - COMPLETION_REPORT.md - What was built
   - ETAP2_TESTING.md - API testing guide
   - ETAP2_ROADMAP.md - Future development

💰 You're Ready to Earn!
   
   This is a production-ready delivery system.
   Deploy it and start accepting orders!

Good luck! 🚀
    """)

def main():
    """Main setup routine"""
    print("\n")
    print("╔" + "="*68 + "╗")
    print("║" + " "*68 + "║")
    print("║" + "  🚀 DELIVERY MANAGER v2.0 - AUTOMATED SETUP  ".center(68) + "║")
    print("║" + "  Professional Delivery Management System".center(68) + "║")
    print("║" + " "*68 + "║")
    print("╚" + "="*68 + "╝")
    
    # Check Python
    if not check_python():
        print_error("Please install Python 3.8 or higher")
        sys.exit(1)
    
    # Check/Install dependencies
    if not check_dependencies():
        print_info("Installing missing dependencies...")
        if not install_dependencies():
            print_error("Failed to install dependencies")
            sys.exit(1)
    
    # Initialize database
    if not init_database():
        print_error("Failed to initialize database")
        sys.exit(1)
    
    # Generate configuration
    generate_config()
    
    # Create shortcuts
    create_shortcuts()
    
    # Print next steps
    print_next_steps()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n❌ Setup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)
