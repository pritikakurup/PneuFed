# ==============================================================================
# PNEUFED - GOOGLE COLAB BACKEND RUN SCRIPT
# Copy these cells into Google Colab to run the real ResNet18 Round-20 API
# ==============================================================================

# ------------------------------------------------------------------------------
# CELL 1: Kill any stale process on port 5000 and install dependencies
# ------------------------------------------------------------------------------
# !fuser -k 5000/tcp || true
# !pip install -q flask flask-cors pyngrok torch torchvision pillow

# ------------------------------------------------------------------------------
# CELL 2: Mount Google Drive
# ------------------------------------------------------------------------------
# from google.colab import drive
# drive.mount('/content/drive')

# ------------------------------------------------------------------------------
# CELL 3: Load the Real ResNet18 Round-20 Checkpoint
# ------------------------------------------------------------------------------
"""
import os
import torch
import torch.nn as nn
from torchvision import models

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# Candidate paths in Google Drive
candidates = [
    "/content/drive/MyDrive/PneuFed/models/global_model_round_20.pth",
    "/content/drive/MyDrive/PneuFed/local_models/global_model_round_20.pth"
]

MODEL_PATH = None
for path in candidates:
    if os.path.exists(path):
        MODEL_PATH = path
        break

if not MODEL_PATH:
    raise FileNotFoundError(f"Checkpoint not found in: {candidates}. Please verify Google Drive path.")

print(f"Loading checkpoint from: {MODEL_PATH}")

model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 2)
checkpoint = torch.load(MODEL_PATH, map_location=device)
model.load_state_dict(checkpoint)
model = model.to(device)
model.eval()

print("✅ Real Round-20 ResNet18 model loaded successfully and set to eval mode.")
"""

# ------------------------------------------------------------------------------
# CELL 4: Define Preprocessing & Prediction Functions
# ------------------------------------------------------------------------------
"""
import io
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image

CLASS_NAMES = ["NORMAL", "PNEUMONIA"]

# Exact 224x224 preprocessing with ImageNet normalization
preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def predict_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    tensor = preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(tensor)
        probs = F.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probs, dim=1)
    label = CLASS_NAMES[predicted_idx.item()]
    conf_pct = round(confidence.item() * 100, 2)
    return label, conf_pct
"""

# ------------------------------------------------------------------------------
# CELL 5: Flask Application with CORS and Routes
# ------------------------------------------------------------------------------
"""
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def add_cors(resp):
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type, ngrok-skip-browser-warning, Authorization"
    resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    return resp

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "model": "global_model_round_20",
        "model_loaded": True
    }), 200

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "No image field in request"}), 400
    file = request.files["image"]
    if not file or file.filename == "":
        return jsonify({"error": "Empty filename"}), 400
    try:
        prediction, confidence = predict_image(file.read())
        return jsonify({
            "prediction": prediction,
            "confidence": confidence,
            "model": "Global Round-20 ResNet18"
        }), 200
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500
"""

# ------------------------------------------------------------------------------
# CELL 6: Start Flask in Background Daemon Thread
# ------------------------------------------------------------------------------
"""
import threading, time, subprocess

# Ensure port 5000 is clean
subprocess.run(["fuser", "-k", "5000/tcp"], capture_output=True)
time.sleep(1)

def run_flask():
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)

flask_thread = threading.Thread(target=run_flask, daemon=True)
flask_thread.start()
time.sleep(2)
print("✅ Flask running in background on port 5000")
"""

# ------------------------------------------------------------------------------
# CELL 7: Authenticate ngrok securely (Prompt for token, never hardcode)
# ------------------------------------------------------------------------------
"""
from getpass import getpass
from pyngrok import ngrok

ngrok.kill()
auth_token = getpass("Enter your ngrok authtoken (hidden): ")
ngrok.set_auth_token(auth_token)
print("✅ ngrok authenticated")
"""

# ------------------------------------------------------------------------------
# CELL 8: Connect ngrok Tunnel and Print URL
# ------------------------------------------------------------------------------
"""
from pyngrok import ngrok
import requests

tunnel = ngrok.connect(5000)
public_url = tunnel.public_url

print("=" * 60)
print("🚀 BACKEND IS LIVE!")
print(f"Public API URL: {public_url}")
print(f"Health check  : {public_url}/health")
print(f"Predict route : {public_url}/predict")
print("=" * 60)

# Self-test health check
resp = requests.get(f"{public_url}/health", timeout=10)
print("Health response:", resp.json())
"""
