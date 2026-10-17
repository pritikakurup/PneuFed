import io
import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from contextlib import asynccontextmanager
from typing import Optional
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException, Request, Response
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from torchvision import models, transforms

# ============================================================
# PNEUFED FASTAPI BACKEND - RESNET18 FEDERATED ROUND-20
# ============================================================

CLASS_NAMES = ["NORMAL", "PNEUMONIA"]

# Exact preprocessing pipeline used during federated training
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


def resolve_model_path() -> Optional[str]:
    """Resolves model checkpoint across local and Google Colab environments."""
    explicit_path = os.environ.get("MODEL_PATH")
    if explicit_path and os.path.exists(explicit_path):
        return explicit_path

    candidates = [
        # Colab Google Drive standard paths
        "/content/drive/MyDrive/PneuFed/local_models/global_model_round_20.pth",
        "/content/drive/MyDrive/PneuFed/models/global_model_round_20.pth",
        # Local workspace / repository paths
        "/Users/pritikaaa/PneuFed/models/global_model_round_20.pth",
        os.path.join(os.path.dirname(__file__), "..", "models", "global_model_round_20.pth"),
        os.path.join("models", "global_model_round_20.pth"),
    ]

    for path in candidates:
        if os.path.exists(path):
            return os.path.abspath(path)

    return None


def load_model(checkpoint_path=None, device=None):
    """Loads the trained ResNet18 federated Round-20 model."""
    if device is None:
        if torch.cuda.is_available():
            device = torch.device("cuda")
        elif torch.backends.mps.is_available():
            device = torch.device("mps")
        else:
            device = torch.device("cpu")

    if checkpoint_path is None:
        checkpoint_path = resolve_model_path()

    if not checkpoint_path or not os.path.exists(checkpoint_path):
        raise FileNotFoundError(
            f"Checkpoint global_model_round_20.pth not found. "
            f"Checked MODEL_PATH and standard locations. Current search failed."
        )

    model = models.resnet18(weights=None)
    model.fc = nn.Linear(model.fc.in_features, 2)

    try:
        checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
    except TypeError:
        checkpoint = torch.load(checkpoint_path, map_location=device)

    model.load_state_dict(checkpoint)
    model = model.to(device)
    model.eval()

    return model, device, checkpoint_path


def predict_image(image_bytes: bytes, model: nn.Module, device: torch.device):
    """
    Takes raw image bytes, runs through ResNet18, and returns:
    (prediction_label, confidence_percentage)
    """
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = preprocess(image).unsqueeze(0).to(device)

    with torch.no_grad():
        outputs = model(tensor)
        probabilities = F.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probabilities, dim=1)

    label = CLASS_NAMES[predicted_idx.item()]
    conf_pct = round(confidence.item() * 100, 2)
    return label, conf_pct


# Global container holding loaded model state
model_container = {
    "model": None,
    "device": None,
    "model_path": None,
    "is_loaded": False
}


def create_fastapi_app(injected_model=None, injected_device=None, skip_model_load: bool = False) -> FastAPI:
    """Factory creating configured FastAPI app with startup lifecycle and CORS."""

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Startup: Load model once if not already injected or skipped
        if skip_model_load:
            model_container["model"] = None
            model_container["is_loaded"] = False
            model_container["model_path"] = None
            print("⚠️ FastAPI initialized with model loading skipped")
        elif injected_model is not None:
            model_container["model"] = injected_model
            model_container["device"] = injected_device or torch.device("cpu")
            model_container["model_path"] = "injected_test_model"
            model_container["is_loaded"] = True
            print("✅ Injected model registered for FastAPI")
        else:
            try:
                model, device, path = load_model()
                model_container["model"] = model
                model_container["device"] = device
                model_container["model_path"] = path
                model_container["is_loaded"] = True
                print(f"✅ Real ResNet18 model loaded once at startup from: {path} on {device}")
            except Exception as e:
                print(f"⚠️ Warning: Model load failed at startup: {e}")
                model_container["is_loaded"] = False
        yield
        # Shutdown cleanup if needed

    app = FastAPI(
        title="PneuFed Inference API",
        description="Federated learning pneumonia detection API using ResNet18",
        version="2.0.0",
        lifespan=lifespan
    )

    # Configure CORS for deployed Vercel frontend and local development
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def add_custom_headers(request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, ngrok-skip-browser-warning, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return response

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Maps validation errors to HTTP 400 for contract consistency."""
        error_msg = exc.errors()[0].get("msg", "Validation error") if exc.errors() else "Validation error"
        return JSONResponse(
            status_code=400,
            content={
                "error": f"Invalid request: {error_msg}",
                "detail": f"Invalid request: {error_msg}"
            }
        )

    @app.exception_handler(HTTPException)
    async def custom_http_exception_handler(request: Request, exc: HTTPException):
        """Returns JSON with both error and detail keys for complete contract compatibility."""
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.detail,
                "detail": exc.detail
            }
        )

    @app.get("/health")
    async def health():
        """Health check endpoint confirming service status and model readiness."""
        return {
            "status": "ok",
            "model": "global_model_round_20",
            "model_loaded": model_container["is_loaded"]
        }

    @app.post("/predict")
    async def predict(image: Optional[UploadFile] = File(None)):
        """
        Receives uploaded X-ray image (field name 'image'),
        runs 224x224 ImageNet preprocessing and ResNet18 inference,
        and returns prediction and confidence.
        """
        if image is None:
            raise HTTPException(status_code=400, detail="No image field in request")

        if not image.filename or image.filename.strip() == "":
            raise HTTPException(status_code=400, detail="Empty filename")

        if not model_container["is_loaded"] or model_container["model"] is None:
            raise HTTPException(status_code=503, detail="Prediction model is not connected yet")

        contents = await image.read()
        if not contents or len(contents) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")

        try:
            prediction, confidence = predict_image(
                contents,
                model_container["model"],
                model_container["device"]
            )
            return {
                "prediction": prediction,
                "confidence": confidence,
                "model": "Global Round-20 ResNet18"
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image format or inference error: {str(e)}")

    return app


app = create_fastapi_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
