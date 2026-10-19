import io
import os
import sys
import pytest
from PIL import Image

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.app import create_app, load_model


@pytest.fixture(scope="module")
def real_model_and_device():
    """Loads the real ResNet18 Round-20 checkpoint."""
    checkpoint_path = "/Users/pritikaaa/PneuFed/models/global_model_round_20.pth"
    model, device, _ = load_model(checkpoint_path=checkpoint_path)
    return model, device


@pytest.fixture
def client_with_real_model(real_model_and_device):
    """Flask test client with real loaded model."""
    model, device = real_model_and_device
    app = create_app(model=model, device=device)
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture
def client_without_model():
    """Flask test client simulating uninitialized model state."""
    app = create_app()
    app.config["MODEL"] = None
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health_endpoint(client_with_real_model):
    """Tests that /health returns HTTP 200 and expected status."""
    response = client_with_real_model.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "ok"
    assert data["model"] == "global_model_round_20"
    assert data["model_loaded"] is True


def test_predict_missing_image_field(client_with_real_model):
    """Tests that /predict returns HTTP 400 when image field is missing."""
    response = client_with_real_model.post("/predict", data={})
    assert response.status_code == 400
    data = response.get_json()
    assert "error" in data
    assert "No image field" in data["error"]


def test_predict_empty_filename(client_with_real_model):
    """Tests that /predict returns HTTP 400 when file filename is empty."""
    data = {
        "image": (io.BytesIO(b"fake data"), "")
    }
    response = client_with_real_model.post(
        "/predict",
        data=data,
        content_type="multipart/form-data"
    )
    assert response.status_code == 400
    res_data = response.get_json()
    assert "Empty filename" in res_data["error"]


def test_predict_when_model_unconnected(client_without_model):
    """Tests that when model is not initialized, 503 is returned with clear error."""
    img = Image.new("RGB", (224, 224), color="gray")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    buf.seek(0)

    response = client_without_model.post(
        "/predict",
        data={"image": (buf, "test.jpg")},
        content_type="multipart/form-data"
    )
    assert response.status_code == 503
    data = response.get_json()
    assert data["error"] == "Prediction model is not connected yet"


def test_predict_real_normal_xray(client_with_real_model):
    """Tests inference on a real NORMAL X-ray image with the real ResNet18 model."""
    img_path = "/Users/pritikaaa/PneuFed/data/New_Dataset/test/NORMAL/synthetic_2151.jpg"
    assert os.path.exists(img_path), f"Test image {img_path} not found"

    with open(img_path, "rb") as f:
        img_bytes = f.read()

    response = client_with_real_model.post(
        "/predict",
        data={"image": (io.BytesIO(img_bytes), "synthetic_2151.jpg")},
        content_type="multipart/form-data"
    )

    assert response.status_code == 200
    data = response.get_json()
    # Verify non-placeholder
    assert data.get("error") is None
    assert data.get("prediction") != "Prediction model is not connected yet"
    assert data["prediction"] == "NORMAL"
    assert isinstance(data["confidence"], (int, float))
    assert 50.0 <= data["confidence"] <= 100.0


def test_predict_real_pneumonia_xray(client_with_real_model):
    """Tests inference on a real PNEUMONIA X-ray image with the real ResNet18 model."""
    img_path = "/Users/pritikaaa/PneuFed/data/New_Dataset/test/PNEUMONIA/person321_bacteria_1489.jpeg"
    assert os.path.exists(img_path), f"Test image {img_path} not found"

    with open(img_path, "rb") as f:
        img_bytes = f.read()

    response = client_with_real_model.post(
        "/predict",
        data={"image": (io.BytesIO(img_bytes), "person321_bacteria_1489.jpeg")},
        content_type="multipart/form-data"
    )

    assert response.status_code == 200
    data = response.get_json()
    # Verify non-placeholder
    assert data.get("error") is None
    assert data.get("prediction") != "Prediction model is not connected yet"
    assert data["prediction"] == "PNEUMONIA"
    assert isinstance(data["confidence"], (int, float))
    assert 50.0 <= data["confidence"] <= 100.0


def test_cors_headers_and_ngrok_support(client_with_real_model):
    """Tests CORS headers and ngrok-skip-browser-warning support."""
    headers = {
        "Origin": "https://pbl-umber.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "ngrok-skip-browser-warning"
    }
    response = client_with_real_model.options("/predict", headers=headers)
    assert response.status_code == 200
    assert response.headers.get("Access-Control-Allow-Origin") == "*"
    assert "ngrok-skip-browser-warning" in response.headers.get("Access-Control-Allow-Headers", "")


def test_predict_portrait_and_landscape_orientations(client_with_real_model):
    """Tests that Flask backend handles both portrait and landscape orientations for NORMAL and PNEUMONIA."""
    # NORMAL Portrait
    norm_p = "/Users/pritikaaa/PneuFed/data/New_Dataset/test/NORMAL/NORMAL2-IM-1285-0001.jpeg"
    with open(norm_p, "rb") as f:
        res = client_with_real_model.post("/predict", data={"image": (io.BytesIO(f.read()), "norm_p.jpeg")}, content_type="multipart/form-data")
    assert res.status_code == 200
    assert res.get_json()["prediction"] == "NORMAL"

    # NORMAL Landscape
    norm_l = "/Users/pritikaaa/PneuFed/data/New_Dataset/test/NORMAL/NORMAL2-IM-1326-0001.jpeg"
    with open(norm_l, "rb") as f:
        res = client_with_real_model.post("/predict", data={"image": (io.BytesIO(f.read()), "norm_l.jpeg")}, content_type="multipart/form-data")
    assert res.status_code == 200
    assert res.get_json()["prediction"] == "NORMAL"

    # PNEUMONIA Portrait
    pneu_p = "/Users/pritikaaa/PneuFed/data/New_Dataset/test/PNEUMONIA/person1010_bacteria_2941.jpeg"
    with open(pneu_p, "rb") as f:
        res = client_with_real_model.post("/predict", data={"image": (io.BytesIO(f.read()), "pneu_p.jpeg")}, content_type="multipart/form-data")
    assert res.status_code == 200
    assert res.get_json()["prediction"] == "PNEUMONIA"

    # PNEUMONIA Landscape
    pneu_l = "/Users/pritikaaa/PneuFed/data/New_Dataset/test/PNEUMONIA/person321_bacteria_1489.jpeg"
    with open(pneu_l, "rb") as f:
        res = client_with_real_model.post("/predict", data={"image": (io.BytesIO(f.read()), "pneu_l.jpeg")}, content_type="multipart/form-data")
    assert res.status_code == 200
    assert res.get_json()["prediction"] == "PNEUMONIA"


def test_predict_exif_orientation_handling(client_with_real_model):
    """Tests that images with EXIF orientation metadata are properly rotated without blind rotation."""
    base_img = Image.open("/Users/pritikaaa/PneuFed/data/New_Dataset/test/NORMAL/NORMAL2-IM-1285-0001.jpeg")
    sideways = base_img.rotate(270, expand=True)
    exif = sideways.getexif()
    exif[0x0112] = 6

    buf = io.BytesIO()
    sideways.save(buf, format="JPEG", exif=exif)
    buf.seek(0)

    res = client_with_real_model.post("/predict", data={"image": (buf, "exif_portrait.jpg")}, content_type="multipart/form-data")
    assert res.status_code == 200
    data = res.get_json()
    assert data["prediction"] == "NORMAL"
    assert data["confidence"] >= 90.0

