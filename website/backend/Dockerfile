FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    git \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY packages/ /app/packages/
COPY website/ /app/website/
COPY ai/ /app/ai/
COPY documents/ /app/documents/
COPY astro_ai.db /app/astro_ai.db

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["uvicorn", "website.backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
