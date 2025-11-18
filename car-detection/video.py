from ultralytics import YOLO
import cv2, os, torch

# ---- paths ----
MODEL_PATH  = r"C:/Users/DELL/Desktop/car-detection/runs/content/runs/detect/train2/weights/best.pt"
VIDEO_PATH  = r"C:/Users/DELL/Desktop/car detection/dataset/easy.mp4"
OUTPUT_PATH = r"C:/Users/DELL/Desktop/car detection/outputs/detected_video.mp4"
os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)

# ---- load model ----
model = YOLO(MODEL_PATH)

# ---- open video ----
cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    raise FileNotFoundError(f"Could not open video: {VIDEO_PATH}")

fps = int(cap.get(cv2.CAP_PROP_FPS) or 30)
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out = cv2.VideoWriter(OUTPUT_PATH, fourcc, fps, (w, h))

# ---- detection loop ----
while True:
    ret, frame = cap.read()
    if not ret:
        break

    results = model.predict(
        frame,
        conf=0.5,    # confidence threshold
        iou=0.5,
        device=0 if torch.cuda.is_available() else None,
        verbose=False
    )

    # Get detection boxes
    for box in results[0].boxes:
        x1, y1, x2, y2 = box.xyxy[0].int().tolist()   # bounding box coords
        cls  = int(box.cls[0])                        # class id
        label = model.names[cls]                      # class name

        # ---- color selection based on class ----
        if label.lower() == "occupied":
            color = (0, 0, 255)   # RED
        else:
            color = (0, 255, 0)   # GREEN

        # Draw rectangle
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)

        # Put class name
        cv2.putText(frame, label, (x1, y1 - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

    cv2.imshow("Parking Detection", frame)
    out.write(frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release(); out.release(); cv2.destroyAllWindows()
print("✅ Saved:", OUTPUT_PATH)

