#!/bin/bash

# 🚀 DELIVERY MANAGER - Quick Start Script
# Linux/Mac версия

echo "🚀 Starting Delivery Manager System..."
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo ""

# Start Backend
echo "🔧 Starting Backend API on localhost:5000..."
cd "$(dirname "$0")/backend"

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

python3 app.py &
BACKEND_PID=$!
sleep 2
echo "✅ Backend PID: $BACKEND_PID"
echo ""

# Start Frontend
echo "🎨 Starting Frontend on localhost:8000..."
cd "../frontend"

# Start HTTP server
python3 -m http.server 8000 &
FRONTEND_PID=$!
sleep 2
echo "✅ Frontend PID: $FRONTEND_PID"
echo ""

# Show URLs
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🎉 DELIVERY MANAGER IS RUNNING! 🎉                ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  📱 Frontend:  http://localhost:8000                       ║"
echo "║     Login:     http://localhost:8000/login.html           ║"
echo "║                                                            ║"
echo "║  🔌 Backend API:  http://localhost:5000                   ║"
echo "║     Health:       http://localhost:5000/api/health        ║"
echo "║                                                            ║"
echo "║  🔑 Demo Account:                                          ║"
echo "║     Username: admin                                        ║"
echo "║     Password: admin123                                     ║"
echo "║                                                            ║"
echo "║  💻 Press Ctrl+C to stop all services                     ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Keep script running
wait $BACKEND_PID $FRONTEND_PID

echo ""
echo "🛑 Services stopped"
