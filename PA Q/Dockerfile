# ==============================================================================
# Java Practice Lab - High Performance Docker Container for Render & Cloud
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=5050

# Install Java JDK (default-jdk-headless is the standard package in Debian slim)
RUN mkdir -p /usr/share/man/man1 && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        default-jdk-headless \
        ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Install Python dependencies first for optimal Docker layer caching
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application assets and source files
COPY . .

# Pre-warm javac/java check during build
RUN javac -version && java -version

# Expose default port (Render will automatically override $PORT)
EXPOSE 5050

# Run with Gunicorn using multi-threading for concurrent requests
CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${PORT:-5050} --workers 2 --threads 4 --timeout 120 --access-logfile - --error-logfile - server:app"]
