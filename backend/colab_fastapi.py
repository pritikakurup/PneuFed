# ==============================================================================
# PNEUFED - GOOGLE COLAB FASTAPI BACKEND RUN SCRIPT
# Copy these cells into Google Colab to run the real ResNet18 FastAPI API
# ==============================================================================

# ------------------------------------------------------------------------------
# CELL 1: Free Port 5000 & Install Dependencies
# ------------------------------------------------------------------------------
"""
import subprocess
subprocess.run(['fuser', '-k', '5000/tcp'], capture_output=True)
print('✅ Port 5000 cleared')

!pip install -q fastapi uvicorn python-multipart pyngrok torch torchvision pillow
print('✅ Dependencies installed: FastAPI, Uvicorn, PyTorch, Pillow, pyngrok')
"""

# ------------------------------------------------------------------------------
# CELL 2: Mount Google Drive
# ------------------------------------------------------------------------------
"""
from google.colab import drive
drive.mount('/content/drive')
print('✅ Google Drive mounted')
"""

# ------------------------------------------------------------------------------
# CELL 3: Load Real ResNet18 Round-20 Model Checkpoint
# ------------------------------------------------------------------------------
"""
import os, torch, torchvision.models as models
import torch.nn as nn

candidates = [
    '/content/drive/MyDrive/PneuFed/local_models/global_model_round_20.pth',
    '/content/drive/MyDrive/PneuFed/models/global_model_round_20.pth'
]
MODEL_PATH = next((p for p in candidates if os.path.exists(p)), None)

if not MODEL_PATH:
    for root, dirs, files in os.walk('/content/drive/MyDrive/PneuFed'):
        if 'global_model_round_20.pth' in files:
            MODEL_PATH = os.path.join(root, 'global_model_round_20.pth')
            break

if not MODEL_PATH:
    raise FileNotFoundError("Could not find global_model_round_20.pth in Google Drive.")

print(f"✅ Found checkpoint: {MODEL_PATH}")
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

model = models.resnet18(weights=None)
model.fc = nn.Linear(model.fc.in_features, 2)
checkpoint = torch.load(MODEL_PATH, map_location=device)
model.load_state_dict(checkpoint)
model = model.to(device)
model.eval()
print("✅ Real ResNet18 Round-20 model loaded and ready in eval mode!")
"""

# ------------------------------------------------------------------------------
# CELL 4: Image Preprocessing (224x224, ImageNet Normalization)
# ------------------------------------------------------------------------------
"""
import io
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image

CLASS_NAMES = ['NORMAL', 'PNEUMONIA']

preprocess = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])

def predict_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    tensor = preprocess(image).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(tensor)
        probs = F.softmax(outputs, dim=1)
        confidence, predicted_idx = torch.max(probs, dim=1)
    label = CLASS_NAMES[predicted_idx.item()]
    conf_pct = round(confidence.item() * 100, 2)
    return label, conf_pct

print("✅ Preprocessing and inference function defined")
"""

# ------------------------------------------------------------------------------
# CELL 5: FastAPI Application with CORS & Routes
# ------------------------------------------------------------------------------
"""
from fastapi import FastAPI, File, UploadFile, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional

app = FastAPI(title='PneuFed FastAPI Inference', version='2.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

@app.middleware('http')
async def add_custom_headers(request: Request, call_next):
    response: Response = await call_next(request)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, ngrok-skip-browser-warning, Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    return response

@app.get('/health')
async def health():
    return {
        'status': 'ok',
        'model': 'global_model_round_20',
        'model_loaded': True
    }

@app.post('/predict')
async def predict(image: Optional[UploadFile] = File(None)):
    if image is None:
        return JSONResponse(status_code=400, content={'error': 'No image field in request', 'detail': 'No image field in request'})
    if not image.filename or image.filename.strip() == '':
        return JSONResponse(status_code=400, content={'error': 'Empty filename', 'detail': 'Empty filename'})
    contents = await image.read()
    if not contents:
        return JSONResponse(status_code=400, content={'error': 'Empty file contents', 'detail': 'Empty file contents'})
    try:
        prediction, confidence = predict_image(contents)
        return {
            'prediction': prediction,
            'confidence': confidence,
            'model': 'Global Round-20 ResNet18'
        }
    except Exception as e:
        return JSONResponse(status_code=400, content={'error': f'Invalid image format: {str(e)}', 'detail': str(e)})

print('✅ FastAPI routes defined: GET /health, POST /predict')
"""

# ------------------------------------------------------------------------------
# CELL 6: Start Uvicorn in Background Thread (Safely)
# ------------------------------------------------------------------------------
"""
import threading, time, subprocess, uvicorn

subprocess.run(['fuser', '-k', '5000/tcp'], capture_output=True)
time.sleep(1)

def run_uvicorn():
    config = uvicorn.Config(app=app, host='0.0.0.0', port=5000, log_level='info')
    server = uvicorn.Server(config)
    server.run()

uvicorn_thread = threading.Thread(target=run_uvicorn, daemon=True)
uvicorn_thread.start()
time.sleep(2)
print('✅ Uvicorn server is running FastAPI in background on port 5000')
"""

# ------------------------------------------------------------------------------
# CELL 7: Authenticate ngrok (Token input is hidden)
# ------------------------------------------------------------------------------
"""
from getpass import getpass
from pyngrok import ngrok

ngrok.kill()
token = getpass('🔐 Enter your ngrok authtoken (hidden): ')
ngrok.set_auth_token(token)
print('✅ ngrok authenticated successfully')
"""

# ------------------------------------------------------------------------------
# CELL 8: Connect ngrok Tunnel & Self-Test
# ------------------------------------------------------------------------------
"""
from pyngrok import ngrok
import requests

tunnel = ngrok.connect(5000)
PUBLIC_API_URL = tunnel.public_url

print('=' * 60)
print('🚀 FASTAPI BACKEND IS LIVE!')
print(f'Public API URL : {PUBLIC_API_URL}')
print(f'Health Check   : {PUBLIC_API_URL}/health')
print(f'Predict Route  : {PUBLIC_API_URL}/predict')
print('=' * 60)

# Automated self-test check
try:
    resp = requests.get(f'{PUBLIC_API_URL}/health', headers={'ngrok-skip-browser-warning': 'true'}, timeout=10)
    if resp.status_code == 200:
        print('✅ Health check PASSED:', resp.json())
        print('\\n📋 NEXT STEP: Copy the Public API URL above.')
        print('Open https://pbl-umber.vercel.app, click "Update URL", and paste it.')
    else:
        print('❌ Health check returned:', resp.status_code, resp.text)
except Exception as e:
    print('❌ Health check failed:', e)
"""
