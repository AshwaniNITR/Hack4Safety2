# Use official lightweight Python image
FROM python:3.9-slim

# Set working directory
WORKDIR /app

# Environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for build caching)
COPY requirements.txt .

# Install TensorFlow CPU and dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy all application files
COPY . .

# Expose Flask port
EXPOSE 5000

# Run the Flask app
CMD ["python", "-u", "app.py"]
