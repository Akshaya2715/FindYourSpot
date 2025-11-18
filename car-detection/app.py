from flask import Flask, Response
from ultralytics import YOLO
import cv2, torch

app = Flask(__name__)

# ---- Load YOLO model ----
MODEL_PATH = r"C:\Users\DELL\Desktop\car\Car-parking-system\smart-park\car-detection\object-detection-2\runs\content\runs\detect\train2\weights\best.pt"
VIDEO_PATH = r"C:\Users\DELL\Desktop\car\Car-parking-system\smart-park\car-detection\dataset\easy.mp4"
model = YOLO(MODEL_PATH)

# ---- Generator function for streaming ----
def generate_frames():
    cap = cv2.VideoCapture(VIDEO_PATH)
    if not cap.isOpened():
        raise FileNotFoundError("Could not open video")

    while True:
        ret, frame = cap.read()
        if not ret:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # loop the video
            continue

        # Run YOLO detection
        results = model.predict(frame, conf=0.5, iou=0.5, device=0 if torch.cuda.is_available() else None, verbose=False)

        # Draw boxes
        for box in results[0].boxes:
            x1, y1, x2, y2 = box.xyxy[0].int().tolist()
            cls = int(box.cls[0])
            label = model.names[cls]

            color = (0, 0, 255) if label.lower() == "occupied" else (0, 255, 0)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, label, (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)

        # Encode to JPEG
        _, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

# ---- Route for video feed ----
@app.route('/api/video_feed')
def video_feed():
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(debug=True, port=5000)
