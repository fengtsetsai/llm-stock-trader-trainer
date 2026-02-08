FROM python:3.12-slim

WORKDIR /app

RUN pip install --no-cache-dir --upgrade pip

COPY backend/pyproject.toml backend/README.md ./
COPY backend/app/ ./app/

RUN pip install --no-cache-dir .

EXPOSE ${PORT:-8000}

CMD ["sh", "-c", "python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
