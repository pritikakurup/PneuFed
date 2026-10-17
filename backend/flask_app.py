import io
import os
import torch
import torch.nn as nn
import torch.nn.functional as F
from PIL import Image
from flask import Flask, jsonify, request
from flask_cors import CORS
from torchvision import models, transforms

# ============================================================
# PNEUFED BACKEND - RESNET18 FEDERATED ROUND-20 INFERENCE
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


def resolve_model_path():
    """Resolves model checkpoint across local and Google Colab environments."""
    explicit_path = os.environ.get("MODEL_PATH")
    if explicit_path and os.path.exists(explicit_path):
        return explicit_path

    candidates = [
        # Colab Google Drive standard paths
        "/content/drive/MyDrive/PneuFed/models/global_model_round_20.pth",
        "/content/drive/MyDrive/PneuFed/local_models/global_model_round_20.pth",
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
        # Fallback for older torch versions
        checkpoint = torch.load(checkpoint_path, map_location=device)

    model.load_state_dict(checkpoint)
    model = model.to(device)
    model.eval()

    return model, device, checkpoint_path


def predict_image(image_bytes, model, device):
    """
    Takes raw image bytes and returns:
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


def create_app(model=None, device=None):
    """Flask application factory."""
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # If model is not injected (e.g. for testing), load it
    if model is None:
        try:
            loaded_model, detected_device, loaded_path = load_model()
            app.config["MODEL"] = loaded_model
            app.config["DEVICE"] = detected_device
            app.config["MODEL_PATH"] = loaded_path
            print(f"✅ Real ResNet18 model loaded from: {loaded_path} on {detected_device}")
        except Exception as e:
            print(f"⚠️ Warning: Could not load real model at startup: {e}")
            app.config["MODEL"] = None
            app.config["DEVICE"] = None
            app.config["MODEL_PATH"] = None
    else:
        app.config["MODEL"] = model
        app.config["DEVICE"] = device or torch.device("cpu")
        app.config["MODEL_PATH"] = "injected_test_model"

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, ngrok-skip-browser-warning, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        return response

    @app.route("/health", methods=["GET"])
    def health():
        has_real_model = app.config.get("MODEL") is not None
        return jsonify({
            "status": "ok",
            "model": "global_model_round_20",
            "model_loaded": has_real_model
        }), 200

    @app.route("/predict", methods=["POST"])
    def predict():
        if "image" not in request.files:
            return jsonify({"error": "No image field in request"}), 400

        file = request.files["image"]
        if not file or file.filename == "":
            return jsonify({"error": "Empty filename"}), 400

        current_model = app.config.get("MODEL")
        current_device = app.config.get("DEVICE")

        if current_model is None:
            return jsonify({
                "error": "Prediction model is not connected yet"
            }), 503

        try:
            image_bytes = file.read()
            prediction, confidence = predict_image(image_bytes, current_model, current_device)
            return jsonify({
                "prediction": prediction,
                "confidence": confidence,
                "model": "Global Round-20 ResNet18"
            }), 200
        except Exception as e:
            return jsonify({
                "error": f"Prediction failed: {str(e)}"
            }), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
