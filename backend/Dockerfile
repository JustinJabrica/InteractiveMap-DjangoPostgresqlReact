# =============================================================================
# Django Backend Dockerfile
# =============================================================================
# This Dockerfile creates a container for the Django REST Framework backend
# 
# Build: docker build -t interactive-map-backend ./backend
# Run:   docker run -p 8000:8000 interactive-map-backend
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Base Python Image
# -----------------------------------------------------------------------------
FROM python:3.11-slim

# Set environment variables
# PYTHONDONTWRITEBYTECODE: Prevents Python from writing .pyc files
# PYTHONUNBUFFERED: Ensures Python output is sent straight to terminal
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory inside the container
WORKDIR /app

# -----------------------------------------------------------------------------
# Install System Dependencies
# -----------------------------------------------------------------------------
# - postgresql-client: For PostgreSQL database operations
# - gcc, libpq-dev: Required for compiling psycopg2 (PostgreSQL adapter)
# - netcat-openbsd: For waiting on database availability
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    libpq-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------------------------------------------------------
# Install Python Dependencies
# -----------------------------------------------------------------------------
# Copy requirements first to leverage Docker layer caching
# This means if requirements.txt doesn't change, this layer is cached
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# -----------------------------------------------------------------------------
# Copy Application Code
# -----------------------------------------------------------------------------
COPY . .

# -----------------------------------------------------------------------------
# Create Entrypoint Script
# -----------------------------------------------------------------------------
# This script waits for the database to be ready before starting Django
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "Waiting for PostgreSQL..."\n\
while ! nc -z $DB_HOST $DB_PORT; do\n\
  sleep 0.5\n\
done\n\
echo "PostgreSQL started!"\n\
\n\
# Run migrations\n\
echo "Running migrations..."\n\
python manage.py migrate --noinput\n\
\n\
# Collect static files (for production)\n\
echo "Collecting static files..."\n\
python manage.py collectstatic --noinput\n\
\n\
# Start the server\n\
exec "$@"' > /entrypoint.sh && chmod +x /entrypoint.sh

# -----------------------------------------------------------------------------
# Create Directory for Media Files
# -----------------------------------------------------------------------------
RUN mkdir -p /app/media

# -----------------------------------------------------------------------------
# Expose Port and Set Entrypoint
# -----------------------------------------------------------------------------
EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]

# Default command - use gunicorn for production
# For development, override with: python manage.py runserver 0.0.0.0:8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "backend.wsgi:application"]
