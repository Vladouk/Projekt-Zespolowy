#!/usr/bin/env python3
"""
Delivery Manager - Initialization Script
Автоматична установка та конфігурація проекту
"""

import os
import sys
import subprocess
import platform

def print_header(text):
    """Вивести заголовок"""
    print("\n" + "="*50)
    print(f"  {text}")
    print("="*50 + "\n")

def run_command(cmd, description):
    """Виконати команду та перевірити результат"""
    print(f"⏳ {description}...")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ {description} успішно")
            return True
        else:
            print(f"❌ {description} не вдалось")
            print(result.stderr)
            return False
    except Exception as e:
        print(f"❌ Помилка: {e}")
        return False

def check_python():
    """Перевірити Python"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ потрібен")
        return False
    print(f"✅ Python {sys.version.split()[0]} знайдено")
    return True

def install_dependencies():
    """Встановити залежності"""
    print_header("Встановлення залежностей Python")
    
    if os.path.exists('backend/requirements.txt'):
        return run_command(
            f"{sys.executable} -m pip install -r backend/requirements.txt",
            "Встановлення Flask та інших пакетів"
        )
    else:
        print("❌ requirements.txt не знайдено")
        return False

def init_database():
    """Ініціалізувати БД"""
    print_header("Ініціалізація бази даних")
    
    if os.path.exists('backend/app.py'):
        os.system(f"cd backend && {sys.executable} -c \"from app import init_db; init_db()\"")
        print("✅ База даних ініціалізована")
        return True
    return False

def main():
    """Головна функція"""
    print_header("🚀 Delivery Manager - Setup")
    
    os_name = platform.system()
    print(f"💻 ОС: {os_name}")
    print(f"🐍 Python: {sys.version.split()[0]}")
    print(f"📁 Проект: {os.getcwd()}\n")
    
    # Перевірки
    if not check_python():
        print("❌ Setup не вдалось")
        return False
    
    # Встановлення залежностей
    if not install_dependencies():
        print("⚠️  Продовжуємо без деяких залежностей...")
    
    # Ініціалізація БД
    init_database()
    
    # Успіх
    print_header("✅ Setup завершено успішно!")
    
    print("🚀 Щоб запустити додаток:\n")
    print("1️⃣  Запустіть Backend:")
    print("   cd backend")
    print(f"   {sys.executable} app.py\n")
    
    print("2️⃣  Запустіть Frontend (у новому терміналі):")
    print("   cd frontend")
    if os_name == "Windows":
        print(f"   {sys.executable} -m http.server 8000")
    else:
        print(f"   python3 -m http.server 8000\n")
    
    print("3️⃣  Відкрийте у браузері:")
    print("   http://localhost:8000\n")
    
    print("📚 Документація:")
    print("   - README.md - загальна інформація")
    print("   - DEVELOPMENT.md - гайд для розробників")
    print("   - TESTING.md - план тестування")
    print("   - CHANGELOG.md - історія змін")
    print("   - ETAP1.md - звіт про Етап 1")
    
    return True

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
