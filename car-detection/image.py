from ultralytics import YOLO
import cv2, os

# ---- paths ----
MODEL_PATH = r"C:/Users/DELL/Desktop/car-detection/runs/content/runs/detect/train2/weights/best.pt"
IMAGE_PATH = r"C:/Users/DELL/Desktop/car-detection/dataset/31.png"
SAVE_PATH  = r"C:/Users/DELL/Desktop/car-detection/outputs/detected_image.png"
os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)

# ---- load model ----
model = YOLO(MODEL_PATH)    

# ---- read image ----
img = cv2.imread(IMAGE_PATH)
if img is None:
    raise FileNotFoundError(f"Image not found: {IMAGE_PATH}")

# ---- predict (image detection) ----
results = model.predict(
    img,
    conf=0.45,     # increase if false boxes appear (try 0.5~0.6)
    iou=0.5,
    verbose=False
)

# ---- annotate ----
annotated = results[0].plot()

# ---- show + save ----
cv2.imshow("Image Detection", annotated)
cv2.waitKey(0)
cv2.destroyAllWindows()
cv2.imwrite(SAVE_PATH, annotated)
print("✅ Saved:", SAVE_PATH)
