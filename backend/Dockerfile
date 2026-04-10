FROM python:3.11-slim

WORKDIR /app

# Встановлення залежностей системи
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Копіювання requirements
COPY requirements.txt .

# Встановлення Python залежностей
RUN pip install --no-cache-dir -r requirements.txt

# Копіювання коду додатку
COPY . .

# Встановлення порту
EXPOSE 5000

# Запуск додатку
CMD ["python", "app.py"]
