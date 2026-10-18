FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=5000
ENV MODEL_PATH=/app/models/global_model_round_20.pth

# Install dependencies with CPU-only PyTorch
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy application and model
COPY backend/ ./backend/
COPY models/ ./models/
COPY app.py ./

EXPOSE 5000

# Start Uvicorn
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-5000}"]
