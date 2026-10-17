import io
import os
import sys
from PIL import Image
from fastapi.testclient import TestClient

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from backend.fastapi_app import create_fastapi_app, load_model

def run_table_5_4_tests():
    print("=" * 70)
    print("PNEUFED — TABLE 5.4 AUTOMATED VERIFICATION SUITE")
    print("=" * 70)

    checkpoint_path = "/Users/pritikaaa/PneuFed/models/global_model_round_20.pth"
    assert os.path.exists(checkpoint_path), f"Checkpoint missing at {checkpoint_path}"

    model, device, path = load_model(checkpoint_path=checkpoint_path)
    app = create_fastapi_app(injected_model=model, injected_device=device)

    results = []

    with TestClient(app) as client:
        # TC07: Health Check
        res_health = client.get("/health")
        tc07_pass = res_health.status_code == 200 and res_health.json().get("status") == "ok" and res_health.json().get("model_loaded") is True
        results.append(("TC07", "Open /health while backend running", "HTTP 200 with status: ok, model_loaded: true", f"Status {res_health.status_code}: {res_health.json()}", "Pass" if tc07_pass else "Fail"))

        # TC05: Submit without image
        res_missing = client.post("/predict", data={})
        tc05_pass = res_missing.status_code == 400 and ("No image field" in str(res_missing.json()))
        results.append(("TC05", "Submit without choosing image", "HTTP 400 with 'No image field in request'", f"Status {res_missing.status_code}: {res_missing.json()}", "Pass" if tc05_pass else "Fail"))

        # TC06: Upload non-image file
        res_non_img = client.post("/predict", files={"image": ("sample.txt", io.BytesIO(b"Non-image text file content"), "text/plain")})
        tc06_pass = res_non_img.status_code == 400 and ("Invalid image" in str(res_non_img.json()))
        results.append(("TC06", "Upload non-image file and verify rejection", "HTTP 400 with invalid image format rejection", f"Status {res_non_img.status_code}: {res_non_img.json()}", "Pass" if tc06_pass else "Fail"))

        # TC12: Load saved checkpoint & perform genuine model inference (NORMAL)
        normal_img_path = "/Users/pritikaaa/PneuFed/data/New_Dataset/test/NORMAL/synthetic_2151.jpg"
        with open(normal_img_path, "rb") as f:
            normal_bytes = f.read()
        res_normal = client.post("/predict", files={"image": ("synthetic_2151.jpg", io.BytesIO(normal_bytes), "image/jpeg")})
        data_normal = res_normal.json()
        tc12_pass = res_normal.status_code == 200 and data_normal.get("prediction") == "NORMAL" and 50.0 <= data_normal.get("confidence", 0) <= 100.0
        results.append(("TC12", "Load saved checkpoint & genuine inference (NORMAL)", "HTTP 200, prediction: NORMAL, confidence >= 50%", f"Prediction: {data_normal.get('prediction')}, Confidence: {data_normal.get('confidence')}%", "Pass" if tc12_pass else "Fail"))

        # TC03 & TC04: Submit valid image & receive actual prediction (PNEUMONIA)
        pneu_img_path = "/Users/pritikaaa/PneuFed/data/New_Dataset/test/PNEUMONIA/person321_bacteria_1489.jpeg"
        with open(pneu_img_path, "rb") as f:
            pneu_bytes = f.read()
        res_pneu = client.post("/predict", files={"image": ("person321_bacteria_1489.jpeg", io.BytesIO(pneu_bytes), "image/jpeg")})
        data_pneu = res_pneu.json()
        tc03_04_pass = res_pneu.status_code == 200 and data_pneu.get("prediction") == "PNEUMONIA" and 50.0 <= data_pneu.get("confidence", 0) <= 100.0
        results.append(("TC03/04", "Submit valid X-ray & receive genuine prediction (PNEUMONIA)", "HTTP 200, prediction: PNEUMONIA, confidence >= 50%", f"Prediction: {data_pneu.get('prediction')}, Confidence: {data_pneu.get('confidence')}%", "Pass" if tc03_04_pass else "Fail"))

    # TC10: Backend model unconnected simulation
    app_unconnected = create_fastapi_app(skip_model_load=True)
    with TestClient(app_unconnected) as client_unconnected:
        dummy_img = Image.new("RGB", (224, 224), color="gray")
        buf = io.BytesIO()
        dummy_img.save(buf, format="JPEG")
        buf.seek(0)
        res_unconnected = client_unconnected.post("/predict", files={"image": ("test.jpg", buf, "image/jpeg")})
        tc10_pass = res_unconnected.status_code == 503 and ("Prediction model is not connected yet" in str(res_unconnected.json()))
        results.append(("TC10", "Backend model unconnected simulation", "HTTP 503 with 'Prediction model is not connected yet'", f"Status {res_unconnected.status_code}: {res_unconnected.json()}", "Pass" if tc10_pass else "Fail"))

    for tid, name, expected, actual, status in results:
        print(f"[{status}] {tid}: {name}")
        print(f"    Expected: {expected}")
        print(f"    Actual:   {actual}")

    print("=" * 70)
    all_passed = all(r[4] == "Pass" for r in results)
    print(f"Summary: {'ALL AUTOMATED TEST CASES PASSED' if all_passed else 'SOME TESTS FAILED'}")
    return all_passed

if __name__ == "__main__":
    success = run_table_5_4_tests()
    sys.exit(0 if success else 1)
