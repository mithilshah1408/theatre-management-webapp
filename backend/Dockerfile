# ── Backend Dockerfile ───────────────────────────────────────
FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (cached layer — only re-runs if requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source
COPY . .

EXPOSE 5000

# Runs Flask on 0.0.0.0 so it's reachable from outside the container
CMD ["python3", "application.py"]
