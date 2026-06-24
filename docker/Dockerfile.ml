FROM python:3.12-slim
WORKDIR /app
RUN pip install --no-cache-dir fastapi uvicorn tensorflow numpy Pillow pydantic
COPY ml-service/ ./ml-service/
COPY predict_cnn.py nlp_predict.py ./
COPY models/ ./models/
EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8001/health')"
CMD ["uvicorn", "ml-service.main:app", "--host", "0.0.0.0", "--port", "8001"]
