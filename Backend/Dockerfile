FROM python:3.12-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1
ENV UV_PROJECT_ENVIRONMENT=/opt/venv

RUN pip install --no-cache-dir uv

COPY Backend/pyproject.toml /app/pyproject.toml
COPY Backend/uv.lock /app/uv.lock
RUN uv sync --frozen

COPY Backend/ /app/

EXPOSE 8000
CMD ["/opt/venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
