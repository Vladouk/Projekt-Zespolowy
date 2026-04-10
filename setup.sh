#!/bin/bash

# Delivery Manager - Setup Script

echo "🚀 Delivery Manager Setup"
echo "=========================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 не встановлено"
    exit 1
fi

echo "✅ Python3 знайдено"

# Install backend dependencies
echo ""
echo "📦 Встановлення backend залежностей..."
cd backend
pip install -r requirements.txt
cd ..

echo ""
echo "✅ Setup завершено!"
echo ""
echo "🚀 Щоб запустити додаток:"
echo ""
echo "Backend (у першому терміналі):"
echo "  cd backend"
echo "  python app.py"
echo ""
echo "Frontend (у другому терміналі):"
echo "  cd frontend"
echo "  python -m http.server 8000"
echo ""
echo "📍 Додаток буде доступний на http://localhost:8000"
echo ""
