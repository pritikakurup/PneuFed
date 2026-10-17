import io
import os
import sys
import pytest
from PIL import Image
from fastapi.testclient import TestClient

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.fastapi_app import create_fastapi_app, load_model


@pytest.fixture(scope="module")
def real_resnet18_model():
    """Loads the real ResNet18 Round-20 checkpoint."""
    checkpoint_path = "/Users/pritikaaa/PneuFed/models/global_model_round_20.pth"
    model, device, _ = load_model(checkpoint_path=checkpoint_path)
    return model, device


@pytest.fixture
def client_with_model(real_resnet18_model):
    """FastAPI TestClient with real loaded ResNet18 model."""
    model, device = real_resnet18_model
    app = create_fastapi_app(injected_model=model, injected_device=device)
    with TestClient(app) as client:
        yield client


@pytest.fixture
def client_without_model():
    """FastAPI TestClient simulating an uninitialized model state."""
    app = create_fastapi_app(skip_model_load=True)
    with TestClient(app) as client:
        yield client


def test_fastapi_health_endpoint(client_with_model):
    """TC07: Tests that /health returns HTTP 200 and model_loaded: True."""
    response = client_with_model.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["model"] == "global_model_round_20"
    assert data["model_loaded"] is True


def test_fastapi_predict_missing_image(client_with_model):
    """TC05: Tests that /predict returns HTTP 400 when image field is missing."""
    response = client_with_model.post("/predict", data={})
    assert response.status_code == 400
    data = response.json()
    assert "error" in data or "detail" in data
    error_msg = data.get("error") or data.get("detail")
    assert "No image field" in str(error_msg)


def test_fastapi_predict_empty_filename(client_with_model):
    """Tests that /predict returns HTTP 400 when file filename is empty."""
    files = {"image": ("", io.BytesIO(b"data"), "image/jpeg")}
    response = client_with_model.post("/predict", files=files)
    assert response.status_code == 400
    data = response.json()
    error_msg = str(data.get("error") or data.get("detail"))
    assert "Empty filename" in error_msg or "Invalid request" in error_msg


def test_fastapi_predict_invalid_image_file(client_with_model):
    """TC06: Tests that non-image/corrupted files are rejected with HTTP 400."""
    files = {"image": ("not_an_image.txt", io.BytesIO(b"this is plain text not an image"), "text/plain")}
    response = client_with_model.post("/predict", files=files)
    assert response.status_code == 400
    data = response.json()
    assert "Invalid image" in (data.get("error") or data.get("detail"))


def test_fastapi_predict_unconnected_model(client_without_model):
    """TC10: Tests that when model is not initialized, HTTP 503 is returned."""
    img = Image.new("RGB", (224, 224), color="gray")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    files = {"image": ("test.jpg", buf, "image/jpeg")}
    response = client_without_model.post("/predict", files=files)
    assert response.status_code == 503
    data = response.json()
    assert "Prediction model is not connected yet" in (data.get("error") or data.get("detail"))


def test_fastapi_predict_real_normal_xray(client_with_model):
    """TC03 & TC04 & TC12: Tests genuine ResNet18 prediction on a real NORMAL X-ray image."""
    img_path = "/Users/pritikaaa/PneuFed/data/New_Dataset/test/NORMAL/synthetic_2151.jpg"
    assert os.path.exists(img_path)

    with open(img_path, "rb") as f:
        img_bytes = f.read()

    files = {"image": ("synthetic_2151.jpg", io.BytesIO(img_bytes), "image/jpeg")}
    response = client_with_model.post("/predict", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data.get("error") is None
    assert data["prediction"] == "NORMAL"
    assert isinstance(data["confidence"], (int, float))
    assert 50.0 <= data["confidence"] <= 100.0
    assert data["model"] == "Global Round-20 ResNet18"


def test_fastapi_predict_real_pneumonia_xray(client_with_model):
    """TC03 & TC04 & TC12: Tests genuine ResNet18 prediction on a real PNEUMONIA X-ray image."""
    img_path = "/Users/pritikaaa/PneuFed/data/New_Dataset/test/PNEUMONIA/person321_bacteria_1489.jpeg"
    assert os.path.exists(img_path)

    with open(img_path, "rb") as f:
        img_bytes = f.read()

    files = {"image": ("person321_bacteria_1489.jpeg", io.BytesIO(img_bytes), "image/jpeg")}
    response = client_with_model.post("/predict", files=files)

    assert response.status_code == 200
    data = response.json()
    assert data.get("error") is None
    assert data["prediction"] == "PNEUMONIA"
    assert isinstance(data["confidence"], (int, float))
    assert 50.0 <= data["confidence"] <= 100.0


def test_fastapi_cors_and_custom_headers(client_with_model):
    """Tests CORS headers and ngrok-skip-browser-warning support in FastAPI."""
    headers = {
        "Origin": "https://pbl-umber.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "ngrok-skip-browser-warning"
    }
    response = client_with_model.options("/predict", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "*"
