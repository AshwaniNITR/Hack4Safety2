# -------------------- Base Image --------------------
FROM python:3.9-slim

# -------------------- Environment Variables --------------------
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# -------------------- Work Directory --------------------
WORKDIR /app

# -------------------- Install System Dependencies --------------------
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# -------------------- Copy Files --------------------
COPY requirements.txt .

# -------------------- Install Python Dependencies --------------------
RUN pip install --no-cache-dir -r requirements.txt

# -------------------- Copy Application --------------------
COPY . .

# -------------------- Expose Port --------------------
EXPOSE 5000

# -------------------- Run Flask App --------------------
CMD ["python", "app.py"]
