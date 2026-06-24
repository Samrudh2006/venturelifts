"""
VentureLift ML Microservice
Serves CNN prediction and NLP analysis as a separate service.
Run: uvicorn ml-service.main:app --reload --port 8001
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import base64
import io
import json
import subprocess
import sys
from pathlib import Path

app = FastAPI(title="VentureLift ML Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ROOT = Path(__file__).resolve().parent.parent
MODELS_DIR = ROOT / "models"

class ImagePayload(BaseModel):
    image_base64: str

class TextPayload(BaseModel):
    text: str

class HealthResponse(BaseModel):
    status: str
    service: str
    models_available: list

@app.get("/health", response_model=HealthResponse)
async def health():
    models = [f.name for f in MODELS_DIR.iterdir() if f.suffix in (".keras", ".h5")]
    return HealthResponse(status="ok", service="venturelift-ml", models_available=models)

@app.post("/predict/cnn")
async def predict_cnn(payload: ImagePayload):
    try:
        script = ROOT / "predict_cnn.py"
        model_path = MODELS_DIR / "cnn_cifar10.keras"
        if not script.exists():
            raise HTTPException(500, "CNN prediction script not found")
        result = subprocess.run(
            [sys.executable, str(script), "--model-path", str(model_path)],
            input=payload.image_base64,
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0:
            raise HTTPException(500, result.stderr or "Prediction failed")
        return json.loads(result.stdout)
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "Prediction timed out")

@app.post("/analyze/nlp")
async def analyze_nlp(payload: TextPayload):
    try:
        script = ROOT / "nlp_predict.py"
        if not script.exists():
            raise HTTPException(500, "NLP script not found")
        result = subprocess.run(
            [sys.executable, str(script), "--text", payload.text],
            capture_output=True, text=True, timeout=15,
        )
        if result.returncode != 0:
            raise HTTPException(500, result.stderr or "NLP analysis failed")
        return json.loads(result.stdout)
    except subprocess.TimeoutExpired:
        raise HTTPException(504, "NLP analysis timed out")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
